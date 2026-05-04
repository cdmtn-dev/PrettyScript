const PSInterfaces = {};

export function interfaceDeclaratorHandler(code) {
    const regex = /interface\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{([\s\S]*?)\}/g;
    
    let match;
    
    while ((match = regex.exec(code)) !== null) {
        const interfaceName = match[1];
        const body = match[2];
        const fields = {};

        const lines = body.split('\n');
        for (const line of lines) {
            const fieldMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,?\s*$/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];
                const fieldType = fieldMatch[2];
                fields[fieldName] = fieldType;
            }
        }

        PSInterfaces[interfaceName] = fields;
    }
    
    let result = code.replace(/interface\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\{[\s\S]*?\}\s*/g, '');
    
    return result;
}

function parseTypedObject(code) {
    const headerRegex =
        /(?:export\s+)?(?:async\s+)?(const|let|var)\s+([a-zA-Z_$][\w$]*)\s*:\s*([a-zA-Z_$][\w$]*)\s*=\s*/gm;
    
    let match;
    while ((match = headerRegex.exec(code)) !== null) {
        const declarationType = match[1];
        const name = match[2];
        const type = match[3];
        const assignmentStart = match.index + match[0].length;
        
        const afterEquals = code.slice(assignmentStart).trimStart();
        let body;
        let endIndex;
        
        if (afterEquals.startsWith('{')) {
            let braceCount = 0;
            let i = assignmentStart + code.slice(assignmentStart).indexOf('{');
            let bodyStart = i;
            
            while (i < code.length) {
                if (code[i] === "{") braceCount++;
                else if (code[i] === "}") braceCount--;
                if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
                i++;
            }
            
            if (braceCount !== 0) throw new Error("Unclosed object body");
            body = code.slice(bodyStart, endIndex);
        } else {
            const lineEnd = code.indexOf('\n', assignmentStart);
            const semiEnd = code.indexOf(';', assignmentStart);
            
            endIndex = lineEnd === -1 ? 
                (semiEnd === -1 ? code.length : semiEnd) :
                (semiEnd === -1 ? lineEnd : Math.min(lineEnd, semiEnd));
            
            body = code.slice(assignmentStart, endIndex).trim();
        }
        
        if (!(type in PSInterfaces)) {
            throw new Error('Interface type ' + type + ' is undefined');
        }
        
        const currentInterface = PSInterfaces[type];
        const fullHeader = code.slice(match.index, assignmentStart);
        const headerWithoutType = fullHeader.replace(/\s*:\s*[a-zA-Z_$][\w$]*\s*=\s*$/, ' = ');
        
        const replacement = `${headerWithoutType}_PSb["interfaceCheck"](${body}, ${JSON.stringify(currentInterface)})`;
        
        code = code.slice(0, match.index) + replacement + code.slice(endIndex);
        headerRegex.lastIndex = match.index + replacement.length;
    }
    
    return code;
}

export function interfacesHandler(code) {
    code = interfaceDeclaratorHandler(code)
    code = parseTypedObject(code)

    return code
}