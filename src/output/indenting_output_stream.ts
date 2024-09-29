export class IndentingOutputStream {
    private content: string = '';
    private indentLevel: number = 0;
    private indentString: string = '    ';

    constructor(indentString: string = '    ') {
        this.indentString = indentString;
    }

    write(text: string): void {
        this.content += text;
    }

    writeLine(text: string = ''): void {
        this.content +=
            this.indentString.repeat(this.indentLevel) + text + '\n';
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

    writeJoined<T>(
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
