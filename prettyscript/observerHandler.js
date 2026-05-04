function parseObserveString(code) {
    let result = "";
    let i = 0;

    let inString = false;
    let stringChar = null;
    let escaped = false;
    let inLineComment = false;
    let inBlockComment = false;

    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1];

        if (inLineComment) {
            if (char === "\n") inLineComment = false;
            result += char;
            i++;
            continue;
        }

        if (inBlockComment) {
            if (char === "*" && next === "/") {
                inBlockComment = false;
                result += "*/";
                i += 2;
                continue;
            }
            result += char;
            i++;
            continue;
        }

        if (!inString && char === "/" && next === "/") {
            inLineComment = true;
            result += "//";
            i += 2;
            continue;
        }

        if (!inString && char === "/" && next === "*") {
            inBlockComment = true;
            result += "/*";
            i += 2;
            continue;
        }

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === stringChar) {
                inString = false;
                stringChar = null;
            }

            result += char;
            i++;
            continue;
        }

        if (char === '"' || char === "'" || char === "`") {
            inString = true;
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        if (
            code.startsWith("observe", i) &&
            !/[a-zA-Z0-9_$]/.test(code[i - 1] || "") &&
            !/[a-zA-Z0-9_$]/.test(code[i + 7] || "")
        ) {
            let j = i + 7;

            while (/\s/.test(code[j])) j++;

            let targetStart = j;
            while (j < code.length && code[j] !== "{") j++;

            if (code[j] !== "{") {
                result += char;
                i++;
                continue;
            }

            const targetExpr = code
                .slice(targetStart, j)
                .trim();

            let depth = 0;
            let bodyStart = j;
            let k = j;

            for (; k < code.length; k++) {
                if (code[k] === "{") depth++;
                if (code[k] === "}") depth--;

                if (depth === 0) break;
            }

            if (depth !== 0) {
                result += char;
                i++;
                continue;
            }

            const bodyContent = code
                .slice(bodyStart + 1, k)
                .trim();

            result += `_PSb["observer"]({ target: ${targetExpr}, ${bodyContent} });`;

            i = k + 1;
            continue;
        }

        result += char;
        i++;
    }

    return result;
}

export function observerHandler(code) {
    return parseObserveString(code);
}