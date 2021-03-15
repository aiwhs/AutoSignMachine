
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

var CryptoJS_encrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

var CryptoJS_decrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var decrypted = CryptoJS.AES.decrypt(word, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

var CryptoJS_RC4_encrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.RC4.encrypt(srcs, key, {
        iv: keyStr,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

var CryptoJS_RC4_decrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var decrypted = CryptoJS.RC4.decrypt(word, key, {
        iv: keyStr,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return CryptoJS.enc.Utf8.stringify(decrypted);
}

var crypto_encrypt = function (data, key) {
    var iv = "";
    var cipherEncoding = 'base64';
    var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}

var crypto_decrypt = function (data, key) {
    var iv = "";
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(data, cipherEncoding), decipher.final()]).toString(clearEncoding);
}

var secretkeyArrayV1 = function () {
    for (var e = [], t = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E",
        "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
        "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q",
        "r", "s", "t", "u", "v", "w", "x", "y", "z"], i = 0;
        5 > i;
        i++) {
        for (var n = "", s = 0; 16 > s; s++) {
            var a = Math.floor(62 * Math.random());
            n += t[a]
        }
        e.push(n)
    }
    return e;
}

var secretkeyArrayV2 = () => {
    for (var _0x1360af = [], _0x166731 = '', _0x169dc2 = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], _0x189f8b = 0x0; 0x4 > _0x189f8b; _0x189f8b++) {
        for (var _0x1accce = '', _0x4a9a68 = 0x0; 0x10 > _0x4a9a68; _0x4a9a68++) {
            var _0x1c91f6 = Math['floor'](0x3e * Math['random']());
            _0x1accce += _0x169dc2[_0x1c91f6];
        }
        _0x1360af['push'](_0x1accce),
            _0x166731 += _0x1accce['substring'](0x0, 0x4);
    }
    return {
        _0x1360af,
        _0x166731
    }
}

var CryptoUtil = {
    crypto_decrypt,
    crypto_encrypt,
    CryptoJS_encrypt,
    CryptoJS_decrypt,
    encryptParamsV1: (params) => {
        let parKey = secretkeyArrayV1()
        let n = Math.floor(Math.random() * 5)
        return {
            "params": CryptoJS_encrypt(JSON.stringify(params), parKey[n]) + n,
            "parKey": parKey
        }
    },
    decryptParamsV1: (data) => {
        return JSON.parse(CryptoJS_decrypt(data.params.substr(0, data.params.length - 1), data.parKey[parseInt(data.params.substr(-1, 1))]))
    },
    encryptParamsV2: (params) => {
        let { _0x166731, _0x1360af } = secretkeyArrayV2()
        let n = Math.floor(Math.random() * 5)
        return {
            "params": CryptoJS_encrypt(JSON.stringify(params), _0x166731) + n,
            "parKey": _0x1360af
        }
    },
    decryptParamsV2: (data) => {
        let decrypt_key = data.parKey.map(s => s.substring(0x0, 0x4)).join('')
        return JSON.parse(CryptoJS_decrypt(data.params.substr(0, data.params.length - 1), decrypt_key))
    },
    encryptParamsV3: (params, jfid) => {
        return {
            "params": CryptoJS_RC4_encrypt(JSON.stringify(params), jfid.slice(0x3, 0x13))
        }
    },
    decryptParamsV3: (data, jfid) => {
        return JSON.parse(CryptoJS_RC4_decrypt(data.params, jfid.slice(0x3, 0x13)))
    },
    // data 是准备加密的字符串,key是你的密钥
    encryptionTaskRewardVideoParams: (params) => {
        let key = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex').substr(8, 16)
        let t = JSON.stringify(params).replace(/\//g, "\\\/")//.replace('"{pack_time}"', '1.609770734935479E9')
        let m = crypto_encrypt(t, (key + key).substr(8, 16)).replace(/(.{76})/g, '$1\n')
        m = '2' + key + m
        return {
            message: m,
            cypher: 2
        }
    },
    decryptionTaskRewardVideoParams: (data) => {
        let s = data.message.substr(1, 16)
        let key = (s + s).substr(8, 16)
        return crypto_decrypt(data.message.replace(/\n/g, '').substr(17), key)
    },
    signRewardVideoParams: (data) => {
        let str = 'integralofficial&'
        let params = []
        data.forEach((v, i) => {
            if (v) {
                params.push('arguments' + (i + 1) + v)
            }
        });
        return crypto.createHash('md5').update(str + params.join('&')).digest('hex')
    }
}

module.exports = CryptoUtil