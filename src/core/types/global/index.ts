import type { FileArray } from 'express-fileupload';
import { User } from '~/user/interfaces';
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type

        export interface Request {
            file: FileArray | null | undefined;
            user?: Partial<User> | null;
        }
    }
}
