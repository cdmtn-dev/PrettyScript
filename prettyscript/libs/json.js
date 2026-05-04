import { type } from "../customFunctions.js"

function makeSureIsJSON(object) {
    if(typeof object == "object") return true

    try {
        JSON.parse(object)
        return true
    }
    catch {
        return false
    }
}

const errPrefix = (t) => {
    return `[json:${t}]`
}

export let json = {
    parse(...args) {
        return JSON.parse(...args)
    },
    stringify(...args) {
        if(typeof args[0] != "object") throw new Error(`${errPrefix("json.stringify")} Expected a "object" type, but got a "${typeof args[0]}" type`);
        
        return JSON.stringify(...args)
    },
    len(object) {
        if(type(object) == "string") {
            if(makeSureIsJSON(object)) {
                let parsed = JSON.parse(object)
                return Object.keys(parsed).length
            }
            else {
                throw new Error(`${errPrefix("json.len")} String is not JSON`);
            }
        }
        if(type(object) == "object") return Object.keys(object).length
        if(type(object) == "array") return object.length
    },
    isJSON(object) {
        return makeSureIsJSON(object)
    }
}

json["toString"] = json.stringify