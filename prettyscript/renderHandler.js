export function renderHandler(code) {
    let result = "";
    let i = 0;

    while (i < code.length) {
        const start = code.indexOf("render", i);
        if (start === -1) {
            result += code.slice(i);
            break;
        }

        result += code.slice(i, start);

        const openBrace = code.indexOf("{", start);
        if (openBrace === -1) {
            result += code.slice(start);
            break;
        }

        const beforeBrace = code.slice(start, openBrace);
        if (!/^render\s*$/.test(beforeBrace)) {
            result += code[start];
            i = start + 1;
            continue;
        }

        let depth = 0;
        let endIndex = -1;
        let inString = null;

        for (let j = openBrace; j < code.length; j++) {
            const char = code[j];

            if (char === '\\' && j + 1 < code.length) {
                j++;
                continue;
            }

            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = char;
                continue;
            }
            if (inString && char === inString) {
                inString = null;
                continue;
            }

            if (inString) {
                continue;
            }

            if (char === "{") depth++;
            if (char === "}") depth--;
            if (depth === 0) {
                endIndex = j;
                break;
            }
        }

        if (endIndex === -1) {
            result += code.slice(start);
            break;
        }

        const inner = code.slice(openBrace + 1, endIndex).trim();
        const transformed = "_PSb['render'](`" + inner + "`)";

        result += transformed;
        i = endIndex + 1;
    }

    return result;
}