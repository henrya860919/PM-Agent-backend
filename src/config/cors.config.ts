import { env } from '@/_env';
import cors from 'cors';
import { RequestHandler } from 'express';

const corsWhitelist = env.CORS_ORIGIN.split(',').map((url) => url.trim()) || [];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 開發環境允許所有
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // 允許無 origin 的請求或在白名單中
    if (!origin || corsWhitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: env.CORS_METHODS.split(',').map((method) => method.trim()),
  allowedHeaders: env.CORS_HEADERS.split(',').map((header) => header.trim()),
  credentials: env.CORS_CREDENTIALS,
};
export const corsConfig: RequestHandler = cors(corsOptions);
