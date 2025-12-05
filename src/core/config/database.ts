import * as pg from 'pg';
import { Sequelize } from 'sequelize';
import { config } from './config';

const { dbHost, dbName, dbPassword, dbType, dbUser } = config.db;

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: dbType,
    dialectModule: pg,
    omitNull: false,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    sync: { alter: { drop: true } },
    dialectOptions: { ssl: { require: true } },
    ssl: true,
});
