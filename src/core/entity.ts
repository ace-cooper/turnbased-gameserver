import { validate } from 'class-validator';

export class ModelValidate {
    public async validate() {
        let errors = [];
        try {
            errors = await validate(this);
        } catch(e) {
            console.log('Caught promise rejection (validation failed). Errors: ', e);
        }
        if (errors.length > 0) {
            return {
                message: 'Validation failed',
                errors: errors.reduce((acc, c) => [...acc, ...Object.values(c.constraints)], [])
            };
        }
    }
}

export interface Guard {
    canActivate: () => Promise<boolean> | boolean;
}

export interface Middleware {
    use: () => Promise<void> | void;
}

export interface Interceptor {
    use: <T=any>(data?: T) => Promise<T> | T;
}
