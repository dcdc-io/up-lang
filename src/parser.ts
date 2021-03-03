import { Input, IRule, Result, Tibu } from "tibu"
import { unesc } from "./utility";

const { parse: tibu, rule, many, either, all, optional, token } = Tibu

const utility = {
    StartOfLine: (input: Input) => {
        let result: Result;
        const matches = input.source.match(/\r\n|\r|\n/gm)
    }
}
declare global {
    interface Array<T> {
        first(): T | undefined
    }
}
Array.prototype.first = function <T>(): T | undefined {
    return this.length > 0 ? this[0] : undefined
}

const flat = <T>(arr: Array<T>): T[] => {
    return arr.reduce((acc, value) => acc.concat(Array.isArray(value) ? flat(value) : value), [])
}

const tag = (tag: string, ruleToTag: () => IRule): IRule => {
    return rule(ruleToTag).yields((r, y) => {
        return { tag, value: flat(y) }
    })
}

const allTagged = (tag: string, y: any[]): { tag: string, value: any[] }[] => {
    return flat<any>(flat(y).filter(x => x).filter(x => x.tag)).filter(x => x.tag === tag)
}

const firstTagged = (tag: string, y: any[]): { tag: string, value: any[] } => {
    return flat<any>(flat(y).filter(x => x).filter(x => x.tag)).find(x => x.tag === tag)
}

