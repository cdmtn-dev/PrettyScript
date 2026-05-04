class Language {
    constructor(path) {
        this.path = path
        this.languageList = {}
        this.languageCurrent = undefined
    }
    async add(langName) {
        let path = this.path.endsWith("/") ? this.path : this.path + "/"

        const langFile = await fetch(`${path}${langName}.json`)
        const langContent = await langFile.json()

        this.languageList[langName] = { name: langName, ...langContent }
    }

    set(langName) {
        if(langName in this.languageList) {
            this.languageCurrent = this.languageList[langName]
        }
    }

    get(stringObject) {
        if (!stringObject) {
            throw new Error("Key path is empty");
        }

        const keys = stringObject.split(".");
        let current = this.languageCurrent;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            if (current == null || !(key in current)) {
                throw new Error(`Key "${keys.slice(0, i + 1).join(".")}" not found`);
            }

            current = current[key];
        }

        return current; // может быть string, number, object, array и т.д.
    }
}