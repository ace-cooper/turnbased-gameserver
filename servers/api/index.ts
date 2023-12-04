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
    app.get('*', async (req, res) => {
        const params = req.params;
        res.json({});
    });
    // TODO
    app.post('*', async (req, res) => {
        const body = req.body;
        res.json({});
    });

    app.delete('*', async (req, res) => {
        // TODO
        res.json({});
    });
    
    app.put('*', async (req, res) => {
        // TODO
        res.json({});
    });

    app.patch('*', async (req, res) => {
        // TODO
        res.json({});
    });

    const port = 30001
    app.listen(port, () => console.log(`🚀[Api server ready] at http://localhost:${port}/`))

}));
