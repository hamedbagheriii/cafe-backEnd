import Elysia, { t } from 'elysia';
import { imgAwcClass } from '../imageAWS/upIMG';
import { auth, emailAdmin, Prisma } from '../auth/auth';

export const product = new Elysia().group('/product', (app) => {
  return (
    app
      .state('checkToken', null as any)

      // ! get all Category
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

    // // ! check Token validate
    // .guard({
    //   headers: t.Object({
    //     authorization: t.String({ error: 'توکن اشتباه است !' }),
    //   }),
    // })
    // .onBeforeHandle(async ({ headers: { authorization }, store, set }) => {
    //   const checkToken = await auth.checkToken((authorization as string) || '');
    //   if (checkToken !== null && checkToken.userData.email === emailAdmin) {
    //     store.checkToken = checkToken;
    //   } else {
    //     return {
    //       message: 'توکن اشتباه است !',
    //       success: false,
    //     };
    //   }
    // })

    // // ! add category
    // .post(
    //   '/add',
    //   async ({ body: { name, image }, set }) => {
    //     //  upload image to s3 =>
    //     const movieIMG = await imgAwcClass.uploadImage(image, 'cafeImage');
    //     if (!movieIMG.success) {
    //       set.status = 400;
    //       return {
    //         ...movieIMG,
    //       };
    //     }

    //     // add category =>
    //     const newCategory = await Prisma.category.create({
    //       data: {
    //         name,
    //         images: {
    //           create: {
    //             name,
    //             url: movieIMG.fileUrl || '',
    //           },
    //         },
    //       },
    //       include: {
    //         images: true,
    //       },
    //     });

    //     return {
    //       success: true,
    //       message: 'دسته بندی با موفقیت اضافه شد !',
    //       newCategory,
    //     };
    //   },
    //   {
    //     beforeHandle: async ({ body: { image, name }, set }) => {
    //       // check image =>
    //       if (!image) {
    //         set.status = 404;
    //         return {
    //           success: false,
    //           message: 'عکس انتخاب نشده است !',
    //         };
    //       } else if (image.size <= 0) {
    //         set.status = 400;
    //         return {
    //           success: false,
    //           message: 'عکس انتخاب شده اطلاعاتی ندارد !',
    //         };
    //       }

    //       // check category =>
    //       const checkCategory = await Prisma.category.findUnique({
    //         where: {
    //           name,
    //         },
    //       });
    //       if (checkCategory) {
    //         set.status = 400;
    //         return {
    //           success: false,
    //           message: 'دسته بندی با این نام در حال حاضر وجود دارد !',
    //         };
    //       }
    //     },
    //     body: t.Object({
    //       name: t.String({
    //         minLength: 3,
    //         error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
    //       }),
    //       image: t.File({ error: 'تصویر انتخاب نشده است !' }),
    //     }),
    //   }
    // )

    // // ! check Category validate
    // .onBeforeHandle(async ({ params, store, set }) => {
    //   const { id }: { id: number } = params as any;
    //   const checkCategory = await Prisma.category.findUnique({
    //     where: {
    //       id,
    //     },
    //   });

    //   if (!checkCategory) {
    //     set.status = 404;
    //     store.checkCategory = null;

    //     return {
    //       message: 'دسته بندی با این آیدی وجود ندارد !',
    //       success: false,
    //     };
    //   } else {
    //     store.checkCategory = checkCategory;
    //   }
    // })

    // // ! edit Category
    // .put(
    //   '/category/:id',
    //   async ({ body: { name }, params: { id }, set }) => {
    //     const updateCategory = await Prisma.category.update({
    //       where: {
    //         id,
    //       },
    //       data: {
    //         name,
    //       },
    //       include: {
    //         images: true,
    //       },
    //     });

    //     return {
    //       message: 'دسته بندی با موفقیت آپدیت شد !',
    //       success: true,
    //       updateCategory,
    //     };
    //   },
    //   {
    //     beforeHandle: async ({ body: { name }, params: { id }, set }) => {
    //       const checkCategory = await Prisma.category.findUnique({
    //         where: {
    //           name,
    //         },
    //       });

    //       if (checkCategory && checkCategory.id !== id) {
    //         set.status = 401;
    //         return {
    //           message: 'دسته بندی با این نام در حال حاضر وجود دارد !',
    //           success: false,
    //         };
    //       }
    //     },
    //     body: t.Object({
    //       name: t.String({
    //         minLength: 3,
    //         error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
    //       }),
    //     }),
    //     params: t.Object({
    //       id: t.Number(),
    //     }),
    //   }
    // )

    // // ! delete Category
    // .delete(
    //   'delete/:id',
    //   async ({ params: { id } }) => {
    //     const delCategory = await Prisma.images
    //       .deleteMany({
    //         where: {
    //           categoryId: id,
    //         },
    //       })
    //       .then( async (res) => {
    //         return await Prisma.category.delete({
    //           where: {
    //             id,
    //           },
    //         });
    //       });

    //     return {
    //       message: 'دسته بندی با موفقیت حذف شد !',
    //       success: true,
    //     };
    //   },
    //   {
    //     params: t.Object({
    //       id: t.Number(),
    //     }),
    //   }
    // )
  );
});
