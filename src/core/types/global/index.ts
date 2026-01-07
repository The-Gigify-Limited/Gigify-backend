import type { FileArray } from 'express-fileupload';
import { User as AppUser } from '../common';
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type

        export interface Request {
            file: FileArray | null | undefined;
            user?: AppUser | null;
        }
    }
}
