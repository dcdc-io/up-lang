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
    NameOrIdentifier: token("NameOrIdentifier", /[a-z_@$]+[a-z_@$0-9]*/),
    Quoted: token("Quoted", /(['"])(?:(?!\1|\\).|\\.)*\1/),
    LeftCurly: token("LeftCurly", "{"),
    RightCurly: token("RightCurly", "}"),
    Comma: token("Comma", ","),
    Colon: token("Colon", ":"),
    Dot: token("Dot", ".")
}

type Comment = {

}

export const statements = {
    statement: rule(
        tokens.WhitespaceAnyMultiline,
        () => statements.comment
    ),
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
        tokens.WhitespaceAnyMultiline,
        tokens.NameOrIdentifier,
        optional(
            many(
                tokens.WhitespaceAnyMultiline,
                tokens.Dot,
                tokens.WhitespaceAnyMultiline,
                tokens.NameOrIdentifier
            )
        )
    ),
    destructuredNames: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.LeftCurly,
        tokens.WhitespaceAnyMultiline,
        either(
            rule(
                tokens.NameOrIdentifier,
                tokens.WhitespaceAnyMultiline,
                tokens.Colon,
                () => statements.destructuredNames
            ),
            rule(
                tokens.NameOrIdentifier
            )
        ),
        many(
            tokens.WhitespaceAnyMultiline,
            tokens.Comma,
            tokens.WhitespaceAnyMultiline,
            either(
                rule(
                    tokens.NameOrIdentifier,
                    tokens.WhitespaceAnyMultiline,
                    tokens.Colon,
                    () => statements.destructuredNames
                ),
                rule(
                    tokens.NameOrIdentifier
                )
            )
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.RightCurly
    ),
    stringLiteral: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.Quoted
    )
}

// export const parse = (code: string) => {
//     tibu(code)(
//         rule(many(statement))
//     )
// }