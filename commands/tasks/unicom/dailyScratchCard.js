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
var dailyScratchCard = {
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
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/luckCardPage&duanlianjieabc=tbkd2`,
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
    getScratchCardNum: async (axios, options) => {
        const { searchParams, ecs_token } = options
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'channelId': 'unicom_scratch_card',
            "phone": phone,
            'token': ecs_token
        }
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Authorization": ``,
                "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/luckCardPage?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbkd2&userNumber=${options.user}`
            },
            jar: null,
            url: `https://wxapp.msmds.cn/jplus/api/scratchCardRecord/getScratchCardNum`,
            method: 'POST',
            data: transParams(params)
        })
        return data.data
    },
    addScratchCardNum: async (axios, options) => {
        const { searchParams, ecs_token } = options
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'channelId': 'unicom_scratch_card',
            "phone": phone,
            'token': ecs_token
        }
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Authorization": ``,
                "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/luckCardPage?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbkd2&userNumber=${options.user}`
            },
            jar: null,
            url: `https://wxapp.msmds.cn/jplus/api/scratchCardRecord/addScratchCardNum`,
            method: 'POST',
            data: transParams(params)
        })
        return data.data
    },
    doSratchCard: async (axios, options) => {
        const { searchParams, ecs_token } = options

        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'channelId': 'unicom_scratch_card',
            "phone": phone,
            'token': ecs_token,
            'flag': '',
            'taskId': ''
        }

        let timestamp = moment().format('YYYYMMDDHHmmss')
        let result = await axios.request({
            headers: {
                "user-agent": useragent,
                "Authorization": ``,
                "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/luckCardPage?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbkd2&userNumber=${options.user}`
            },
            url: `https://wxapp.msmds.cn/jplus/api/scratchCardRecord/scratchCard`,
            method: 'POST',
            data: transParams(params)
        })

        if (result.data.code !== 200) {
            console.error('刮卡失败', result.data.msg)
            return false
        } else {
            let data = result.data.data
            console.info('刮卡成功', data.msg)
            if (data.canDouble) {
                console.info('提交积分翻倍')
                await dailyScratchCard.lookVideoDouble(axios, {
                    ...options,
                    jar: result.config.jar
                })
            }
            return data
        }
    },
    lookVideoDouble: async (axios, options) => {
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '9e368d7f6c474cc8a1491d6a9fabad45',
            codeId: 945535637,
            reward_name: '签到小游戏翻倍得积分'
        })
    },
    doVideoReward: async (axios, options) => {
        const { plat } = options
        let params = {
            'arguments1': 'AC20200716103629',
            'arguments2': '',
            'arguments3': '',
            'arguments4': new Date().getTime(),
            'arguments6': '',
            'arguments7': '',
            'arguments8': '',
            'arguments9': '',
            'netWay': 'Wifi',
            'remark1': '签到小游戏买什么都省刮刮乐获得次数',
            'remark': '签到页小游戏',
            'version': appInfo.unicom_version,
            'codeId': 945363376
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')

        result = await require('./taskcallback').reward(axios, {
            ...options,
            params,
            jar: plat.jar
        })
        return {
            params
        }
    },
    doTask: async (axios, options) => {
        let plat = await dailyScratchCard.openPlatLine(axios, options)
        let canLookVideo = true
        let n = 5
        do {

            await dailyScratchCard.getScratchCardNum(axios, {
                ...options,
                ...plat
            })

            if (n < 5) {
                if (canLookVideo) {
                    await dailyScratchCard.doVideoReward(axios, {
                        ...options,
                        plat
                    })
                    await dailyScratchCard.addScratchCardNum(axios, {
                        ...options,
                        ...plat
                    })
                } else {
                    break
                }
            }

            let data = await dailyScratchCard.doSratchCard(axios, {
                ...options,
                ...plat
            })
            canLookVideo = data.canLookVideo

            console.info('等待15秒再继续')
            await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))

        } while (--n > 0)

        console.info('游戏完成')

    }
}

module.exports = dailyScratchCard