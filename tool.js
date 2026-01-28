import fs from 'fs';

const tools = [{
    name: 'read_file',
    description:
      "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
    input_schema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to the file you want to read.',
            },
        },
        required: ['path'],
    },
    execute: async ({ path }) => {
        try {
            return fs.readFileSync(path, 'utf-8');
        } catch (error) {
            return `Error reading file: ${error.message}`;
        }
    },
}];

export default tools;