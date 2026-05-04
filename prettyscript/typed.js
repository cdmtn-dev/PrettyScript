import { PSAPI } from "./customFunctions.js";
import { ___PSVariableTypeParse } from "./essentialFunctions.js";

export function typedHandler(code) {
    const regex = /(let|const)\s+([a-zA-Z_$][\w$]*)\s*:\s*(int|float|string|boolean|array|object|fn|null|set|any|HTML|Component)\s*=/g;
    
    let result = '';
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(code)) !== null) {
        const declType = match[1];
        const varName = match[2];
        const varType = match[3];
        const startIndex = match.index + match[0].length;
        
        result += code.slice(lastIndex, match.index);
        
        const { value, endIndex } = extractValueForTyped(code, startIndex);
        
        const escapedName = escapeString(varName);
        const escapedType = escapeString(varType);
        
        result += `${declType} ${varName} = _PSb["varParse"]("${escapedType}", ${value}, { name: "${escapedName}", declType: "${escapedType}" })`;
        
        lastIndex = endIndex;
    }
    
    result += code.slice(lastIndex);
    return result;
}

function extractValueForTyped(code, startIndex) {
    let i = startIndex;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let inString = null;
    let firstParen = null;
    
    while (i < code.length) {
        const char = code[i];
        
        if (char === '\\' && i + 1 < code.length) {
            i += 2;
            continue;
        }
        
        if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = char;
            i++;
            continue;
        }
        
        if (inString && char === inString) {
            inString = null;
            i++;
            continue;
        }
        
        if (inString) {
            i++;
            continue;
        }
        
        if (char === '(') {
            if (firstParen === null) firstParen = i;
            parenDepth++;
        }
        else if (char === ')') {
            parenDepth--;
            if (firstParen !== null && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
                return {
                    value: code.slice(startIndex, i + 1).trim(),
                    endIndex: i + 1
                };
            }
        }
        else if (char === '{') {
            braceDepth++;
        }
        else if (char === '}') {
            braceDepth--;
        }
        else if (char === '[') {
            bracketDepth++;
        }
        else if (char === ']') {
            bracketDepth--;
        }
        else if (char === ';' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
            return {
                value: code.slice(startIndex, i).trim(),
                endIndex: i
            };
        }
        
        i++;
    }
    
    return {
        value: code.slice(startIndex).trim(),
        endIndex: code.length
    };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function parseReAssignedTypes(code) {
    const variables = PSAPI.types;

    code.split("\n").map(line => {
        line = line.trim()
        for (const varName in variables) {
            const varType = variables[varName].type;

            const match = line.match(
                new RegExp(`^\\s*${varName}\\s*=\\s*(.+)`)
            );

            if (match) {
                const value = match[1];
                ___PSVariableTypeParse(varType, value, { name: varName, declType: varType}, true)
            }
        }
    })
}

function escapeString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}