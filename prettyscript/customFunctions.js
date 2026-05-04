export const PSAPI = {}
window.PSAPI = PSAPI

const body = document.body

export function debug(...args) {
    console.log(
        "%c" + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 4) : a).join(" "),
        "color:#33b3ff;background:#33b3ff17;padding:2px 4px;border-radius:5px;"
    );
}
export function logf(format, ...args) {
    if (typeof format !== "string") {
        console.log(format);
        return;
    }

    let i = 0;
    const result = format.replace(/%[vtl]/g, match => {
        const arg = args[i++];

        if (match === '%v') return arg;
        if (match === '%t') return typeof arg;
        if (match === '%l') {
            if (typeof arg == "object") {
                return Object.keys(arg).length
            }
            else {
                return arg.length
            }
        }
        return match;
    });
    console.log(result);
}

export function link(path, type = undefined) {
    if (path.endsWith(".css")) {
        const id = crypto.randomUUID()
        const link = document.createElement("link")
        link.href = path
        link.rel = "stylesheet"
        link.id = id

        window.PSLinksImported[id] = {
            element: link,
            context: "CSS",
            type: "default"
        }

        document.head.appendChild(link)
    }
    if (path.endsWith(".js")) {
        const id = crypto.randomUUID()
        const script = document.createElement("script")
        script.src = path

        if (type != undefined) {
            if (type == "module") {
                script.type = "module"
            }
            else {
                script.type = "text/javascript"
            }
        }
        else {
            script.type = "text/javascript"
        }

        script.id = id

        window.PSLinksImported[id] = {
            element: script,
            context: "JavaScript",
            type: type == undefined ? "default" : type
        }

        document.head.appendChild(script)
    }
}

export function isEmpty(target) {
    if (typeof target == "object") {
        if (Array.isArray(target)) {
            return target.length == 0
        }
        else {
            return Object.keys(target).length == 0
        }
    }
    else if (typeof target == "string") {
        return target.length == 0
    }
    else if (target == 0) {
        return true
    }
    else {
        return true
    }
}

export const type = (v) => {
    function isClass(func) {
        return typeof func === 'function' && func.prototype && func.prototype.constructor === func;
    }
    if(v instanceof HTMLElement) return "HTML"
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    if(isClass(v)) return "class"
    if (typeof v == "object") return "object";
    if (typeof v == "function") return "function";
    if (Number.isInteger(v)) return "int";
    if (typeof v === "number") return "float";
    if (typeof v === "boolean") return "boolean";
    return typeof v;
};

const DOM = {
    q(selector) {
        const el = selector[0] === "#"
            ? document.getElementById(selector.slice(1))
            : document.querySelector(selector)

        return new Proxy(el || {}, {
            get(target, prop) {
                if (prop === "exists") {
                    return () => el !== null
                }

                if (prop === "hasClass") {
                    return (cls) => el ? el.classList.contains(cls) : false
                }

                if (prop === "hasID") {
                    return (id) => el ? el.id === id : false
                }

                if (prop === "hasAttr") {
                    return (attr, value) => {
                        if (!el) return false
                        if (value !== undefined) {
                            return el.getAttribute(attr) === value
                        }
                        return el.hasAttribute(attr)
                    }
                }

                if (prop === "tagName") {
                    return el ? el.tagName.toLowerCase() : null
                }

                return el ? el[prop] : undefined
            }
        })
    },

    qall(selector) {
        return document.querySelectorAll(selector)
    },

    exists(selector) {
        return document.querySelector(selector) !== null
    },

    get body() {
        return document.body
    },

    get root() {
        return document
    }
}

export function createElement(tagName, properties = {}) {
    const el = document.createElement(tagName)

    Object.keys(properties).forEach(id => {
        if (id == "innerHTML") {
            el.innerHTML = properties[id]
            return
        }

        el.setAttribute(id, properties[id])
    })

    return el
}

const UserAgent = {
    lang() {
        const lang = navigator.language || navigator.userLanguage || "en";
        return lang.slice(0, 2).toLowerCase();
    },

    locale() {
        return (navigator.language || navigator.userLanguage || "en-US");
    },

    get() {
        return window.navigator.userAgent;
    }
};

export function isOdd(number) {
    return number % 2 === 0
}

//

const originalSet = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
Object.defineProperty(Element.prototype, 'innerHTML', {
    set: function (value) {
        if (value instanceof HTMLElement) {
            value = value.outerHTML
        }
        originalSet.call(this, value);
    }
});

String.prototype.truncate = function (maxLength = 100) {
    let result = this.valueOf();
    const ending = '...';

    if (result.length > maxLength) {
        return result.slice(0, maxLength - ending.length) + ending;
    }

    return result;
};

EventTarget.prototype.on = function (type, listener, options) {
    return this.addEventListener(type, listener, options);
};
EventTarget.prototype.off = function (type, fn, opts) {
    return this.removeEventListener(type, fn, opts);
};

Element.prototype.render = function (html) {
    this.innerHTML = html;
};

const nativeQuerySelector = Element.prototype.querySelector;
const nativeQuerySelectorAll = Element.prototype.querySelectorAll;

Element.prototype.find = function(selector) {
    return nativeQuerySelector.call(this, selector);
}
Element.prototype.findAll = function(selector) {
    return nativeQuerySelectorAll.call(this, selector);
}

const nativeAddEventListener = Element.prototype.addEventListener;

Element.prototype.on = function(eventName, cb) {
    return nativeAddEventListener.call(this, eventName, cb)
}