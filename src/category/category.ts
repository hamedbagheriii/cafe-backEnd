import Elysia, { t } from 'elysia';
import { imgAwcClass } from '../imageAWS/upIMG';
import { auth, emailAdmin, Prisma } from '../auth/auth';

export const category = new Elysia().group('/category', (app) => {
  return (
    app
      .state('checkToken', null as any)

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

      // ! add category
      .post(
        '/add',
        async ({ body: { name, image }, set }) => {
          //  upload image to s3 =>
          const movieIMG = await imgAwcClass.uploadImage(image, 'cafeImage');
          if (!movieIMG.success) {
            set.status = 400;
            return {
              ...movieIMG,
            };
          }

          // add category =>
          const newCategory = await Prisma.category.create({
            data: {
              name,
              images: {
                create: {
                  name,
                  url: movieIMG.fileUrl || '',
                },
              },
            },
            include: {
              images: true,
            },
          });

          return {
            success: true,
            message: 'دسته بندی با موفقیت اضافه شد !',
            newCategory,
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

            // check category =>
            const checkCategory = await Prisma.category.findUnique({
              where: {
                name,
              },
            });
            if (checkCategory) {
              set.status = 400;
              return {
                success: false,
                message: 'دسته بندی با این نام در حال حاضر وجود دارد !',
              };
            }
          },
          body: t.Object({
            name: t.String({
              minLength: 3,
              error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
            }),
            image: t.File({ error: 'تصویر انتخاب نشده است !' }),
          }),
        }
      )

      // ! edit Category
      .put(
        '/category/:id',
        async ({ body: { name }, params: { id }, set }) => {
          const updateCategory = Prisma.category.update({
            where: {
              id,
            },
            data: {
              name,
            },
            include: {
              images: true,
            },
          });

          return {
            message: 'دسته بندی با موفقیت آپدیت شد !',
            success: true,
            updateCategory,
          };
        },
        {
          beforeHandle: async ({ body: { name }, params: { id }, set }) => {
            const checkCategory = await Prisma.category.findUnique({
              where: {
                name,
              },
            });

            if (!checkCategory) {
              set.status = 404;
              return {
                message: 'دسته بندی با این نام وجود ندارد !',
                success: false,
              };
            } else if (checkCategory && checkCategory.id !== id) {
              set.status = 401;
              return {
                message: 'دسته بندی با این نام در حال حاضر وجود دارد !',
                success: false,
              };
            }
          },
          body: t.Object({
            name: t.String({
              minLength: 3,
              error: 'نام باید دارای حداقل 3 کاراکتر باشد  !',
            }),
          }),
          params: t.Object({
            id: t.Number(),
          }),
        }
      )
  );
});
