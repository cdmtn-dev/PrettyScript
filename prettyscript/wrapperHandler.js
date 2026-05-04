export function parseWrappers(code, nonExportedObject) {
    let output = "";
    let i = 0;

    while (i < code.length) {
        if (code[i] === "@") {
            i++;

            let name = "";
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                name += code[i++];
            }

            while (i < code.length && /\s/.test(code[i]) && code[i] !== "\n") i++;

            let start = i;
            let inString = false;

            while (i < code.length) {
                if (code[i] === '"' && code[i - 1] !== "\\") {
                    inString = !inString;
                }

                if (!inString && code[i] === "\n") break;

                i++;
            }

            let content = code.slice(start, i).trim();

            if (name !== "nonexport") {
                output += content + "\n";
            }

            if (name === "app") {
                if (/^fn/.test(content)) {
                    const match = content.match(/fn\s+([a-zA-Z_]\w*)/);
                    if (match) {
                        output = `React.createApp(${match[1]});\n` + output;
                    }
                }
            }

            if (name === "onload") {
                if (/^fn/.test(content)) {
                    const match = content.match(/fn\s+([a-zA-Z_]\w*)/);
                    if (match) {
                        output = `${match[1]}();\n` + output;
                    }
                }
            }

            if (name === "preload") {
                const match = content.match(/"(.*?)"/);
                if (match) {
                    const path = match[1];

                    output = output.replaceAll(match[0], `link("${path}")`)
                }
                else {
                    output = output.replaceAll(output, `link("${content}")`)
                }
            }

            if (name === "nonexport") {
                let functions = content.split(",").map(item => item.trim());
                
                functions.forEach(f => {
                    output += `\n${f} = ${typeof nonExportedObject == "string" ? `"${nonExportedObject}"` : nonExportedObject};\n`;
                });
            }
        } else {
            output += code[i];
            i++;
        }
    }

    return output;
}