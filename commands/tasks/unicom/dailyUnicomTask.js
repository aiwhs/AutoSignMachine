const { signRewardVideoParams, decryptionTaskRewardVideoParams } = require('./CryptoUtil')
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var crypto = require('crypto');

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
var dailyUnicomTask = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://jxbwlsali.kuaizhan.com/0/51/p721841247bc5ac?phone=${options.user}`,
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
    getTurnCardInfo: async (axios, options) => {
        const { jar, searchParams, ecs_token } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://jxbwlsali.kuaizhan.com/0/51/p721841247bc5ac?phone=${options.user}`,
                "origin": "https://jxbwlsali.kuaizhan.com"
            },
            url: `https://wxapp.msmds.cn/jplus/api/channel/turnCard/getTurnCardInfo`,
            method: 'post',
            data: transParams({
                'channelId': 'unicom_turn_card',
                'phone': phone,
                'token': ecs_token
            })
        })
        let hs = (data.data.turnCards || []).map(t => t.index + '')
        return {
            jar: config.jar,
            num: (data.data.turnCards || []).length,
            cards: ['1', '2', '3', '4', '5', '6'].filter(i => hs.indexOf(i) === -1)
        }
    },
    addNum: async (axios, options) => {
        const { jar, searchParams, ecs_token } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://jxbwlsali.kuaizhan.com/0/51/p721841247bc5ac?phone=${options.user}`,
                "origin": "https://jxbwlsali.kuaizhan.com"
            },
            url: `https://wxapp.msmds.cn/jplus/api/channel/turnCard/addNum`,
            method: 'post',
            data: transParams({
                'channelId': 'unicom_turn_card',
                'phone': phone,
                'token': ecs_token
            })
        })
        if (data.code === 200 && data.data === true) {
            console.info('增加游戏机会成功')
            return true
        } else {
            console.error('增加游戏机会失败')
            return false
        }
    },
    playTurnCard: async (axios, options) => {
        const { jar, searchParams, ecs_token, cardIdx } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://jxbwlsali.kuaizhan.com/0/51/p721841247bc5ac?phone=${options.user}`,
                "origin": "https://jxbwlsali.kuaizhan.com"
            },
            url: `https://wxapp.msmds.cn/jplus/api/channel/turnCard/play`,
            method: 'post',
            data: transParams({
                'channelId': 'unicom_turn_card',
                'phone': phone,
                'token': ecs_token,
                'cardIdx': cardIdx
            })
        })
        if (data.code === 200) {
            console.info('游戏成功')
            data.data.turnCards.filter(t => t.index == cardIdx).map(t => console.info(t.name, t.title))
        } else {
            console.error('游戏失败', data.msg)
        }
    },
    doIntegralAd: async (axios, options) => {
        // 美团
        let params = await require('./rewardVideo').doReward(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '90d46c26212649788ed1dd14134d35e5',
            codeId: 945535612,
            reward_name: '领福利赚积分-翻倍得积分'
        })
        if (params) {
            await require('./rewardVideo').doTask(axios, {
                ...options,
                acid: 'AC20200716103629',
                taskId: '90d46c26212649788ed1dd14134d35e5',
                arguments6: "",
                arguments7: "",
                arguments8: "",
                arguments9: "",
                orderId: params['orderId'],
                codeId: 945689604,
                reward_name: '领福利赚积分-翻倍得积分'
            })
        }

        // 饿了么
        params = await require('./rewardVideo').doReward(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '034a70393ef246039264765216450d5d',
            codeId: 945535612,
            reward_name: '领福利赚积分-翻倍得积分'
        })
        if (params) {
            await require('./rewardVideo').doTask(axios, {
                ...options,
                acid: 'AC20200716103629',
                taskId: '034a70393ef246039264765216450d5d',
                arguments6: "",
                arguments7: "",
                arguments8: "",
                arguments9: "",
                orderId: params['orderId'],
                codeId: 945689604,
                reward_name: '领福利赚积分-翻倍得积分'
            })
        }
    },
    // 翻牌抽奖
    doTurnCard: async (axios, options) => {
        let { ecs_token } = await dailyUnicomTask.openPlatLine(axios, options)

        while (true) {

            let { jar, num, cards } = await dailyUnicomTask.getTurnCardInfo(axios, {
                ...options,
                ecs_token
            })

            if (num >= 3) {
                console.info('已没有游戏机会')
                break
            }

            let cardIdx = cards[Math.floor(Math.random() * cards.length)]

            let params = {
                'arguments1': 'AC20200716103629',
                'arguments2': 'GGPD',
                'arguments3': '',
                'arguments4': new Date().getTime(),
                'arguments6': '',
                'arguments7': '',
                'arguments8': '',
                'arguments9': '',
                'netWay': 'Wifi',
                'remark': '签到领福利赚积分翻牌活动',
                'version': appInfo.unicom_version,
                'codeId': 945535532
            }
            params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
            params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')
            await require('./taskcallback').reward(axios, {
                ...options,
                params,
                jar
            })
            await new Promise((resolve, reject) => setTimeout(resolve, 2000))

            await dailyUnicomTask.addNum(axios, {
                ...options,
                ecs_token
            })

            await new Promise((resolve, reject) => setTimeout(resolve, 1000))

            await dailyUnicomTask.playTurnCard(axios, {
                ...options,
                ecs_token,
                cardIdx
            })

        }
    }
}
module.exports = dailyUnicomTask