export class React {
    static currentEffect = null;
    static states = {};

    static state(name, initialValue) {
        if (React.states[name]) {
            return React.states[name];
        }

        let value = initialValue;
        const subscribers = new Set();

        const proxy = new Proxy({
            set(newValue) {
                if (value !== newValue) {
                    value = newValue;
                    subscribers.forEach(fn => fn());
                }
            },
            get() {
                if (React.currentEffect) subscribers.add(React.currentEffect);
                return value;
            },
            subscribe(fn) {
                subscribers.add(fn);
            }
        }, {
            get(target, prop) {
                if (prop === "set") return target.set;
                if (prop === "get") return () => value;
                if (prop === "subscribe") return target.subscribe;
                if (prop === Symbol.toPrimitive) return () => value;
                return value;
            }
        });

        React.states[name] = proxy;
        return proxy;
    }

    static setEffect(cb) {
        React.currentEffect = cb;
        cb();
        React.currentEffect = null;
    }

    static _bind(root) {
        const walk = node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const matches = [...node.textContent.matchAll(/\{([\w$]+)\}/g)];
                if (matches.length) {
                    const originalText = node.textContent;
                    const update = () => {
                        let text = originalText;
                        matches.forEach(match => {
                            const stateName = match[1];
                            const stateObj = React.states[stateName];
                            if (stateObj) {
                                text = text.replace(new RegExp(`\\{${stateName}\\}`, "g"), stateObj.get());
                            }
                        });
                        node.textContent = text;
                    };
                    update();
                    matches.forEach(match => {
                        const stateObj = React.states[match[1]];
                        if (stateObj) stateObj.subscribe(update);
                    });
                }
            } else {
                node.childNodes.forEach(walk);
            }
        };
        walk(root);
    }

    static create(fn) {
        if (typeof fn === "function") return fn();
        throw new Error(`React.create only accepts arguments of type "function"`);
    }

    static createApp(fn) {
        if (typeof fn === "function") {
            const result = fn();
            document.body.appendChild(result);
            React._bind(result);
        } else {
            throw new Error(`React.createApp only accepts arguments of type "function"`);
        }
    }
}