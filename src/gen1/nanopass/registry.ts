import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { hostname } from 'os';

const execPromise = promisify(exec);

const SCHEMA_PATH = path.join(__dirname, 'registry-schema.json');

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class Registry {
    private registry: Record<string, string>;
    private registryDir: string;

    constructor(registryPath: string) {
        const registrySource = fs.readFileSync(registryPath, 'utf-8');
        try {
            this.registry = JSON.parse(registrySource);
        } catch (error) {
            throw new SyntaxError(`Failed to parse registry JSON: ${(error as Error).message}`);
        }

        this.validateRegistry();
        this.registryDir = path.dirname(registryPath);
    }

    private validateRegistry(): void {
        const ajv = new Ajv();
        const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
        const validate = ajv.compile(schema);
        if (!validate(this.registry)) {
            throw new ValidationError(`Registry validation failed: ${ajv.errorsText(validate.errors)}`);
        }
    }

    private validateFqn(fqn: string): void {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*(::([a-zA-Z_][a-zA-Z0-9_]*))*$/.test(fqn)) {
            throw new Error(`Invalid FQN: ${fqn}. FQNs must use '::' as separator.`);
        }
    }

    public resolvePath(fqn: string, filename: string): string {
        this.validateFqn(fqn);
        if (!this.registry[fqn]) {
            throw new Error(`Module path "${fqn}" not found in registry`);
        }

        return path.resolve(this.registryDir, this.registry[fqn], `${filename}`);
    }

    public readInput(fqn: string, filename: string): string {
        const filePath = this.resolvePath(fqn, filename);
        return fs.readFileSync(filePath, 'utf-8');
    }

    public async writeOutput(fqn: string, content: string, filename: string): Promise<void> {
        const outputPath = this.resolvePath(fqn, filename);

        const oldPath = path.join(path.dirname(outputPath), `${path.basename(outputPath)}`);

        const newPath = path.join(path.dirname(outputPath), `new.${path.basename(outputPath)}`);
        const header = `// Generated on ${new Date().toISOString()}\n`;
        fs.writeFileSync(newPath, header + content);
        await this.formatOutput(newPath);

        if (fs.existsSync(oldPath)) {
            const oldContent = fs.readFileSync(oldPath, 'utf-8');
            const oldContentWithoutHeader = oldContent.startsWith('// Generated on')
                ? oldContent.slice(oldContent.indexOf('\n') + 1).trim()
                : oldContent.trim();

            // We know the new content starts with '// Generated on' because we wrote it
            const newContent = fs.readFileSync(newPath, 'utf-8');
            const newContentWithoutHeader = newContent.slice(newContent.indexOf('\n') + 1).trim();

            // const newLines = newContentWithoutHeader.split('\n');
            // const oldLines = oldContentWithoutHeader.split('\n');

            // console.log(fqn, filename, 'old', oldLines[0]);
            // console.log(fqn, filename, 'new', newLines[0]);

            // let filesAreIdentical = true;

            // if (newContentWithoutHeader.length !== oldContentWithoutHeader.length) {
            //     console.log(
            //         fqn,
            //         filename,
            //         'Length mismatch',
            //         oldContentWithoutHeader.length,
            //         newContentWithoutHeader.length
            //     );
            //     filesAreIdentical = false;
            // }

            // for (let i = 0; i < Math.min(newContentWithoutHeader.length, oldContentWithoutHeader.length); i++) {
            //     if (newContentWithoutHeader[i] !== oldContentWithoutHeader[i]) {
            //         console.log(
            //             fqn,
            //             filename,
            //             'Content mismatch at',
            //             i,
            //             oldContentWithoutHeader[i],
            //             newContentWithoutHeader[i]
            //         );
            //         filesAreIdentical = false;
            //         break;
            //     }
            // }

            if (newContentWithoutHeader === oldContentWithoutHeader) {
                // console.log('File strings are identical: ', fqn, filename);
                fs.unlinkSync(newPath);
                return;
            }

            // if (filesAreIdentical) {
            //     console.log('Files are identical: ', fqn, filename);
            //     fs.unlinkSync(newPath);
            //     return;
            // }

            fs.unlinkSync(oldPath);
        }

        fs.renameSync(newPath, oldPath);
    }

    private async formatOutput(filePath: string): Promise<void> {
        const ext = path.extname(filePath);
        if (ext === '.ts' || ext === '.js' || ext === '.json') {
            await execPromise(`npx prettier --write "${filePath}"`);
        } else if (ext === '.rs') {
            await execPromise(`rustfmt "${filePath}"`);
        }
    }

    public relativePathToModule(from: string, to: string): string {
        this.validateFqn(from);
        this.validateFqn(to);
        const fromPath = path.resolve(this.registryDir, this.registry[from]);
        const toPath = path.resolve(this.registryDir, this.registry[to]);

        if (!fromPath || !toPath) {
            throw new Error(`Module path not found in registry: ${!fromPath ? from : to}`);
        }

        const relativePath = path.relative(fromPath, toPath);
        return relativePath.startsWith('.') ? relativePath : './' + relativePath;
    }
}
