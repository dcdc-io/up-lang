import { promises } from "fs"

const { readFile } = promises;

export default {
    async load(filename: string) {
        const program = Program.create()
        await program.loadFile(filename)
        return program
    }
}

export class Node {
    private constructor() {

    }
    static emptyNode():Node {
        return new Node()
    }
    async parseAndMerge(source: {
        id: string, code: string
    }) {
        
    }
}
export class Program {
    config: { env?: Record<string, string> } = {}
    root: Node = Node.emptyNode()
    private constructor() {

    }
    static create(): Program {
        return new Program()
    }
    async loadFile(filename: string) {
        this.root.parseAndMerge({
            id: filename,
            code: (await readFile(filename)).toString()
        })
    }
    async configure(configurator: { env: Record<string, string> }) {
        this.config = configurator
    }
    async signal(name: string, context: any) {
        this.root.nodes.filter(node => node.name === name)
    }
}