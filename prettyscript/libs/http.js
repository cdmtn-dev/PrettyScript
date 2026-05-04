export let http = {
    async send(object) {
        const type = object.type == undefined ? "GET" : object.type
        const url = object.url
        const output = object.output
        const outputType = object.outputType == undefined ? "text" : object.outputType
        const body = object.body == undefined ? false : object.body
        const headers = object.headers == undefined ? { 'Content-Type': 'application/json' } : object.headers

        const types = ["GET", "POST", "PUT", "DELETE"]

        if(!types.includes(type)) throw new Error(`HTTPError: The request type can only be ${types.join(", ")}`)
        if(url == undefined) throw new Error(`HTTPError: The ${type} request must contain a link (url property) for operation`)

        if(output != undefined) {
            if(typeof output != "function") throw new Error(`HTTPError: A ${type} request cannot send the result via output; it must be a function`)
        }

        let fetchBody = {
            method: type,
            headers: headers
        }

        if (body) {
            fetchBody = {
                method: type,
                headers: headers,
                body: JSON.stringify(body)
            }
        }
        
        const res = await fetch(object.url, fetchBody)
        let data

        if(outputType == "text") {
            data = await res.text()
        }
        else if(outputType == "json") {
            data = await res.json()
        }
        else {
            throw new Error(`HTTPError: outputType can only be text or json`)
        }

        const result = {
            data: data,
            status: res.status
        }

        if(output) {
            output(result)
        }
        else {
            return result
        }
    }
};