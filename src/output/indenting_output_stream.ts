export class IndentingOutputStream {
    private content: string = '';
    private indentLevel: number = 0;
    private indentString: string = '    ';
    pendingIndent: any;

    constructor(indentString: string = '    ') {
        this.indentString = indentString;
    }

    write(text: string): void {
        if (this.pendingIndent) {
            this.content += this.indentString.repeat(this.indentLevel);
            this.pendingIndent = false;
        }
        this.content += text;
    }

    writeLine(text: string = ''): void {
        if (this.pendingIndent) {
            this.content += this.indentString.repeat(this.indentLevel);
            this.pendingIndent = false;
        }
        this.content += text + '\n';
        this.pendingIndent = true;
    }

    indent(): void {
        this.indentLevel++;
    }

    dedent(): void {
        if (this.indentLevel > 0) {
            this.indentLevel--;
        }
    }

    indentDuring(fn: () => void): void {
        this.indent();
        fn();
        this.dedent();
    }

    join<T>(
        items: T[],
        separator: string,
        itemCallback: (item: T) => void
    ): void {
        items.forEach((item, index) => {
            if (index > 0) {
                this.write(separator);
            }
            itemCallback(item);
        });
    }

    toString(): string {
        return this.content;
    }
}
