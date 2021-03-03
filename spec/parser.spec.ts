import { Tibu } from "tibu"
import { statements, tokens } from '../src/parser';

const { rule } = Tibu

const parse = (code: string) => (...rules: Parameters<ReturnType<typeof Tibu.parse>>) => Tibu.parse(code)(...rules)

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

    it('can parse destructuring names', () => {
        let result = parse("{ foo, bar { foo } }")(
            statements.destructuringNames
        )
        deleteProperty(result[0], "parent")

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "destructuringName",
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
                type: "destructuringName",
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
        const result = parse("'he\\tha'")(
            statements.stringLiteral
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "string",
            raw: "'he\\tha'",
            value: "he\tha"
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
                    type: "destructuringName",
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

    it('can parse language statements', () => {
        let result = parse("language { dockerfile } from docker")(
            statements.language
        )

        deleteProperty(result, "parent")

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "language",
            raw: "language { dockerfile } from docker",
            value: {
                language: {
                    location: { index: 9 },
                    type: "destructuringName",
                    raw: "{ dockerfile }",
                    value: [{
                        location: {
                            "index": 11,
                        },
                        raw: "dockerfile",
                        type: "name",
                        value: [{
                            location: { index: 11 },
                            type: "name_part",
                            raw: "dockerfile",
                            value: "dockerfile"
                        }],
                    }]
                },
                from: {
                    location: { index: 29 },
                    type: "name",
                    raw: "docker",
                    value: [{
                        location: { index: 29 },
                        type: "name_part",
                        raw: "docker",
                        value: "docker",
                    }]
                }
            }
        }])
    })

    it('can parse typed names', () => {
        const result = parse("asset<dockerImageAsset> site")(
            statements.typedName
        )

        result // ?

        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "typedName",
            raw: "asset<dockerImageAsset> site",
            value: {
                type: {
                    location: { index: 0 },
                    type: "typeReference",
                    raw: "asset<dockerImageAsset>",
                    value: {
                        base: {
                            location: { index: 0 },
                            type: "name",
                            raw: "asset",
                            value: [{
                                location: { index: 0 },
                                type: "name_part",
                                raw: "asset",
                                value: "asset"
                            }]
                        },
                        arrayParameters: [],
                        genericParameters: [{
                            location: { index: 6 },
                            type: "typeReference",
                            raw: "dockerImageAsset",
                            value: {
                                base: {
                                    location: { index: 6 },
                                    type: "name",
                                    raw: "dockerImageAsset",
                                    value: [{
                                        location: { index: 6 },
                                        type: "name_part",
                                        raw: "dockerImageAsset",
                                        value: "dockerImageAsset"
                                    }]
                                },
                                arrayParameters: [],
                                genericParameters: []
                            }
                        }]
                    }
                },
                name: {
                    location: { index: 24 },
                    type: "name",
                    raw: "site",
                    value: [{
                        location: { index: 24 },
                        type: "name_part",
                        raw: "site",
                        value: "site"
                    }]
                }
            }
        }])
    })
})