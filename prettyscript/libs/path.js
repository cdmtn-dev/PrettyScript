export let path = {
    join: (...segments) => {
        return segments.join("/").replace(/\/+/g, "/");
    },

    from: (input) => {
        if (typeof input !== "string") {
            throw new Error("(path) .from() expects a string");
        }
        return input.split("/");
    },

    ext: (input) => {
        if (typeof input !== "string") {
            throw new Error("(path) .ext() expects a string");
        }

        const base = input.split("/").pop();
        const index = base.lastIndexOf(".");

        if (index <= 0) {
            return {
                origin: "",
                extended: []
            };
        }

        const ext = base.slice(index);
        const multi = base.split(".").slice(1);

        return {
            origin: ext,
            extended: multi
        };
    },

    normalize: (...segments) => {
        const input = segments.join("/");

        return input
            .replace(/\\/g, "/")
            .replace(/\/+/g, "/")
            .trim();
    },

    parse: (input) => {
        if (typeof input !== "string") {
            throw new Error("(path) .parse() expects a string");
        }

        const normalized = input.replace(/\\/g, "/");
        const parts = normalized.split("/");

        const base = parts.pop() || "";
        const dir = parts.join("/") || "";
        const root = normalized.startsWith("/") ? "/" : "";

        const extIndex = base.lastIndexOf(".");
        const ext = extIndex > 0 ? base.slice(extIndex) : "";
        const name = extIndex > 0 ? base.slice(0, extIndex) : base;

        return {
            root,
            dir,
            base,
            ext,
            name 
        };
    }
};