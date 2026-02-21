// types/express.d.ts
import { UserContext } from '@/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user: UserContext;
    }
  }
}

export {};
