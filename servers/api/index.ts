import { withCtx } from '../../src/core/context';
import { Database } from '../../src/core/database';
import { INPUT_LAYER_NAME_PATTERNS, loadClasses, executePath } from '../../src/core/core';
import { genId } from '../../src/foundation/utils';

import express from 'express';
import path from 'path';

// const dotenv = require("dotenv");
// dotenv.config();
const controllers = loadClasses(path.resolve(__dirname, '../../src/app'), INPUT_LAYER_NAME_PATTERNS.CONTROLLER);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

withCtx({ ctx: 'API' }, async () => Database.withDBM(async () => {

    
    // TODO
    app.all('/api/*', async (req, res) => {
        try {
            const params = req.params;
            const result = await executePath(params[0], res, req);

            res.json(result);
        } catch (e) {
            console.log(e);
            res.status(500).json({ error: e.message });
        }
    });

    const port = 30001
    app.listen(port, () => console.log(`🚀[Api server ready] at http://localhost:${port}/`))

}));
