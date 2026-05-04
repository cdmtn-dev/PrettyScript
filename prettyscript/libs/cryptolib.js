export let cryptolib = {
    stringToBinary(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        return Array.from(data)
            .map(byte => byte.toString(2).padStart(8, '0'))
            .join('');
    },

    binaryToString(binary) {
        const bytes = binary.match(/.{1,8}/g).map(byte => parseInt(byte, 2));
        const decoder = new TextDecoder();
        return decoder.decode(new Uint8Array(bytes));
    },

    randomUUID() {
        return crypto.randomUUID();
    },

    randomBytes(length = 16) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    },

    randomInt(min, max) {
        const range = max - min + 1;
        const random = crypto.getRandomValues(new Uint32Array(1))[0];
        return min + (random % range);
    },

    async hash(str, algorithm = "SHA-256") {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        return this.bufferToHex(hashBuffer);
    },

    bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    toBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },

    fromBase64(base64) {
        return decodeURIComponent(escape(atob(base64)));
    },

    xorEncrypt(str, key) {
        return Array.from(str)
            .map((char, i) =>
                String.fromCharCode(
                    char.charCodeAt(0) ^ key.charCodeAt(i % key.length)
                )
            )
            .join('');
    },

    xorDecrypt(str, key) {
        return this.xorEncrypt(str, key);
    },

    safeEqual(a, b) {
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
};