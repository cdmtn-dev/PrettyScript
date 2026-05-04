import { findUnusedVariables } from "./libs/strict/main.js"

window.PSLinksImported = {}

export async function useHandler(code) {
    const regex = /use\s+([a-zA-Z0-9_]+)/g;
    const uses = {}

    const modules = []

    async function addToCode(name) {
        modules.push(`/prettyscript/libs/${name}.js`)
    }

    for (const match of code.matchAll(regex)) {
        const full = match[0]
        const name = match[1]

        function wrapAsyncCode(code) {
            code = code.trim().replace(/;+\s*$/, "")
            code = code.replace(/\}\)\s*\(\s*\)\s*$/, "})")

            return `(async () => {\n${code}\n})()`
        }

        if(name == "async") {
            code = wrapAsyncCode(code)
        }
        else if(name == "response") {
            await addToCode("response")
        }
        else if(name == "path") {
            await addToCode("path")
        }
        else if(name == "browser") {
            await addToCode("browser")
        }
        else if(name == "react") {
            await addToCode("reactive")
        }
        else if(name == "http") {
            await addToCode("http")
        }
        else if(name == "language") {
            await addToCode("language")
        }
        else if(name == "cryptolib") {
            await addToCode("cryptolib")
        }
        else if(name == "json") {
            await addToCode("json")
        }
        else if(name == "time") {
            await addToCode("time")
        }
        else if(name == "strict") {
            findUnusedVariables(code)
        }

        code = code.replaceAll(full, "")
    }

    for (const path of modules) {
        const mod = await import(path);
        Object.assign(uses, mod);
    }

    return {
        code: code,
        uses: uses
    }
}

export async function includeHandler(code) {
    const regex = /include\s+["']?([a-zA-Z0-9_.\/]+)["']?/g;

    for (const match of code.matchAll(regex)) {
        const full = match[0]
        const path = match[1] + ".ps"

        await fetch(path).then(async (r) => {
            let text = await r.text()
            code = `\n${text}\n\n` + code
        })

        code = code.replaceAll(full, "")
    }

    return code
}