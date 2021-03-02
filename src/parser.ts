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
    return arr.reduce((acc, value) => acc.concat(Array.isArray(value) ? flat(value) : value), [])
}

const tag = (tag: string, ruleToTag: () => IRule): IRule => {
    return rule(ruleToTag).yields((r, y) => {
        return { tag, value: flat(y) }
    })
}

const allTagged = (tag: string, y: any[]): any => {
    return flat<any>(flat(y).filter(x => x).filter(x => x.tag)).filter(x => x.tag === tag)
}

const firstTagged = (tag: string, y: any[]): any => {
    return flat<any>(flat(y).filter(x => x).filter(x => x.tag)).find(x => x.tag === tag)
}

export const tokens = {
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
        () => statements.comment
    ),
    comment: rule(
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
        tokens.Import,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("import:name", () => rule(statements.name)),
            tag("import:name", () => rule(statements.destructuredNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        tag("import:libname", () => rule(statements.stringLiteral))
    ).yields((r, y, f, { start }) => {
        const names = flat<{ raw: string }>(firstTagged("import:name", y).value).first()
        names // ?
        const libname = flat<{ raw: string }>(firstTagged("import:libname", y).value).first()
        return {
            location: { index: start },
            type: "import",
            raw: f.trim(),
            value: {
                import: names,
                source: libname
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
        tokens.LeftCurly,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("first:destructured", () => rule(
                tag("name", () => rule(statements.name)),
                tokens.WhitespaceAnyMultiline,
                tag("destructuredName", () => rule(statements.destructuredNames))
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
                tag("other:destructured", () => rule(
                    tag("name", () => rule(statements.name)),
                    tokens.WhitespaceAnyMultiline,
                    tag("destructuredName", () => rule(statements.destructuredNames))
                )),
                tag("other:normal", () => rule(
                    tag("name", () => rule(statements.name)),
                ))
            )
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.RightCurly
    ).yields((r, y, f) => {
        //if (y) {
        const firstDestructured = firstTagged("first:destructured", y) // ?
        const firstNormal = firstTagged("first:normal", y) // ?
        const otherDestructured = allTagged("other:destructured", y) // ?
        const otherNormal = allTagged("other:normal", y) // ?
        //}

        otherNormal.map(o => o.value).flat() // ?

        return {
            location: { index: r.tokens.first()?.result.startloc },
            type: "destructuredName",
            raw: f.trim(),
            value: [
                ...(firstNormal ? firstNormal.value : []).map(o => o.value).flat(),
                ...(firstDestructured ? firstDestructured.value : []).map(o => o.value).flat(),
                ...(otherNormal.length ? otherNormal.map((o: any) => o.value).flat() : []).map(o => o.value).flat(),
                ...(otherDestructured.length ? otherDestructured.map((o: any) => o.value).flat() : []).map(o => o.value).flat(),
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
    dialect: rule(
        tokens.Dialect,
        tokens.WhitespaceAnyMultiline,
        either(
            tag("dialect:name", () => rule(statements.name)),
            tag("dialect:name", () => rule(statements.destructuredNames))
        ),
        tokens.WhitespaceAnyMultiline,
        tokens.From,
        tokens.WhitespaceAnyMultiline,
        tag("dialect:from", () => rule(statements.name))
    ).yields((r, y, f, { start }) => {
        const dialectname = flat<{ raw: string }>(firstTagged("dialect:name", y).value).first()
        const dialectfrom = flat<{ raw: string }>(firstTagged("dialect:from", y).value).first()
        return {
            location: { index: start },
            type: "dialect",
            raw: f,
            value: {
                dialect: dialectname,
                from: dialectfrom
            }
        }
    }),
    typeReference: rule(
        () => statements.name,
        optional(
            tokens.WhitespaceAnyMultiline,
            tokens.LeftAngle,
            tokens.WhitespaceAnyMultiline,
            () => statements.typeReference,
            tokens.WhitespaceAnyMultiline,
            many(
                tokens.Comma,
                tokens.WhitespaceAnyMultiline,
                () => statements.typeReference
            ),
            tokens.RightAngle,
        ),
        many(
            tokens.WhitespaceAnyMultiline,
            tokens.LeftSquare,
            tokens.WhitespaceAnyMultiline,
            tokens.RightSquare
        )

    ),
    typedName: rule(
        () => statements.typeReference,
        tokens.WhitespaceAnyMultiline,
        () => statements.name
    )
}

// export const parse = (code: string) => {
//     tibu(code)(
//         rule(many(statement))
//     )
// }