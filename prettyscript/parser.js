const compileCache = new Map();

function fastEval(code, args = []) {
    let fn = compileCache.get(code);

    if (!fn) {
        fn = new Function(...args, `"use strict"; ${code}`);
        compileCache.set(code, fn);
    }

    return fn;
}

class PrettyScript {
    constructor(file) {
        // import terser for minify js
        const terserScript = document.createElement("script")
        terserScript.src = "./prettyscript/3party/terser.min.js"
        document.head.appendChild(terserScript)
        // 

        this.file = file

        this._parseContent(file)
    }

    async init() {
        const modules = [
            "/prettyscript/inlines.js",
            "/prettyscript/shorts.js",
            "/prettyscript/getters.js",
            "/prettyscript/operators.js",
            "/prettyscript/uses.js",
            "/prettyscript/interfaces.js",
            "/prettyscript/renderHandler.js",
            "/prettyscript/observerHandler.js",
            "/prettyscript/typed.js",
            "/prettyscript/customFunctions.js",
            "/prettyscript/renderComponents.js",
            "/prettyscript/wrapperHandler.js",

            "/prettyscript/essentialFunctions.js",
            "/prettyscript/customFunctions.js"
        ];

        for (const path of modules) {
            const mod = await import(path);
            Object.assign(this, mod);
        }
    }

    async _parseContent(filename) {
        await this.init()

        let pkgRes = await fetch("/prettyscript/package.ps.json")
        const pkg = await pkgRes.json()

        let nonExportedObject = pkg.nonExportedObject == undefined ? undefined : pkg.nonExportedObject

        const res = await fetch(filename)
        let content = await res.text()

        content = this.stripJSComments(content)

        const _PSb = {
            "varParse": this.___PSVariableTypeParse,
            "lock": this.___PSLockObject,
            "render": this.___PSRenderer,
            "sizeof": this.___PSSizeOf,
            "observer": this.___PSObserverHandler,
            "interfaceCheck": this.___PSInterfaceCheck
        }
        const customFunctions = {
            "link": this.link,
            "createElement": this.createElement,
            "log": console.log,
            "warn": console.warn,
            "err": console.error,
            "logt": console.table,
            "debug": this.debug,
            "logf": this.logf,
            "isEmpty": this.isEmpty,
            "type": this.type,
            "isOdd": this.isOdd
        }

        let buildIns = {
            "__filename": filename.split(/[\\/]/).pop(),
            "__version": pkg.version,
            "__package": pkg,
            "__PS": PSAPI,
            "_PSb": _PSb,
            ...customFunctions
        }

        try {
            content = content.trim()
            content = await this.includeHandler(content)
            content = this.parseWrappers(content, nonExportedObject)

            content = this.renderHandler(content)
            content = this.typedHandler(content)
            
            content = this.operatorsHandler(content)
            content = this.inlinesHandler(content)
            content = this.shortsHandler(content)
            content = this.gettersHandler(content)
            content = await this.interfacesHandler(content)

            const uses = await this.useHandler(content)
            content = uses.code

            Object.keys(uses.uses).forEach(k => {
                buildIns[k] = uses.uses[k]
            })
            
            content = this.observerHandler(content)
            content = await this.renderComponent(content)

            const start = performance.now();
            
            if("minify" in pkg && pkg.minify == true) {
                content = await Terser.minify(content);
                await fastEval(content.code, Object.keys(buildIns))(...Object.values(buildIns))
            }
            else {
                await fastEval(content, Object.keys(buildIns))(...Object.values(buildIns))
            }

            const end = performance.now();

            // this.parseReAssignedTypes(content)

            console.warn(content)
            
            if(pkg.logRuntimeSpeed) {
                console.log(`[RuntimeSpeed] ${(end - start).toFixed(3)}ms (${end.toFixed(2)})`);
            }
        }
        catch(error) {
            console.error(`[PrettyScript]`, `${error}`, "\n")
        }
    }

    stripJSComments(code) {
        let result = "";
        let i = 0;

        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplate = false;
        let inRegex = false;
        let inBlockComment = false;
        let inLineComment = false;

        while (i < code.length) {
            const char = code[i];
            const next = code[i + 1];

            if (inLineComment) {
                if (char === "\n") {
                    inLineComment = false;
                    result += char;
                }
                i++;
                continue;
            }

            if (inBlockComment) {
                if (char === "*" && next === "/") {
                    inBlockComment = false;
                    i += 2;
                } else {
                    i++;
                }
                continue;
            }

            if (inSingleQuote) {
                if (char === "\\" && next) {
                    result += char + next;
                    i += 2;
                    continue;
                }
                if (char === "'") inSingleQuote = false;
                result += char;
                i++;
                continue;
            }

            if (inDoubleQuote) {
                if (char === "\\" && next) {
                    result += char + next;
                    i += 2;
                    continue;
                }
                if (char === '"') inDoubleQuote = false;
                result += char;
                i++;
                continue;
            }

            if (inTemplate) {
                if (char === "\\" && next) {
                    result += char + next;
                    i += 2;
                    continue;
                }
                if (char === "`") inTemplate = false;
                result += char;
                i++;
                continue;
            }

            if (inRegex) {
                if (char === "\\" && next) {
                    result += char + next;
                    i += 2;
                    continue;
                }
                if (char === "/") inRegex = false;
                result += char;
                i++;
                continue;
            }

            if (char === "/" && next === "/") {
                inLineComment = true;
                i += 2;
                continue;
            }

            if (char === "/" && next === "*") {
                inBlockComment = true;
                i += 2;
                continue;
            }

            if (char === "'") {
                inSingleQuote = true;
                result += char;
                i++;
                continue;
            }

            if (char === '"') {
                inDoubleQuote = true;
                result += char;
                i++;
                continue;
            }

            if (char === "`") {
                inTemplate = true;
                result += char;
                i++;
                continue;
            }

            if (char === "/") {
                const prev = result.trim().slice(-1);
                if (!prev || "({[=:+!?,;".includes(prev)) {
                    inRegex = true;
                }
                result += char;
                i++;
                continue;
            }

            result += char;
            i++;
        }

        return result;
    }
}

class PS {
    static init(src) {
        new PrettyScript(src)
    }
}