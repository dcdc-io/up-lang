export default {
    async loadFile(filename: string) {
        return Stack.create()
    }
}

export class Stack {
    private constructor() {

    }
    static create(): Stack {
        return new Stack()
    }
    async configure(configurator: any) {

    }
    async signal(string: signal, context: any) {

    }
}