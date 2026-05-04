function httpGetter(code) {
    const regex =
        /(?:const\s+([a-zA-Z_$][\w$]*)\s*=\s*)?(await\s+)?http:([a-zA-Z_$][\w$]*)\s*\{([\s\S]*?)\}/gm;

    return code.replace(regex, (_, varName, awaitKw, type, body) => {

        const parts = splitArgs(body);

        const args = {};
        let outputExpr = null;

        for (const part of parts) {
            const match = part.match(/^([a-zA-Z_$][\w$]*)\s*:\s*([\s\S]+)$/);
            if (!match) continue;

            const key = match[1];
            const value = match[2].trim();

            if (key === "output") {
                outputExpr = value;
            } else {
                args[key] = value;
            }
        }

        const url = args.url
            ? args.url.replace(/^"|"$/g, "")
            : "";

        const timeout = args.timeout
            ? parseFloat(args.timeout.replace(/^"|"$/g, ""))
            : 0;

        let fetchOptions = `{ method: "${type.toUpperCase()}"`;

        if (args.headers) fetchOptions += `, headers: ${args.headers}`;
        if (args.body) fetchOptions += `, body: ${args.body}`;

        fetchOptions += " }";

        let fetchCall = `fetch("${url}", ${fetchOptions})`;

        if (outputExpr) {
            let output = `${awaitKw || ""}${outputExpr}(${fetchCall});`
            
            if (timeout > 0) {
                output = `await new Promise(r => setTimeout(() => { ${output} r(); }, ${timeout}));`;
            }
            
            return output;
        }

        return awaitKw
            ? `(async () => { ${fetchCall}; })();`
            : `${fetchCall};`;
    });
}

export function winGetter(code) {
    let result = "";
    let i = 0;

    while (i < code.length) {
        const start = code.indexOf("win:send", i);

        if (start === -1) {
            result += code.slice(i);
            break;
        }

        result += code.slice(i, start);

        const braceStart = code.indexOf("{", start);

        let depth = 1;
        let j = braceStart + 1;

        let inString = false;
        let stringChar = "";

        while (j < code.length && depth > 0) {
            const char = code[j];
            const prev = code[j - 1];

            if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (stringChar === char) {
                    inString = false;
                }
            }

            if (!inString) {
                if (char === "{") depth++;
                if (char === "}") depth--;
            }

            j++;
        }

        const body = code.slice(braceStart + 1, j - 1);
        const parts = splitArgs(body);

        let target = '"*"';
        let content = "{}";

        for (const part of parts) {
            const match = part.match(/^([a-zA-Z_$][\w$]*)\s*:\s*([\s\S]+)$/);
            if (!match) continue;

            const key = match[1];
            const value = match[2].trim();

            if (key === "target") target = value;
            if (key === "content") content = value;
        }

        result += `window.postMessage(${content}, ${target});`;

        i = j;
    }

    return result;
}

function splitArgs(body) {
    const parts = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < body.length; i++) {
        const char = body[i];

        if (char === "{") depth++;
        if (char === "}") depth--;

        if (char === "," && depth === 0) {
            parts.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

export function gettersHandler(code) {
    code = winGetter(code)
    code = httpGetter(code)
    return code
}