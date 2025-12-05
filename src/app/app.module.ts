import { createServer } from 'http';
import { dispatch, app } from '@/app';
import { config } from '@/core';

export const startApp = async () => {
    const server = createServer(app);

    server.listen(config.port, () => dispatch('app:up'));
};
