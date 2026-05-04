function sizeOfOperator(code) {
    let result = "";
    let i = 0;
    
    while (i < code.length) {
        const start = code.indexOf("sizeof", i);
        if (start === -1) {
            result += code.slice(i);
            break;
        }
        result += code.slice(i, start);
        let j = start + 6;
        while (code[j] === " ") j++;
        
        let expr = "";
        let depth = 0;
        let inString = false;
        let stringChar = "";
        
        while (j < code.length) {
            const char = code[j];
            const prev = code[j - 1];
            
            if ((char === '"' || char === "'" || char === "`") && prev !== "\\") {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (stringChar === char) {
                    inString = false;
                }
            }
            
            if (!inString) {
                if (char === "{" || char === "(" || char === "[") depth++;
                if (char === "}" || char === ")" || char === "]") {
                    depth--;
                    if (depth < 0) break;
                }
                if (depth === 0 && /[\s;,\n==!=<>+\-*/%&|^]/.test(char)) {
                    break;
                }
            }
            
            expr += char;
            j++;
        }
        
        expr = expr.trim();
  
        result += `_PSb["sizeof"](${expr})`;
        
        i = j;
    }
    return result;
}

export function operatorsHandler(code) {
    code = sizeOfOperator(code)
    return code
}