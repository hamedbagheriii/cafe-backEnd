import swagger from '@elysiajs/swagger';
import { Elysia, error, t } from 'elysia';
import { userPanel } from './auth/auth';
import { movie } from './movie/movie';
import cors from '@elysiajs/cors';
import { category } from './category/category';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .use(swagger())
  .use(userPanel)
  .use(category)

  .listen(3100);
