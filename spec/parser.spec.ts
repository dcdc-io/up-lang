import { Tibu } from "tibu"
import { statements } from "../src/parser"

const parse = code => (...rules:Param) => Tibu.parse(code)(rules)

describe('parser', () => {
    it('can parse one line comments', () => {
        parse()(rule(statements.statement())
    })
})