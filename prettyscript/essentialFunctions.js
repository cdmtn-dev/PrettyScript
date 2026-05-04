import { type } from "./customFunctions.js";
import { PSAPI } from "./customFunctions.js";

PSAPI.types = {}

export function ___PSLockObject(obj, key = undefined, deep = false) {
    const frozen = new WeakSet();

    function deepFreeze(obj) {
        if (!obj || typeof obj !== "object" || frozen.has(obj)) {
            return obj;
        }

        frozen.add(obj);
        Object.freeze(obj);

        Object.getOwnPropertyNames(obj).forEach(prop => {
            if (typeof obj[prop] === "object" && obj[prop] !== null) {
                deepFreeze(obj[prop]);
            }
        });

        return obj;
    }

    if (!obj || typeof obj !== "object") return obj;

    if (key === undefined) {
        return deep ? deepFreeze(obj) : Object.freeze(obj);
    }

    const path = key.split(".");
    let target = obj;

    for (let i = 0; i < path.length - 1; i++) {
        if (!target[path[i]] || typeof target[path[i]] !== "object") {
            return obj;
        }
        target = target[path[i]];
    }

    const prop = path[path.length - 1]

    if (!(prop in target)) return obj;

    if (deep && typeof target[prop] === "object" && target[prop] !== null) {
        deepFreeze(target[prop]);
    } else {
        Object.freeze(target[prop]);
    }

    Object.defineProperty(target, prop, {
        writable: false,
        configurable: false
    });

    return obj;
}

window.__PSVirtualDOM = []
export function ___PSRenderer(struc, mountNode) {
    function transformTags(input) {
        return input.replace(
            /<([a-zA-Z][\w-]*)([^>]*)>/g,
            (match, tagName, rest) => {

                let id = null;
                const classes = [];

                let clean = "";
                let i = 0;
                let quote = null;

                while (i < rest.length) {
                    const char = rest[i];

                    if (quote) {
                        clean += char;
                        if (char === quote) quote = null;
                        i++;
                        continue;
                    }

                    if (char === '"' || char === "'" || char === "`") {
                        quote = char;
                        clean += char;
                        i++;
                        continue;
                    }

                    if (char === "#") {
                        let j = i + 1;
                        let value = "";

                        while (j < rest.length && /[\w-]/.test(rest[j])) {
                            value += rest[j];
                            j++;
                        }

                        id = value;
                        i = j;
                        continue;
                    }

                    if (char === ".") {
                        let j = i + 1;
                        let value = "";

                        while (j < rest.length && /[\w-]/.test(rest[j])) {
                            value += rest[j];
                            j++;
                        }

                        classes.push(value);
                        i = j;
                        continue;
                    }

                    clean += char;
                    i++;
                }

                let attrs = clean.trim();

                if (id) {
                    attrs += ` id="${id}"`;
                }

                if (classes.length) {
                    attrs += ` class="${classes.join(" ")}"`;
                }

                return `<${tagName}${attrs ? " " + attrs : ""} ps-virtual-dom-name="${tagName}">`;
            }
        );
    }
    const html = transformTags(struc);

    const template = document.createElement("template");
    template.innerHTML = html.trim();

    const content = template.content;

    let result;
    if (content.children.length === 1) {
        result = content.firstElementChild;
    } else {
        result = content;
    }

    if (mountNode instanceof HTMLElement) {
        mountNode.appendChild(result);
    }

    window.__PSVirtualDOM.push(result)

    result.removeAttribute("ps-virtual-dom-name")
    result.querySelectorAll('*').forEach(element => {
        element.removeAttribute("ps-virtual-dom-name")
    });

    return result;
}
export function ___PSSizeOf(object) {
    if(typeof object == "number") return String(object).length
    if(Array.isArray(object)) return object.length
    else if(typeof object == "object") return Object.keys(object).length
    else return object.length
}

