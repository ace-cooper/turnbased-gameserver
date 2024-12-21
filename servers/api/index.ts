import { withCtx } from '../../src/core/context';
import { Database } from '../../src/core/database';
import { INPUT_LAYER_NAME_PATTERNS, loadClasses, executePath } from '../../src/core/core';
import { genId } from '../../src/foundation/utils';

import express from 'express';
import path from 'path';
import { API_PORT, CORS_WHITELIST, devMode, ENV, Environment, throwErrors } from '../../src/core/config';
import cors from 'cors';

// const dotenv = require("dotenv");
// dotenv.config();
const controllers = loadClasses(path.resolve(__dirname, '../../src/app'), INPUT_LAYER_NAME_PATTERNS.CONTROLLER);
Database.createDBM();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if ([Environment.STAGE, Environment.PROD].includes(ENV)) {
    app.set('trust proxy', true);
}

const corsOptions: any = CORS_WHITELIST == '*' || !CORS_WHITELIST ? '*' : {
    origin: (origin, callback) => {
      // TODO - add logic for a single origin
      if (CORS_WHITELIST.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
}

app.use(cors(corsOptions));

app.use(async (req, res, next) => await withCtx({ ctx: 'API' }, async () => Database.withDBM(async () => {
    next();
})));

app.all('/api/*', async (req, res) => {
    try {
        const params = req.params;
        const result: any = await executePath(params[0], res, req);
        if (res.headersSent) {
            return;
        }
        if (result?.status) {
            res.status(result.status);
        }
        res.json(result);
    } catch (e) {
        if (devMode || throwErrors) console.log(e);
        if (res.headersSent) {
            return;
        }
        res.status(e?.status || 500).json(e);
    } finally {
        res.end();
    }
});

app.listen(API_PORT, () => console.log(`🚀[Api server ready] at http://localhost:${API_PORT}/`))
