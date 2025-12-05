import type { FileArray } from 'express-fileupload';
import type { ITokenSignedPayload } from '../common';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface User extends ITokenSignedPayload {}

        export interface Request {
            file: FileArray | null | undefined;
        }
    }
}
