export function findUnusedVariables(code) {
    const tokens = tokenize(code);

    const declarations = new Map();

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (isVarKeyword(t.value)) {
            const next = tokens[i + 1];

            if (next && isIdentifier(next.value)) {
                declarations.set(next.value, {
                    used: false,
                    index: next.index,
                    declaredAt: i + 1 
                });
            }
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (declarations.has(t.value)) {
            const declInfo = declarations.get(t.value);

            if (i === declInfo.declaredAt) {
                continue;
            }

            declInfo.used = true;
        }
    }

    const unused = [];

    for (const [name, info] of declarations) {
        if (!info.used) {
            if(!(name.startsWith("__"))) {
                throw new Error(`StrictError: The variable "${name}" has been declared but is not used`)
            }
            unused.push({
                name,
                index: info.index
            });
        }
    }

    return unused;
}

function tokenize(code) {
    const regex = /[a-zA-Z_$][a-zA-Z0-9_$]*|let|const|var|\{|\}|\(|\)|;|=|\+|-|\*|\//g;

    const tokens = [];
    let match;

    while ((match = regex.exec(code)) !== null) {
        tokens.push({
            value: match[0],
            index: match.index
        });
    }

    return tokens;
}

function isVarKeyword(v) {
    return v === "let" || v === "const" || v === "var";
}

function isIdentifier(v) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v);
}