var crypto = require('crypto');
var CryptoJS = require("crypto-js");
const { URL } = require('url');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams, encryptParamsV3 } = require('./CryptoUtil')
// 豪礼大派送
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

var secretkeyArray = function () {
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

var newSecretkeyArray = () => {
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

var encrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

var decrypt = function (word, keyStr) {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var decrypted = CryptoJS.AES.decrypt(word, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

module.exports = {
    getTicket: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let res = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/",
                "origin": "https://m.jf.10010.com"
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/tigerarmqd&duanlianjieabc=tbkyH`,
            method: 'get',
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
            jar: res.config.jar
        }
    },
    timesDraw: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { searchParams, jar } = await module.exports.getTicket(axios, options)
        let cookiesJson = jar.toJSON()
        let jfid = cookiesJson.cookies.find(i => i.key == '_jf_id')
        if (!jfid) {
            throw new Error('jfid缺失')
        }
        jfid = jfid.value

        let keyArr = secretkeyArray()
        let keyrdm = Math.floor(Math.random() * 5)

        let params = {
            activityId: "Ac-de644531df54410e875ba08ca2256b6a",
            userCookie: jfid,
            userNumber: searchParams.userNumber,
            time: new Date().getTime()
        };

        let reqdata = JSON.stringify({
            params: encrypt(JSON.stringify(params), keyArr[keyrdm]) + keyrdm,
            parKey: keyArr
        })

        let res = await axios.request({
            baseURL: 'https://m.jf.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/tigerarm/index.html?jump=sign",
                "origin": "https://img.jf.10010.com",
                "Content-Type": "application/json"
            },
            jar,
            url: `/jf-yuech/p/freeLoginRock`,
            method: 'post',
            data: reqdata
        }).catch(err => console.error(err))
        let result = res.data
        if (result.code !== 0) {
            throw new Error(result.message)
        }
        let jar1 = res.config.jar

        let activity = result.data.activityInfos.activityVOs[0]
        let Authorization = result.data.token.access_token
        let freeTimes = activity.activityTimesInfo.freeTimes
        let advertTimes = activity.activityTimesInfo.advertTimes

        do {
            console.info("已消耗机会", (1 + 4) - (freeTimes + advertTimes), "剩余免费机会", freeTimes, '看视频广告机会', advertTimes)

            if (!freeTimes && !advertTimes) {
                console.info('没有游戏次数')
                break
            }
            let currentTimes = (1 + 4) - (freeTimes + advertTimes) + 1

            let p1 = {
                activityId: activity.activityId,
                currentTimes: freeTimes,
                type: "积分"
            }

            if (!freeTimes && advertTimes) {
                let params = {
                    'arguments1': 'AC20200611152252',
                    'arguments2': '',
                    'arguments3': '',
                    'arguments4': new Date().getTime(),
                    'arguments6': '',
                    'arguments7': '',
                    'arguments8': '',
                    'arguments9': '',
                    'netWay': 'Wifi',
                    'remark1': '到小游戏豪礼派送',
                    'remark': '签到小游戏翻倍得积分',
                    'version': appInfo.unicom_version,
                    'codeId': 945705532
                }
                params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
                params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')

                result = await require('./taskcallback').reward(axios, {
                    ...options,
                    params,
                    jar: jar1
                })

                p1 = {
                    'activityId': activity.activityId,
                    'currentTimes': advertTimes,
                    'type': '广告',
                    'orderId': params['orderId'],
                    'phoneType': 'android',
                    'version': appInfo.version
                }
                advertTimes--
            } else {
                freeTimes--
            }

            let { _0x166731, _0x1360af } = newSecretkeyArray()
            let n = Math.floor(Math.random() * 5)
            params = {
                "params": encrypt(JSON.stringify(p1), _0x166731) + n,
                "parKey": _0x1360af
            }

            res = await axios.request({
                baseURL: 'https://m.jf.10010.com/',
                headers: {
                    "Authorization": `Bearer ${Authorization}`,
                    "user-agent": useragent,
                    "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/tigerarm/index.html?jump=sign",
                    "origin": "https://img.jf.10010.com"
                },
                url: `/jf-yuech/api/gameResultV2/timesDrawForPrize`,
                method: 'post',
                data: encryptParamsV3(p1, jfid)
            })
            result = res.data
            if (result.code !== 0) {
                console.info("豪礼大派送抽奖:", result.message)
            } else {
                if (result.data.consumptionV1Infos.code !== '0') {
                    console.info("豪礼大派送抽奖:", result.data.consumptionV1Infos.result)
                } else {
                    if (result.data.consumptionV1Infos.gameResult.prizeStatus === '中奖') {
                        if (result.data.consumptionV1Infos.gameResult.integralScore) {
                            console.reward('integral', result.data.consumptionV1Infos.gameResult.integralScore)
                            console.info('豪礼大派送抽奖:', '中奖+', result.data.consumptionV1Infos.gameResult.integralScore)
                        } else {
                            console.info(result.data.consumptionV1Infos)
                            console.info('豪礼大派送抽奖:', '中奖')
                        }
                    } else {

                        console.info('豪礼大派送抽奖:', result.data.consumptionV1Infos.gameResult.prizeStatus)
                    }
                }
            }

            if (freeTimes && advertTimes) {
                console.info('等待15秒再继续')
                await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
            }

        } while (freeTimes || advertTimes)
    }
}