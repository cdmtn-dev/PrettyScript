function shortFunctionDeclare(code) {
    // default functions
    const fnRegex = /^(\s*)(export\s+)?(async\s+)?fn\s+([a-zA-Z_$][\w$]*\s*\(.*\)\s*\{?)/gm;

    code = code.replace(fnRegex, (_, indent, exp, asyncKw, rest) => {
        let result = indent;
        if (exp) result += exp;
        if (asyncKw) result += asyncKw;
        result += "function " + rest;
        return result;
    });

    // arrow functions
    const arrowRegex = /\bfn\s*(\([^)]*\)|[a-zA-Z_$][\w$]*)?\s*=>/g;

    code = code.replace(arrowRegex, (_, args) => {
        if (!args) return "() =>";

        if (!args.startsWith("(")) {
            return `${args} =>`;
        }

        return `${args} =>`;
    });

    return code;
}

function shortAsyncFunctionDeclare(code) {
    const regex = /^(\s*)async\s+([a-zA-Z_$][\w$]*)\s*(\([^)]*\)\s*\{)/gm;

    return code.replace(regex, (_, indent, name, rest) => {
        return `${indent}async function ${name}${rest}`;
    });
}

function ifElseOperator(code) {
    let result = "";
    let i = 0;

    while (i < code.length) {
        const ifStart = code.indexOf("if ", i);
        if (ifStart === -1) {
            result += code.slice(i);
            break;
        }

        result += code.slice(i, ifStart);
        i = ifStart;

        const condStart = code.indexOf(" ", i + 3);
        const braceStart = code.indexOf("{", condStart);
        const conditionRaw = code.slice(i + 3, braceStart).trim();

        let depth = 1;
        let j = braceStart + 1;
        while (j < code.length && depth > 0) {
            if (code[j] === "{") depth++;
            if (code[j] === "}") depth--;
            j++;
        }

        const ifBlock = code.slice(braceStart, j)

        let elseBlock = "";
        let k = j;
        const elseIndex = code.indexOf("else", k);
        if (elseIndex === k) {
            const elseBrace = code.indexOf("{", elseIndex);
            let depthElse = 1;
            let m = elseBrace + 1;
            while (m < code.length && depthElse > 0) {
                if (code[m] === "{") depthElse++;
                if (code[m] === "}") depthElse--;
                m++;
            }
            elseBlock = code.slice(elseIndex, m);
            k = m;
        }

        const condition = conditionRaw
            .replace(/\band\b/g, "&&")
            .replace(/\bor\b/g, "||")
            .replace(/\bnot\b/g, "!=");

        result += `if (${condition}) ${ifBlock} ${elseBlock}`;
        i = k;
    }

    return result;
}

export function shortsHandler(code) {
    code = shortAsyncFunctionDeclare(code)
    code = shortFunctionDeclare(code)
    code = ifElseOperator(code)

    return code
}