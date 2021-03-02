import { Tibu } from "tibu"
import { statements, tokens } from '../src/parser';

const { rule } = Tibu

const parse = code => (...rules: Parameters<ReturnType<typeof Tibu.parse>>) => Tibu.parse(code)(...rules)

const deleteProperty = (obj: any, removeKey: string): any => {
    delete obj[removeKey]
    if (typeof obj === "object") {
        for (const key in obj) {
            deleteProperty(obj[key], removeKey)
        }
    }
}

describe('parser', () => {
    it('can parse one line comments', () => {
        const result = parse("// hello world")(
            statements.comment
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "comment",
            raw: "// hello world",
            value: {
                index: 3,
                value: "hello world"
            }
        }])
    })

    it('can parse names', () => {
        const result = parse("hello")(
            statements.name
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "name",
            raw: "hello",
            value: [{
                location: { index: 0 },
                type: "name_part",
                raw: "hello",
                value: "hello",
            }]
        }])
    })

    it('can parse dotted names', () => {
        const result = parse("hello.world")(
            statements.name
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "name",
            raw: "hello.world",
            value: [{
                location: { index: 0 },
                type: "name_part",
                raw: "hello",
                value: "hello",
            }, {
                location: { index: 6 },
                type: "name_part",
                raw: "world",
                value: "world",
            }]
        }])
    })

    it('can parse destructered names', () => {
        let result = parse("{ foo, bar { foo } }")(
            statements.destructuredNames
        )
        result // ?
        deleteProperty(result[0], "parent")

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "destructuredName",
            raw: "{ foo, bar { foo } }",
            value: [{
                location: {
                    "index": 2,
                },
                raw: "foo",
                type: "name",
                value: [{
                    location: { index: 2 },
                    raw: "foo",
                    type: "name_part",
                    value: "foo"
                }],
            }, {
                location: {
                    "index": 7,
                },
                raw: "bar",
                type: "name",
                value: [{
                    location: { index: 7 },
                    raw: "bar",
                    type: "name_part",
                    value: "bar"
                }],
            }, {
                location: { index: 11 },
                type: "destructuredName",
                raw: "{ foo }",
                value: [{
                    location: {
                        "index": 13,
                    },
                    raw: "foo",
                    type: "name",
                    value: [{
                        location: { index: 13 },
                        raw: "foo",
                        type: "name_part",
                        value: "foo"
                    }],
                }]
            }]
        }])
    })

    it('can parse string literals', () => {
        const result = parse("'he\\tllo'")(
            statements.stringLiteral
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "string",
            raw: "'he\\tllo'",
            value: "he\tllo"
        }])
    })

    it('can parse import statements', () => {
        let result = parse("import { foo } from 'bar'")(
            statements.import
        )

        deleteProperty(result, "parent")

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "import",
            raw: "import { foo } from 'bar'",
            value: {
                import: {
                    location: { index: 7 },
                    type: "destructuredName",
                    raw: "{ foo }",
                    value: [{
                        location: { index: 9 },
                        type: "name",
                        raw: "foo",
                        value: [{
                            location: { index: 9 },
                            raw: "foo",
                            type: "name_part",
                            value: "foo"
                        }]
                    }]
                },
                source: {
                    location: { index: 20 },
                    type: "string",
                    raw: "'bar'",
                    value: "bar"
                }
            }
        }])
    })

    it('can parse dialect statements', () => {
        let result = parse("dialect { dockerfile } from docker")(
            statements.dialect
        )

        deleteProperty(result, "parent")

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "dialect",
            raw: "dialect { dockerfile } from docker",
            value: {
                dialect: {
                    location: { index: 8 },
                    type: "destructuredName",
                    raw: "{ dockerfile }",
                    value: [{
                        location: {
                            "index": 10,
                        },
                        raw: "dockerfile",
                        type: "name",
                        value: [{
                            location: { index: 10 },
                            type: "name_part",
                            raw: "dockerfile",
                            value: "dockerfile"
                        }],
                    }]
                },
                from: {
                    location: { index: 28 },
                    type: "name",
                    raw: "docker",
                    value: [{
                        location: { index: 28 },
                        type: "name_part",
                        raw: "docker",
                        value: "docker",
                    }]
                }
            }
        }])
    })
})