const __PSObservers = [];
export function ___PSObserverHandler({ target, type, output, once }) {
    once = once ?? false;

    if (typeof output != "function") throw new Error(`(PSObserve) output must be function`);
    if (typeof target != "string") throw new Error(`(PSObserve) target must be string`);

    if (type == "spawn") {
        const existing = document.querySelector(target);

        if (existing) {
            output(existing);
            if (once) return;
        }

        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && node.matches?.(target)) {
                        output(node);

                        if (once) observer.disconnect();
                    }
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        __PSObservers.push(observer);
    }
    if (type == "attributeChange") {
        const elements = document.querySelectorAll(target);
        if (!elements.length) return;

        elements.forEach(el => {
            const knownAttributes = new Set(
                Array.from(el.attributes).map(attr => attr.name)
            );

            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type !== "attributes") return;

                    const attrName = mutation.attributeName;

                    const hadBefore = knownAttributes.has(attrName);
                    const hasNow = el.hasAttribute(attrName);

                    if (hasNow) {
                        knownAttributes.add(attrName);
                    } else {
                        knownAttributes.delete(attrName);
                    }

                    output(el, {
                        attribute: attrName,
                        isNew: !hadBefore && hasNow
                    });
                });
            });

            observer.observe(el, {
                attributes: true
            });
        });
    }
}

export function ___PSInterfaceCheck(object, schema) {
    const typeValidators = {
        string: v => typeof v === "string",

        number: v => typeof v === "number" && !Number.isNaN(v),

        int: v => Number.isInteger(v),

        float: v =>
            typeof v === "number" &&
            !Number.isNaN(v) &&
            !Number.isInteger(v),

        boolean: v => typeof v === "boolean",

        version: v =>
            typeof v === "string" &&
            /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/.test(v),

        any: () => { return true }
    };

    function getNumberKind(value) {
        if (typeof value !== "number" || Number.isNaN(value))
            return typeof value;

        return Number.isInteger(value) ? "int" : "float";
    }

    function throwTypeError(key, expected, received) {
        throw new Error(
            `Interface type comparison error: key "${key}" expected "${expected}", got "${received}"`
        );
    }

    function validateValue(key, value, expectedType) {
        if (typeof expectedType === "object") {

            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                throwTypeError(key, "object", typeof value);
            }

            validateObject(value, expectedType);
            return;
        }

        if (expectedType === "optional") return;

        if (!typeValidators.hasOwnProperty(expectedType)) {
            throw new Error(`Unknown interface type "${expectedType}" for key "${key}"`);
        }

        const isValid = typeValidators[expectedType](value);

        if (!isValid) {
            const received =
                typeof value === "number"
                    ? getNumberKind(value)
                    : typeof value;

            throwTypeError(key, expectedType, received);
        }
    }

    function validateObject(obj, objSchema) {
        for (const key of Object.keys(objSchema)) {
            if (objSchema[key] === "optional") continue;

            if (!(key in obj)) {
                throw new Error(`Key "${key}" missing in object`);
            }
        }

        for (const key of Object.keys(obj)) {

            if (!(key in objSchema)) {
                throw new Error(`Unexpected key "${key}" in object`);
            }

            validateValue(key, obj[key], objSchema[key]);
        }
    }

    validateObject(object, schema);
    return object;
}

export function ___PSVariableTypeParse(varType, varValue, varData, isThrowError = false) {
    let isSetType = true

    if (varType === "set") {
        const seen = new Set()

        if(type(varValue) === "array") {
            for (const v of varValue) {
                if (seen.has(v)) {
                    isSetType = false
                    throw new Error(`The variable "${varData.name}" is declared with type "${varData.declType}", therefore the values must be unique`)
                    break
                }

                seen.add(v)
            }
        }
        else {
            throw new Error(`A variable of type "${varType}" can only hold arrays`)
        }
    }

    const types = {
        int: type(varValue) == "int",
        string: type(varValue) == "string",
        fn: type(varValue) == "function",
        float: type(varValue) == "float",
        null: type(varValue) == "null",
        array: type(varValue) == "array",
        object: type(varValue) == "object",
        boolean: type(varValue) == "boolean",
        HTML: type(varValue) == "HTML",
        Component: type(varValue) == "Component",
        set: isSetType,
        any: true
    }

    PSAPI.types[varData.name] = { type: varData.declType }

    if(varType in types) {
        if(types[varType]) {
            if(!isThrowError) return varValue
            else return ""
        }
        else {
            throw new Error(`The variable "${varData.name}" is declared with type "${varData.declType}", but received type "${type(varValue)}"`)
        }
    }
}