import { Input, IRule, Result, Tibu } from "tibu"
import { flattenDiagnosticMessageText } from "typescript";
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
    return arr.reduce((acc, value) => acc.concat(value as any), [])
}

const tag = (tag: string, ruleToTag: () => IRule): IRule => {
    return rule(ruleToTag).yields((r, y) => {
        return { tag, value: y }
    })
}

const firstTagged = (tag: string, y: any[]): any => {
    return flat<any>(y.filter(x => x).filter(x => x.tag)).find(x => x.tag === tag)
}

const tokens = {
    WhitespaceAny: token("WhitespaceAny", /\s*/),
    WhitespaceAnyMultiline: token("WhitespaceAnyMultiline", /\s*/m),
    UntilEndOfLine: token("UntilEndOfLine", /.*$/m),
    CommentStart: token("CommentStart", "//"),
    Import: token("Import", "import"),
    Dialect: token("Dialect", "dialect"),
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
    ).yields((r, y, f) => {
        return {
            location: { index: r.tokens[0].result.startloc },
            type: "comment",
            value: r.one("UntilEndOfLine"),
            raw: f.trim() // r.tokens.map(t => t.result.value).join("")
        }
    }),
    import: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.Import,
        either(
            tag("import:name", () => rule(statements.name)),
            tag("import:name", () => rule(statements.destructuredNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        tag("import:libname", () => rule(statements.stringLiteral))
    ).yields((r, y) => {
        const names = flat<{ raw: string }>(firstTagged("import:name", y).value).first()
        const libname = flat<{ raw: string }>(firstTagged("import:libname", y).value).first()
        return {
            location: { index: 0 },
            type: "import",
            raw: r.tokens.slice(0, 3).map(token => token.result.value).join("") + names.raw + r.tokens.slice(2).map(token => token.result.value).join("") + libname.raw,
            value: {
                import: names,
                source: libname
            }
        }
    }),
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
    ).yields((r, y) => {
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
    destructuredNames: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.LeftCurly,
        tokens.WhitespaceAnyMultiline,
        either(
            rule(
                tokens.NameOrIdentifier,
                tag("destructuredName:first", () => rule(statements.destructuredNames))
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
                    tag("destructuredName:other", () => rule(statements.destructuredNames))
                ),
                rule(
                    tokens.NameOrIdentifier
                )
            )
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.RightCurly
    ).yields((r, y, f) => {
        y // ?
        //firstTagged("destructuredName:first", y) // ?
        return r.tokens.reduce((previous: any, current, index) => {
            switch (current.name) {
                case "LeftCurly":
                    const part = {
                        location: { index: current.result.startloc },
                        type: "destructuredName",
                        value: [],
                        raw: f.trim(),
                        ...(() => previous ? { parent: previous } : undefined)()
                    }
                    if (previous) {
                        previous.value.push(part)
                    }
                    return part
                case "NameOrIdentifier":
                    previous.value.push({
                        location: { index: current.result.startloc },
                        type: "name",
                        value: current.result.value,
                        raw: current.result.value,
                        parent: previous
                    })
                    return previous
                case "RightCurly":
                    return previous.parent || previous
                default:
                    return previous
            }
        }, false)
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
    dialect: rule(
        tokens.WhitespaceAnyMultiline,
        tokens.Dialect,
        either(
            tag("dialect:name", () => rule(statements.name)),
            tag("dialect:name", () => rule(statements.destructuredNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tag("dialect:from", () => rule(statements.name))
    ).yields((r, y, f) => {
        const dialectname = flat<{ raw: string }>(firstTagged("dialect:name", y).value).first()
        const dialectfrom = flat<{ raw: string }>(firstTagged("dialect:from", y).value).first()
        return {
            location: { index: r.tokens.first()!.result.startloc },
            type: "dialect",
            raw: f,
            value: {
                dialect: dialectname,
                from: dialectfrom
            }
        }
    })
}

// export const parse = (code: string) => {
//     tibu(code)(
//         rule(many(statement))
//     )
// }