import { withCtx } from '../../src/core/context';
import { Database } from '../../src/core/database';

import express from 'express';

// const dotenv = require("dotenv");
// dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

withCtx({}, async () => Database.withDBM(async () => {
    // TODO
    app.all('*', async (req, res) => {
        const params = req.params;
        console.log("new request: ", params, req)
        res.json({});
    });

    const port = 30001
    app.listen(port, () => console.log(`🚀[Api server ready] at http://localhost:${port}/`))

}));
