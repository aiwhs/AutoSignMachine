
const { buildUnicomUserAgent, appInfo } = require('../../../utils/device')

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

//随机数
function MathRand() {
    var Num = "";
    for (var i = 0; i < 6; i++) {
        Num += Math.floor(Math.random() * 10);
    }
    return Num;
}

//sha1加密
function encodeUTF8(s) {
    var i, r = [], c, x;
    for (i = 0; i < s.length; i++)
        if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
        else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
        else {
            if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                    r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
            else r.push(0xE0 + (c >> 12 & 0xF));
            r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
        };
    return r;
}

// 字符串加密成 hex 字符串
function sha1(s) {
    var data = new Uint8Array(encodeUTF8(s))
    var i, j, t;
    var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
    s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
    for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
    s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
    s[l - 1] = data.length << 3;
    var w = [], f = [
        function () { return m[1] & m[2] | ~m[1] & m[3]; },
        function () { return m[1] ^ m[2] ^ m[3]; },
        function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
        function () { return m[1] ^ m[2] ^ m[3]; }
    ], rol = function (n, c) { return n << c | n >>> (32 - c); },
        k = [1518500249, 1859775393, -1894007588, -899497514],
        m = [1732584193, -271733879, null, null, -1009589776];
    m[2] = ~m[0], m[3] = ~m[1];
    for (i = 0; i < s.length; i += 16) {
        var o = m.slice(0);
        for (j = 0; j < 80; j++)
            w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
                t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
                m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
        for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
    };
    t = new DataView(new Uint32Array(m).buffer);
    for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);

    var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
        return (e < 16 ? "0" : "") + e.toString(16);
    }).join("");
    return hex;
}

var xiaowogameh5 = {
    openPlatLine: async (axios, options) => {
        const { game } = options
        let gid = game.url.substr(game.url.indexOf('gid=') + 4).split('&')[0]
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let res = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "X-Requested-With": appInfo.package_name
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm`,
            method: 'GET',
            params: transParams({
                'to_url': 'https://account.bol.wo.cn/cuuser/open/openLogin/xiaowogameh5?ct=h5quicklogin',
                'gid': gid,
                'xw_flow': '0',
                'xw_lt': '1',
                'xw_lc': '1',
                'member': '302',
                'flowType': 'free',
                'yw_code': '',
                'desmobile': options.user,
                'version': appInfo.unicom_version
            }),
            transformResponse: (data, headers) => {
                if ('location' in headers) {
                    let uu = new URL(headers.location)
                    let pp = {}
                    for (let p of uu.searchParams) {
                        pp[p[0]] = p[1]
                    }
                    if ('ticket' in pp) {
                        searchParams = pp
                    }
                }
                return data
            }
        }).catch(err => console.error(err))
        return {
            searchParams,
            gid,
            jar: config.jar
        }
    },
    dogameReport12: async (axios, options) => {
        const { uid, launchid, gid } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        var timestamp = parseInt(new Date().getTime() / 1000)
        var heartbeatKey = '189a98bc908d889a'
        let random = MathRand()

        let params = {
            'uid': uid,
            'gid': gid,
            'launchid': launchid,
            'timestamp': timestamp,
            'nonce': random
        }

        var valarr = []
        valarr.push(uid)
        valarr.push(gid)
        valarr.push(launchid)
        valarr.push(timestamp)
        valarr.push(random)
        valarr.push(heartbeatKey)
        var temparr = valarr.sort()
        var tempstr = temparr.join('')
        var sign = sha1(tempstr)

        params['sign'] = sign

        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "http://assistant.flow.wostore.cn",
                "origin": "http://assistant.flow.wostore.cn"
            },
            url: `https://xiao.wo.com.cn/woyoujiang/activity/game-report12`,
            method: 'get',
            params: transParams(params)
        })

        console.info(data.data)
    },
    playGame: async (axios, options) => {
        const { jar, gid } = await xiaowogameh5.openPlatLine(axios, options)

        let cookiesJson = jar.toJSON()
        let uid = cookiesJson.cookies.find(i => i.key == 'newid')
        uid = uid.value

        let launchid = cookiesJson.cookies.find(i => i.key == 'stl_id')
        launchid = launchid.value

        let n = 6

        while (n > 0) {
            await xiaowogameh5.dogameReport12(axios, {
                ...options,
                uid,
                gid,
                launchid
            })
            console.info('等待1分钟')
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 60) * 1000))

            --n
        }

    }
}
module.exports = xiaowogameh5