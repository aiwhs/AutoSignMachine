var crypto = require('crypto');

function getKey() {
    return "DFG#$%^#%$RGHR(&*M<><"
}

// byte/string/buffer
function makePassword(key) {
    if (key == null || key.length <= 16) {
        return new Int8Array(Buffer.from(key));
    }
    return crypto.createHash('md5').update(key, 'utf-8').digest()
}

// byte[], byte[]
function encrypt(data, key) {
    let v = null;
    let k = null;
    if (key == null) {
        key = getKey();
    }

    key = makePassword(key);
    if (data != null && key != null && data.length != 0) {
        let n = data.length % 4 == 0 ? (data.length >>> 2) + 1 : (data.length >>> 2) + 2;
        let v = byteToIntArr(data, new Int32Array(Buffer.alloc(n)));
        v[n - 1] = data.length;
        n = key.length % 4 == 0 ? key.length >>> 2 : (key.length >>> 2) + 1;
        if (n < 4) {
            n = 4;
        }

        let k = byteToIntArr(key, new Int32Array(Buffer.alloc(n)));

        let z;
        n = v.length - 1;
        z = v[n];
        let y = v[0];
        let delta = -1640531527;
        let sum = 0;

        let e;
        let p;
        for (let var11 = 6 + parseInt(52 / (n + 1)); var11-- > 0; z = v[n] += (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z)) {
            sum += delta;
            e = sum >>> 2 & 3;

            for (p = 0; p < n; ++p) {
                y = v[p + 1];
                z = v[p] += (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            }

            y = v[0];
        }

        n = v.length << 2;
        return intToByteArr(v, v.length, new Int8Array(Buffer.alloc(n)));;;
    } else {
        return data;
    }
}
// byte[], byte[]
function decrypt(data, key) {
    if (key == null) {
        key = getKey();
    }
    let key2 = makePassword(key);
    if (data == null || key2 == null || data.length == 0) {
        return data;
    }
    if (data.length % 4 != 0 || data.length < 8) {
        return null;
    }
    let v = byteToIntArr(data, new Int32Array(Buffer.alloc(data.length >>> 2)))

    let n = key2.length % 4 == 0 ? key2.length >>> 2 : (key2.length >>> 2) + 1;
    if (n < 4) {
        n = 4;
    }
    let k = byteToIntArr(key2, new Int32Array(Buffer.alloc(n)))

    let n2 = v.length - 1;
    let i2 = v[n2];
    let y = v[0];
    for (let sum = (parseInt(52 / (n2 + 1)) + 6) * -1640531527; sum != 0; sum -= -1640531527) {
        let e = (sum >>> 2) & 3;
        let p = n2;
        while (p > 0) {
            let z = v[p - 1];
            y = v[p] - ((((z >>> 5) ^ (y << 2)) + ((y >>> 3) ^ (z << 4))) ^ ((sum ^ y) + (k[(p & 3) ^ e] ^ z)));
            v[p] = y;
            p--;
        }
        let z2 = v[n2];
        y = v[0] - ((((z2 >>> 5) ^ (y << 2)) + ((y >>> 3) ^ (z2 << 4))) ^ ((sum ^ y) + (k[(p & 3) ^ e] ^ z2)));
        v[0] = y;
    }
    let n3 = v[v.length - 1];
    if (n3 < 0 || n3 > ((v.length - 1) << 2)) {
        return null;
    }
    return intToByteArr(v, v.length - 1, new Int8Array(Buffer.alloc(n3)));;
}

// byte[], int[]
function byteToIntArr(data, v) {
    let a = data.length >> 2;
    let i = 0;
    let j = 0;
    while (i < a) {
        let j2 = j + 1;
        v[i] = data[j] & 255;
        let j3 = j2 + 1;
        v[i] = (v[i] | ((data[j2] & 255) << 8));
        let j4 = j3 + 1;
        v[i] = v[i] | ((data[j3] & 255) << 16);
        j = j4 + 1;
        v[i] = v[i] | ((data[j4] & 255) << 24);
        i++;
    }
    if (j < data.length) {
        let j5 = j + 1;
        v[i] = data[j] & 255;
        let k = 8;
        while (j5 < data.length) {
            v[i] = v[i] | ((data[j5] & 255) << k);
            j5++;
            k += 8;
        }
    }

    return v
}

// int[], int, byte[]
function intToByteArr(data, len, v) {
    let j = 0;
    let a = v.length >> 2;
    if (a > len) {
        a = len;
    }

    let i;
    for (i = 0; i < a; ++i) {
        v[j++] = (data[i] & 255);
        v[j++] = (data[i] >>> 8 & 255);
        v[j++] = (data[i] >>> 16 & 255);
        v[j++] = (data[i] >>> 24 & 255);
    }

    if (len > a && j < v.length) {
        v[j++] = (data[i] & 255);

        for (let k = 8; k <= 24 && j < v.length; k += 8) {
            v[j++] = (data[i] >>> k & 255);
        }
    }
    return v
}

module.exports = {
    encrypt,
    decrypt,
    intToByteArr,
    byteToIntArr
}