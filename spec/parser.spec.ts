import { Tibu } from "tibu"
import { statements } from '../src/parser';

const parse = code => (...rules: Parameters<ReturnType<typeof Tibu.parse>>) => Tibu.parse(code)(...rules)

describe('parser', () => {
    it('can parse one line comments', () => {
        const result = parse("// hello world")(
            statements.comment
        )
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "comment",
            raw: "// hello world",
            value: "hello world"
        }])
    })

    it('can parse names', () => {
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

    xit('can parse import statements', () => {
        const result = parse("import { foo } from 'bar'")(
            statements.import
        ) // ?
        expect(result).toStrictEqual([{
            location: { index: 0 },
            type: "import",
            raw: "import { foo } from 'bar'",
            value: {
                import: {
                    location: { index: 7 },
                    type: "destructuredNames",
                    raw: "{ foo }",
                    value: [{
                        location: { index: 9 },
                        type: "name",
                        raw: "foo",
                        value: "foo"
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
})