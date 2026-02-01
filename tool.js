import fs from 'fs';
import path from 'path';

const tools = [
  // =====================================================
  // READ FILE
  // =====================================================
  {
    name: 'read_file',
    description: "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to read.',
        },
      },
      required: ['path'],
    },

    execute: async ({ path: relativePath }) => {
      const baseDir = process.cwd();
      const targetPath = path.resolve(baseDir, relativePath);

      // 🔒 Sandbox protection
      if (!targetPath.startsWith(baseDir)) {
        return 'Access denied: invalid path';
      }

      try {
        if (!fs.existsSync(targetPath)) {
          return 'Error: file does not exist';
        }

        if (fs.lstatSync(targetPath).isDirectory()) {
          return 'Error: path is a directory, not a file';
        }

        // File size limit (10MB)
        const stats = fs.lstatSync(targetPath);
        const maxSize = 10 * 1024 * 1024;
        if (stats.size > maxSize) {
          return `Error: file too large (${stats.size} bytes). Maximum size is ${maxSize} bytes.`;
        }

        // File type filtering
        const ext = path.extname(targetPath).toLowerCase();
        const allowedExtensions = ['.js', '.ts', '.json', '.md', '.txt', '.css', '.html', '.py', '.yml', '.yaml', '.jsx', '.tsx'];
        
        if (ext && !allowedExtensions.includes(ext)) {
          return `Error: file type ${ext} not allowed for reading`;
        }

        // Block sensitive files
        const fileName = path.basename(targetPath).toLowerCase();
        const blockedFiles = ['.env', '.env.local', '.env.production', 'id_rsa', 'id_ed25519'];
        
        if (blockedFiles.includes(fileName) || fileName.startsWith('.env')) {
          return 'Error: access to sensitive files is not allowed';
        }

        return fs.readFileSync(targetPath, 'utf-8');
      } catch (error) {
        console.error(`Tool error in read_file:`, error);
        return `Error reading file: ${error.message}`;
      }
    },
  },

  // =====================================================
  // LIST FILES
  // =====================================================
  {
    name: 'list_files',
    description: 'List files and directories at a given relative path. Use this to explore the project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative directory path to list files from. Use "." for current directory.',
        },
      },
      required: [],
    },

    execute: async (input) => {
      const baseDir = process.cwd();
      const relativePath = input?.path || '.';
      const targetPath = path.resolve(baseDir, relativePath);

      // 🔒 Sandbox protection
      if (!targetPath.startsWith(baseDir)) {
        return 'Access denied: invalid path';
      }

      try {
        if (!fs.existsSync(targetPath)) {
          return 'Error: directory does not exist';
        }

        if (!fs.lstatSync(targetPath).isDirectory()) {
          return 'Error: path is not a directory';
        }

        const items = fs.readdirSync(targetPath, { withFileTypes: true });

        return items.map((item) => {
          const result = {
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
          };
          
          if (item.isFile()) {
            try {
              const filePath = path.join(targetPath, item.name);
              const stats = fs.lstatSync(filePath);
              result.size = stats.size;
              result.modified = stats.mtime.toISOString();
            } catch (error) {
              // Skip files we can't stat
            }
          }
          
          return result;
        });
      } catch (error) {
        console.error(`Tool error in list_files:`, error);
        return `Error listing files: ${error.message}`;
      }
    },
  },

  // =====================================================
  // WRITE FILE
  // =====================================================
  {
    name: 'write_file',
    description: 'Create or write a file at a given relative path. Use this to create new files or overwrite existing ones ONLY when explicitly intended.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to write.',
        },
        content: {
          type: 'string',
          description: 'Full content to write into the file.',
        },
        overwrite: {
          type: 'boolean',
          description: 'Must be true to overwrite an existing file. Prevents accidental destruction.',
        },
      },
      required: ['path', 'content', 'overwrite'],
    },

    execute: async ({ path: relativePath, content, overwrite }) => {
      const baseDir = process.cwd();
      const targetPath = path.resolve(baseDir, relativePath);

      // 🔒 Sandbox protection
      if (!targetPath.startsWith(baseDir)) {
        return 'Access denied: invalid path';
      }

      try {
        // Check if file exists and overwrite protection
        if (fs.existsSync(targetPath) && !overwrite) {
          return 'Error: file exists and overwrite is false. Set overwrite: true to replace existing file.';
        }

        // Block writing to sensitive files
        const fileName = path.basename(targetPath).toLowerCase();
        const blockedFiles = ['.env', '.env.local', '.env.production', 'package.json', 'package-lock.json'];
        
        if (blockedFiles.includes(fileName) || fileName.startsWith('.env')) {
          return 'Error: writing to sensitive files is not allowed';
        }

        // Ensure directory exists
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(targetPath, content, 'utf-8');
        return `Successfully wrote ${content.length} characters to ${relativePath}`;
      } catch (error) {
        console.error(`Tool error in write_file:`, error);
        return `Error writing file: ${error.message}`;
      }
    },
  },
];

export default tools;
