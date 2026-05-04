class Bus {
    constructor() {
        this.events = new Map()
    }

    handle(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set())
        }

        this.events.get(event).add(handler)

        return () => this.off(event, handler)
    }

    off(event, handler) {
        if (!this.events.has(event)) return

        this.events.get(event).delete(handler)

        if (this.events.get(event).size === 0) {
            this.events.delete(event)
        }
    }

    send(event, data) {
        if (!this.events.has(event)) return

        for (const handler of this.events.get(event)) {
            try {
                handler(data)
            } catch (e) {
                console.error(`Bus error in "${event}":`, e)
            }
        }
    }

    once(event, handler) {
        const wrapper = (data) => {
            handler(data)
            this.off(event, wrapper)
        }

        this.on(event, wrapper)
    }

    clear(event) {
        if (event) {
            this.events.delete(event)
        } else {
            this.events.clear()
        }
    }
}