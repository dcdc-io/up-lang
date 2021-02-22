import { Input, IRule, Result, Tibu } from "tibu"

const { parse: tibu, rule, many, either, all, optional, token } = Tibu

const utility = {
    StartOfLine: (input: Input) => {
        let result: Result;
        const matches = input.source.match(/\r\n|\r|\n/gm)
    }
}

const tokens = {
    WhitespaceAny: token("WhitespaceAny", /\s*/),
    WhitespaceAnyMultiline: token("WhitespaceAnyMultiline", /\s*/m),
    UntilEndOfLine: token("UntilEndOfLine", /.*$/m),
    CommentStart: token("CommentStart", "//"),
    Import: token("Import", "import"),
    From: token("From", "from"),
    NameOrIdentifier: token("NameOrIdentifier", /[a-z_@$]+[a-z_@$0-9]*/)
}

type Comment = {

}

export const statements = {
    statement: rule(() => statements.comment),
    comment: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.CommentStart,
        tokens.WhitespaceAny,
        tokens.UntilEndOfLine
    ).yields((r, y) => {
        return {
            location: { index: r.tokens[0].result.startloc },
            type: "comment",
            value: r.one("UntilEndOfLine"),
            raw: r.tokens.map(t => t.result.value).join("")
        }
    }),
    import: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.Import,
        tokens.WhitespaceAnyMultiline,
        either(
            () => statements.name,
            () => statements.destructuredNames
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        () => statements.stringLiteral
    ),
    name: rule(
        tokens.NameOrIdentifier
    ),
    stringLiteral: rule(
        either(
            rule(
                tokens.QuoteSingle, tokens.
            )
        )
    )
}

// export const parse = (code: string) => {
//     tibu(code)(
//         rule(many(statement))
//     )
// }