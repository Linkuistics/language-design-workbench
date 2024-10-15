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
        const contentWithHeader = this.addHeader(content);
        const formattedContent = await this.formatContent(contentWithHeader, outputPath);

        if (fs.existsSync(outputPath)) {
            const existingContent = fs.readFileSync(outputPath, 'utf-8');
            if (this.compareContents(existingContent, formattedContent)) {
                return;
            }
        }

        fs.writeFileSync(outputPath, formattedContent);
    }

    private addHeader(content: string): string {
        const header = `// Generated on ${new Date().toISOString()} by ${hostname()} at ${process.cwd()}\n\n`;
        return header + content;
    }

    private async formatContent(content: string, filePath: string): Promise<string> {
        const tempPath = path.join(path.dirname(filePath), `.temp_${path.basename(filePath)}`);
        fs.writeFileSync(tempPath, content);
        await this.formatOutput(tempPath);
        const formattedContent = fs.readFileSync(tempPath, 'utf-8');
        fs.unlinkSync(tempPath);
        return formattedContent;
    }

    private async formatOutput(filePath: string): Promise<void> {
        const ext = path.extname(filePath);
        if (ext === '.ts' || ext === '.js' || ext === '.json') {
            await execPromise(`npx prettier --write "${filePath}"`);
        } else if (ext === '.rs') {
            await execPromise(`rustfmt "${filePath}"`);
        }
    }

    private compareContents(existingContent: string, newContent: string): boolean {
        const existingLines = existingContent.split('\n');
        const newLines = newContent.split('\n');

        if (existingLines.length < 2 || newLines.length < 2) {
            return false;
        }

        const existingContentWithoutHeader = existingLines.slice(2).join('\n');
        const newContentWithoutHeader = newLines.slice(2).join('\n');

        return existingContentWithoutHeader.trim() === newContentWithoutHeader.trim();
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