export const tokens = {
    WhitespaceAny: token("WhitespaceAny", /\s*/),
    WhitespaceAnyMultiline: token("WhitespaceAnyMultiline", /\s*/m),
    UntilEndOfLine: token("UntilEndOfLine", /.*$/m),
    CommentStart: token("CommentStart", "//"),
    Import: token("Import", "import"),
    Language: token("Language", "language"),
    From: token("From", "from"),
    NameOrIdentifier: token("NameOrIdentifier", /[a-z_@$]+[a-z_@$0-9]*/i),
    Quoted: token("Quoted", /(['"])(?:(?!\1|\\).|\\.)*\1/),
    LeftCurly: token("LeftCurly", "{"),
    RightCurly: token("RightCurly", "}"),
    LeftAngle: token("LeftAngle", "<"),
    RightAngle: token("RightAngle", ">"),
    LeftSquare: token("LeftSquare", "{"),
    RightSquare: token("RightSquare", "}"),
    Comma: token("Comma", ","),
    Colon: token("Colon", ":"),
    Dot: token("Dot", ".")
}

type Comment = {

}

export const statements = {
    statement: rule(
        () => statements.comment
    ),
    comment: rule(
        tokens.CommentStart,
        tokens.WhitespaceAny,
        tokens.UntilEndOfLine
    ).yields((r, y, f, { start }) => {
        return {
            location: { index: start },
            type: "comment",
            value: r.one("UntilEndOfLine"),
            raw: f.trim() // r.tokens.map(t => t.result.value).join("")
        }
    }),
    import: rule(
        tokens.Import,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("import:name", () => rule(statements.name)),
            tag("import:name", () => rule(statements.destructuringNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        tag("import:libraryName", () => rule(statements.stringLiteral))
    ).yields((r, y, f, { start }) => {
        const name = flat<{ raw: string }>(firstTagged("import:name", y).value).first()
        const libraryName = flat<{ raw: string }>(firstTagged("import:libraryName", y).value).first()
        return {
            location: { index: start },
            type: "import",
            raw: f.trim(),
            value: {
                import: name,
                source: libraryName
            }
        }
    }),
    name: rule(
        tokens.NameOrIdentifier,
        optional(
            many(
                tokens.WhitespaceAnyMultiline,
                tokens.Dot,
                tokens.WhitespaceAnyMultiline,
                tokens.NameOrIdentifier
            )
        )
    ).yields((r, y, f, {start}) => {
        const parts = r.tokens.filter(token => token.name === "NameOrIdentifier").map(token => {
            return {
                location: { index: token.result.startloc },
                type: "name_part",
                raw: token.result.value,
                value: token.result.value
            }
        })
        return {
            location: parts[0].location,
            type: "name",
            raw: r.tokens.map(token => token.result.value).join("").trim(),
            value: parts
        }
    }),
    destructuringNames: rule(
        tokens.LeftCurly,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("first:destructuring", () => rule(
                tag("name", () => rule(statements.name)),
                tokens.WhitespaceAnyMultiline,
                tag("destructuringName", () => rule(statements.destructuringNames))
            )),
            tag("first:normal", () => rule(
                tag("name", () => rule(statements.name))
            ))
        ),
        many(
            tokens.WhitespaceAnyMultiline,
            tokens.Comma,
            tokens.WhitespaceAnyMultiline,
            either(
                tag("other:destructuring", () => rule(
                    tag("name", () => rule(statements.name)),
                    tokens.WhitespaceAnyMultiline,
                    tag("destructuringName", () => rule(statements.destructuringNames))
                )),
                tag("other:normal", () => rule(
                    tag("name", () => rule(statements.name)),
                ))
            )
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.RightCurly
    ).yields((r, y, f, { start }) => {
        const firstDestructuring = firstTagged("first:destructuring", y)
        const firstNormal = firstTagged("first:normal", y)
        const otherDestructuring = allTagged("other:destructuring", y)
        const otherNormal = allTagged("other:normal", y)

        return {
            location: { index: start },
            type: "destructuringName",
            raw: f.trim(),
            value: [
                ...(firstNormal ? firstNormal.value : []).map(o => o.value).flat(),
                ...(firstDestructuring ? firstDestructuring.value : []).map(o => o.value).flat(),
                ...(otherNormal.length ? otherNormal.map((o: any) => o.value).flat() : []).map(o => o.value).flat(),
                ...(otherDestructuring.length ? otherDestructuring.map((o: any) => o.value).flat() : []).map(o => o.value).flat(),
            ]
        }
    }),
    stringLiteral: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.Quoted
    ).yields((r, y) => {
        const token = r.tokens.find(token => token.name === "Quoted")!
        return {
            location: { index: token.result.startloc },
            type: "string",
            raw: token.result.value,
            value: unesc(token.result.value.substr(1, token.result.value.length - 2))
        }
    }),
    language: rule(
        tokens.Language,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("language:name", () => rule(statements.name)),
            tag("language:name", () => rule(statements.destructuringNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        tag("language:from", () => rule(statements.name))
    ).yields((r, y, f, { start }) => {
        const languageName = flat<{ raw: string }>(firstTagged("language:name", y).value).first()
        const languageFrom = flat<{ raw: string }>(firstTagged("language:from", y).value).first()
        return {
            location: { index: start },
            type: "language",
            raw: f,
            value: {
                language: languageName,
                from: languageFrom
            }
        }
    }),
    typeReference: rule(
        tag("typeReference:name", () => rule(statements.name)),
        optional(
            tag("typeReference:generic", () => rule(
                tokens.WhitespaceAnyMultiline,
                tokens.LeftAngle,
                tokens.WhitespaceAnyMultiline,
                () => statements.typeReference,
                tokens.WhitespaceAnyMultiline,
                many(
                    tokens.Comma,
                    tokens.WhitespaceAnyMultiline,
                    () => statements.typeReference,
                    tokens.WhitespaceAnyMultiline
                ),
                tokens.RightAngle,
            ))
        ),
        many(
            tokens.WhitespaceAnyMultiline,
            tokens.LeftSquare,
            tokens.WhitespaceAnyMultiline,
            tokens.RightSquare
        )
    ).yields((r, y, f, { start }) => {
        const name = firstTagged("typeReference:name", y).value.flat().first()
        const generic = allTagged("typeReference:generic", y).flat().map(o => o.value).flat()

        return {
            location: { index: start },
            type: "typeReference",
            raw: f,
            value: {
                base: name,
                arrayParameters: [],
                genericParameters: generic
            }
        }
    }),
    typedName: rule(
        tag("typedName:typeReference", () => statements.typeReference),
        tokens.WhitespaceAnyMultiline,
        tag("typedName:name", () => statements.name)
    ).yields((r, y, f, { start }) => {
        firstTagged("typedName:typeReference", y).value.flat().first() // ?
        return {
            location: { index: start },
            type: "typedName",
            raw: f,
            value: {
                type: firstTagged("typedName:typeReference", y).value.flat().first(),
                name: firstTagged("typedName:name", y).value.flat().first()
            }
        }
    })
}

// export const parse = (code: string) => {
//     tibu(code)(
//         rule(many(statement))
//     )
// }