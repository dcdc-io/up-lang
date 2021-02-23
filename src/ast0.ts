namespace AST0 {
    type SourceLocation = {
        index: number
    }
    interface Node<T> {
        type: string
        location: SourceLocation
        raw: string
        value: T
    }
    
    class Name extends Node<string> {

    }

    export const emitName = (x:any):Name => {
        throw "no imp"
    }
}