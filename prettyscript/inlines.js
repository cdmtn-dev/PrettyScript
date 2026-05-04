function timeStringToMs(str) {
    str = str.trim().toLowerCase();
    const regex = /^(\d+)(ms|s|m|h)?$/;
    const match = str.match(regex);
    if (!match) return 0;

    const value = Number(match[1]);
    const unit = match[2] || "ms";

    switch (unit) {
        case "ms": return value;
        case "s": return value * 1000;
        case "m": return value * 60 * 1000;
        case "h": return value * 60 * 60 * 1000;
        default: return value;
    }
}

function sleepInline(code) {
    const regex = /^(\s*)sleep\s+([^\s\{]+)(\s*\{([\s\S]*?)\})?$/gm;

    return code.replace(regex, (_, indent, timeStr, _body, bodyContent) => {
        timeStr = timeStr.replaceAll(";", "")
        const ms = timeStringToMs(timeStr);

        let outputFunc = null;
        if (bodyContent) {
            const match = bodyContent.trim().match(/output\s*:\s*([a-zA-Z_$][\w$]*)/);
            if (match) outputFunc = match[1];
        }

        const sleepExpr = `new Promise(r => setTimeout(r, ${ms}))`;

        if (outputFunc) {
            return `${indent}${outputFunc}(${sleepExpr});`;
        } else {
            return `${indent}await ${sleepExpr};`;
        }
    });
}
function lockInline(code) {
    const regex = /^(\s*)lock\s+([^\s\{]+)(\s*\{([\s\S]*?)\})?$/gm;

    return code.replace(regex, (_, indent, objectName, _body, bodyContent) => {
        let outputFunc = null;
        if (bodyContent) {
            const match = bodyContent.trim().match(/output\s*:\s*([a-zA-Z_$][\w$]*)/);
            if (match) outputFunc = match[1];
        }

        let key = undefined
        let deep = false

        if(objectName.includes(".")) {
            let rawKey = objectName.split(".").slice(1).join(".")

            if(rawKey.endsWith("*")) {
                deep = true
                rawKey = rawKey.replaceAll("*", "")
            }
            key = `'${rawKey}'`
        }

        const lockExpr = `\n_PSb["lock"](${objectName.split(".")[0]}, ${key}, ${deep})`;

        return lockExpr;
    });
}

export function inlinesHandler(content) {
    content = lockInline(content)
    return sleepInline(content)
}