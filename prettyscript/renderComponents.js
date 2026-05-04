import { ___PSRenderer } from "./essentialFunctions.js";
import { PSAPI } from "./customFunctions.js";

PSAPI.Components = [];

export function renderComponent(string) {
    function parseComponent(str) {
        const compMatch = str.match(/component\s+([A-Za-z0-9_]+)\s*\{/);
        if (!compMatch) return null;

        const name = compMatch[1];
        let startIndex = compMatch.index + compMatch[0].length;
        let openBraces = 1;
        let i = startIndex;

        while (i < str.length && openBraces > 0) {
            const char = str[i];
            if (char === "{") openBraces++;
            else if (char === "}") openBraces--;
            i++;
        }

        if (openBraces !== 0) throw new Error("Figure brackets wrong balance");

        const content = str.slice(startIndex, i - 1).trim();
        return { name, content, fullMatch: str.slice(compMatch.index, i) };
    }

    const parsed = parseComponent(string);
    if (!parsed) return string;

    const { name: componentName, content, fullMatch } = parsed;

    const renderedHTML = ___PSRenderer(content);
    let template = renderedHTML.outerHTML

    window[componentName] = new Proxy(function() {}, {
        apply(target, thisArg, props) {
            let args = props[0]
            
            Object.keys(args).forEach(arg => {
                template = template.replaceAll(`{${arg}}`, args[arg])
            })

            const temp = document.createElement("div");
            temp.innerHTML = template;

            PSAPI.Components[componentName] = temp.firstElementChild;

            return temp.firstElementChild;
        },
        get(_, prop) {
            if (prop === "get") return () => renderedHTML;
            if (prop === "toString" || prop === Symbol.toPrimitive) return () => renderedHTML;
            return renderedHTML;
        }
    });

    return string.replace(fullMatch, "");
}