export class Time {
    constructor(properties = {}) {
        const hoursFormat = properties.hoursFormat == undefined ? "24" : properties.hoursFormat

        this.hoursFormat = hoursFormat
    }

    now() {
        return Math.floor(Date.now() / 1000)
    }
    date(format, customUnix) {
        let time;
        const today = new Date()

        if (customUnix !== null) {
            if (typeof customUnix !== "number" || !Number.isFinite(customUnix)) {
                throw new Error("[time:date] customUnix (2 argument) must be a valid unix timestamp");
            }

            time = customUnix < 1e12
                ? new Date(customUnix * 1000)
                : new Date(customUnix);
        } else {
            time = new Date();
        }

        const pad = (n) => String(n).padStart(2, "0");

        let hours = time.getHours();
        let ampm = "";

        if (this.hoursFormat === "12") {
            ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
        }

        const map = {
            "%dd": pad(time.getDate()),
            "%mm": pad(time.getMonth() + 1),
            "%yyyy": time.getFullYear(),
            "%hh": pad(hours),
            "%ii": pad(time.getMinutes()),
            "%ss": pad(time.getSeconds()),
            "%DD": today.toLocaleDateString('en-US', { weekday: 'long' }),
            "%Dd": today.toLocaleDateString('en-US', { weekday: 'short' }),
            "%ms": pad(time.getMilliseconds()),
            "%ampm": ampm
        };

        return format.replace(/%dd|%DD|%Dd|%mm|%yyyy|%hh|%ii|%ss|%ms|%ampm/g, (t) => map[t]);
    }
    setTimeFormat(format = "24") {
        this.hoursFormat = format
    }
    rand() {
        const start = new Date('2020-01-01').getTime() / 1000;
        const end = new Date('2024-12-31').getTime() / 1000;

        return Math.floor(Math.random() * (end - start + 1) + start);
    }
    day() {
        const result = this.date("%dd", this.now())
        return result
    }
    dayWeek() {
        const result = this.date("%DD", this.now())
        return result
    }
    dayWeekShort() {
        const result = this.date("%Dd", this.now())
        return result
    }
    month() {
        const result = this.date("%mm", this.now())
        return result
    }
    year() {
        const result = this.date("%yyyy", this.now())
        return result
    }
    hour() {
        const result = this.date("%hh", this.now())
        return result
    }
    min() {
        const result = this.date("%ii", this.now())
        return result
    }
    sec() {
        const result = this.date("%ss", this.now())
        return result
    }
    ms() {
        const result = this.date("%ms", this.now())
        return result
    }
}