const { encryptParamsV1, encryptParamsV2, signRewardVideoParams, decryptParamsV1, decryptParamsV2, decryptionTaskRewardVideoParams } = require('./CryptoUtil')
var crypto = require('crypto');
var moment = require('moment');
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};
function encryption(data, key) {
    var iv = "";
    var cipherEncoding = 'base64';
    var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}
function decryption(data, key) {
    var iv = "";
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(data, cipherEncoding), decipher.final()]).toString(clearEncoding);
}

function w() {
    var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
        , t = [];
    return Object.keys(e).forEach((function (a) {
        t.push("".concat(a, "=").concat(encodeURIComponent(e[a])))
    }
    )),
        t.join("&")
}

var dailyIngots = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&duanlianjieabc=tbLm0`,
            method: 'GET',
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
        let jar = result.config.jar

        let cookiesJson = jar.toJSON()
        let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
        ecs_token = ecs_token.value
        if (!ecs_token) {
            throw new Error('ecs_token缺失')
        }

        return {
            jar,
            ecs_token,
            searchParams
        }
    },
    getGoodsList: async (axios, options) => {
        const { ecs_token } = options
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        const useragent = buildUnicomUserAgent(options, 'p')
        let result = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://wxapp.msmds.cn/`,
                "origin": "https://wxapp.msmds.cn"
            },
            url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/IndexInfo`,
            method: 'POST',
            data: transParams({
                'channelId': 'LT_channel',
                'phone': phone,
                'token': ecs_token,
                'sourceCode': 'lt_ingots'
            })
        })
        if (result.data.code !== 200) {
            console.info(result.data.msg)
            return false
        }
        return result.data.data
    },
    startGame: async (axios, options) => {
        const { searchParams, a } = options
        const useragent = buildUnicomUserAgent(options, 'p')

        let timestamp = moment().format('YYYYMMDDHHmmss')
        result = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbLm0&userNumber=${options.user}`,
                "origin": "https://wxapp.msmds.cn"
            },
            url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/startGame`,
            method: 'POST',
            data: transParams(a)
        })

        if (result.data.code !== 200) {
            console.error('游戏失败', result.data.msg)
        } else {
            if (result.data.data) {
                for (let d of result.data.data) {
                    console.reward(d.prizeName)
                    console.info('获得', d.prizeName)
                    if (d.double) {
                        console.info('提交积分翻倍')
                        await dailyIngots.lookVideoDouble(axios, {
                            ...options,
                            jar: result.config.jar
                        })
                    }
                }
            } else {
                console.info('未获得奖励')
            }
        }
    },
    lookVideoDouble: async (axios, options) => {
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '56ff7ad4a6e84886b18ae8716dfd1d6d',
            codeId: 945757409,
            reward_name: '签到小游戏接元宝'
        })
    },
    doSignin: async (axios, options) => {
        const { searchParams, ecs_token } = options

        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        const useragent = buildUnicomUserAgent(options, 'p')
        let a = {
            'channelId': 'LT_channel',
            "phone": phone,
            'token': ecs_token,
            'sourceCode': 'lt_ingots'
        }

        let timestamp = moment().format('YYYYMMDDHHmmss')
        result = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbLm0&userNumber=${options.user}`,
                "origin": "https://wxapp.msmds.cn"
            },
            url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/sign?` + w(a),
            method: 'POST'
        })

        if (result.data.code !== 200) {
            console.error('签到失败', result.data.msg)
        } else {
            if (result.data.data) {
                console.info('签到成功', result.data.data.prizeName)
                if (result.data.data.double) {
                    console.info('提交积分翻倍')
                    await dailyIngots.lookVideoDouble(axios, {
                        ...options,
                        jar: result.config.jar
                    })
                }
            } else {
                console.info('没有返回数据')
            }
        }
    },
    doTask: async (axios, options) => {

        let plat = await dailyIngots.openPlatLine(axios, options)

        await dailyIngots.doSignin(axios, {
            ...options,
            ...plat
        })

        let n = 5

        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')

        while (true) {
            let data = await dailyIngots.getGoodsList(axios, {
                ...options,
                ...plat
            })

            let score = Math.floor(Math.random() * 10) + 110 // eval([5, 8, 10].map(n => n * Math.floor(Math.random() * 10) + 15).join('+'))

            score = encryption(score + '', 'gb6YCccUvth75Tm2')

            let a = {
                'channelId': 'LT_channel',
                "phone": phone,
                'token': plat.ecs_token,
                'score': score,
                'sourceCode': 'lt_ingots'
            }
            if (data.playAgain) {
                if (n < 5) {
                    let params = {
                        'arguments1': '',
                        'arguments2': '',
                        'arguments3': '',
                        'arguments4': new Date().getTime(),
                        'arguments6': '',
                        'arguments7': '',
                        'arguments8': '',
                        'arguments9': '',
                        'netWay': 'Wifi',
                        'remark': '签到小游戏聚宝盆',
                        'version': appInfo.unicom_version,
                        'codeId': 945757409
                    }
                    params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
                    params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')

                    let result = await require('./taskcallback').reward(axios, {
                        ...options,
                        params,
                        jar: plat.jar
                    })

                    let a = {
                        'channelId': 'LT_channel',
                        "phone": phone,
                        'token': plat.ecs_token,
                        'videoOrderNo': params['orderId'],
                        'sourceCode': 'lt_ingots'
                    }
                    let useragent = buildUnicomUserAgent(options, 'p')
                    let timestamp = moment().format('YYYYMMDDHHmmss')
                    let searchParams = plat.searchParams
                    result = await axios.request({
                        headers: {
                            "user-agent": useragent,
                            "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbLm0&userNumber=${options.user}`,
                            "origin": "https://wxapp.msmds.cn"
                        },
                        jar: plat.jar,
                        url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/playAgainByLookingVideos`,
                        method: 'POST',
                        data: transParams(a)
                    })

                    if (result.data.code !== 200) {
                        console.error('提交任务失败', result.data.msg)
                    } else {
                        console.info('提交任务成功', `${result.data.data}`)
                    }
                }
                await dailyIngots.startGame(axios, {
                    ...options,
                    ...plat,
                    a
                })
                console.info('等待15秒再继续')
                await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
            } else {
                break
            }
            --n

            if (n <= 0) {
                console.info('游戏完成')
                break
            }
        }
    }
}

module.exports = dailyIngots