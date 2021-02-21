import { Tibu } from "tibu"

const { parse: tibu, rule, many, either, all, optional, token } = Tibu

export const statements = {
    statement: rule(() => statements.comment),
    comment: rule(
        () => rule(
            token("comment", "//")
        )
    )
}

export const parse = (code: string) => {
    tibu(code)(
        rule(many(statement))
    )
}