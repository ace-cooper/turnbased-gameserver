import fs from 'fs';
import path from 'path';

export enum INPUT_LAYER_NAME_PATTERNS {
    GATEWAY = '.gateway.ts',
}

const registry = {
    [INPUT_LAYER_NAME_PATTERNS.GATEWAY]: {}
};

export function Gateway(name: string) {
    return function (constructor: any) {
        registry[INPUT_LAYER_NAME_PATTERNS.GATEWAY][name] = new constructor();
    };
}


export const loadClasses = (dir: string, pattern: INPUT_LAYER_NAME_PATTERNS): {
    [key: string]: any
} => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // If it's a directory, recursively load gateways from it
            loadClasses(fullPath, pattern);
        } else if (stat.isFile() && fullPath.endsWith(pattern)) {
            // If it's a .gateway.ts file, require it
            require(fullPath);
        }
    };

    return registry[pattern];
};


