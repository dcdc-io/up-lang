import { Tibu } from "tibu"
import { statements } from '../src/parser';

const parse = code => (...rules:Parameters<ReturnType<typeof Tibu.parse>>) => Tibu.parse(code)(...rules)

describe('parser', () => {
    it('can parse one line comments', () => {
        parse("//")(
            statements.comment.yields((r,y) => {
                r.tokens[0] // ?
                y // ?
            })
        )
    })
})