import { Tibu } from "tibu"

const { parse: tibu, rule, many, either, all, optional, token } = Tibu

export const statements = {
    statement: {}
} 

const statement = rule(
    either(

    )
)

export const parse = (code: string) => {
    tibu(code)(
        rule(many(statement))
    )
}