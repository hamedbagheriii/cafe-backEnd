import Elysia, { t } from 'elysia';
import { imgAwcClass } from '../imageAWS/upIMG';
import { auth, emailAdmin, Prisma } from '../auth/auth';

export const product = new Elysia().group('/product', (app) => {
  return (
    app
      .state('checkToken', null as any)
      .state('checkProduct', null as any)

      // ! get all product
      .get(
        '/:id?',
        async ({ params: { id } }) => {
          let allProduct;
          const include = {
            images: true,
            categoryData: {
              include: {
                images: true,
              },
            },
          };

          if (id) {
            allProduct = await Prisma.product.findUnique({
              where: {
                id,
              },
              include,
            });
          } else {
            allProduct = await Prisma.product.findMany({
              include,
            });
          }

          return {
            success: true,
            message: ' محصولات ها با موفقیت بازیافت شد !',
            allProduct,
          };
        },
        {
          params: t.Object({
            id: t.Optional(t.Number()),
          }),
        }
      )

      // ! check Token validate
      .guard({
        headers: t.Object({
          authorization: t.String({ error: 'توکن اشتباه است !' }),
        }),
      })
      .onBeforeHandle(async ({ headers: { authorization }, store, set }) => {
        const checkToken = await auth.checkToken((authorization as string) || '');
        if (checkToken !== null && checkToken.userData.email === emailAdmin) {
          store.checkToken = checkToken;
        } else {
          return {
            message: 'توکن اشتباه است !',
            success: false,
          };
        }
      })

      // ! add product
      .post(
        '/add',
        async ({ body: { name, image, price, categoryId, decription }, set }) => {
          //  upload image to s3 =>
          const movieIMG = await imgAwcClass.uploadImage(image, 'cafeImage');
          if (!movieIMG.success) {
            set.status = 400;
            return {
              ...movieIMG,
            };
          }

          // add product =>
          const newProduct = await Prisma.product.create({
            data: {
              name,
              images: {
                create: {
                  name,
                  url: movieIMG.fileUrl || '',
                },
              },
              decription,
              price,
              categoryId,
            },
            include: {
              images: true,
            },
          });

          return {
            success: true,
            message: 'دسته بندی با موفقیت اضافه شد !',
            newProduct,
          };
        },
        {
          beforeHandle: async ({ body: { image, name }, set }) => {
            // check image =>
            if (!image) {
              set.status = 404;
              return {
                success: false,
                message: 'عکس انتخاب نشده است !',
              };
            } else if (image.size <= 0) {
              set.status = 400;
              return {
                success: false,
                message: 'عکس انتخاب شده اطلاعاتی ندارد !',
              };
            }

            // check product =>
            const checkProduc = await Prisma.product.findUnique({
              where: {
                name,
              },
            });
            if (checkProduc) {
              set.status = 400;
              return {
                success: false,
                message: ' محصول با این نام در حال حاضر وجود دارد !',
              };
            }
          },
          body: t.Object({
            name: t.String({
              minLength: 3,
              error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
            }),
            image: t.File({ error: 'تصویر انتخاب نشده است !' }),
            price: t.Number({
              error: 'حداقل قیمت باید ۱۰۰۰ تومان باشد !',
              minimum: 1000,
            }),
            categoryId: t.Number({
              error: 'شماره دسته بندی باید یک عدد باشد !',
              minimum: 1,
            }),
            decription: t.String({
              error: 'توضیحات باید بیش از 5 کاراکتر باشد !',
              minLength: 5,
            }),
          }),
        }
      )

      // ! check product validate
      .onBeforeHandle(async ({ params, store, set }) => {
        const { id }: { id: number } = params as any;
        const checkProduct = await Prisma.product.findUnique({
          where: {
            id,
          },
        });

        if (!checkProduct) {
          set.status = 404;
          store.checkProduct = null;

          return {
            message: 'محصول با این آیدی وجود ندارد !',
            success: false,
          };
        } else {
          store.checkProduct = checkProduct;
        }
      })

      // ! edit product
      .put(
        '/category/:id',
        async ({
          body: { name, price, decription, categoryId },
          params: { id },
          set,
        }) => {
          const updateCategory = await Prisma.product.update({
            where: {
              id,
            },
            data: {
              name,
              price,
              decription,
              categoryId,
            },
            include: {
              images: true,
            },
          });

          return {
            message: 'محصول با موفقیت آپدیت شد !',
            success: true,
            updateCategory,
          };
        },
        {
          beforeHandle: async ({ body: { name }, params: { id }, set }) => {
            const checkProduct = await Prisma.product.findUnique({
              where: {
                name,
              },
            });

            if (checkProduct && checkProduct.id !== id) {
              set.status = 401;
              return {
                message: 'محصول با این نام در حال حاضر وجود دارد !',
                success: false,
              };
            }
          },
          body: t.Object({
            name: t.String({
              minLength: 3,
              error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
            }),
            price: t.Number({
              error: 'حداقل قیمت باید ۱۰۰۰ تومان باشد !',
              minimum: 1000,
            }),
            categoryId: t.Number({
              error: 'شماره دسته بندی باید یک عدد باشد !',
              minimum: 1,
            }),
            decription: t.String({
              error: 'توضیحات باید بیش از 5 کاراکتر باشد !',
              minLength: 5,
            }),
          }),
          params: t.Object({
            id: t.Number(),
          }),
        }
      )

      // ! delete product
      .delete(
        'delete/:id',
        async ({ params: { id } }) => {
          const delProduct = await Prisma.images
            .deleteMany({
              where: {
                productId: id,
              },
            })
            .then(async (res) => {
              return await Prisma.product.delete({
                where: {
                  id,
                },
              });
            });

          return {
            message: 'محصول با موفقیت حذف شد !',
            success: true,
          };
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
        }
      )
  );
});
