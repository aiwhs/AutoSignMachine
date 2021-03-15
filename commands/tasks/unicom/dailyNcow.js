const { encryptParamsV1, encryptParamsV2, encryptParamsV3, signRewardVideoParams } = require('./CryptoUtil')
const crypto = require('crypto');
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var dailyNcow = {
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
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/ncow&duanlianjieabc=tbLlf`,
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
        let jfid = cookiesJson.cookies.find(i => i.key == '_jf_id')
        jfid = jfid.value

        return {
            jar,
            jfid,
            searchParams
        }
    },
    freeLoginRock: async (axios, options) => {
        const { jfid, searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')

        let params = {
            activityId: "Ac-yccnk",
            userCookie: jfid,
            userNumber: searchParams.userNumber,
            time: new Date().getTime()
        };

        let encrypted_params = encryptParamsV1(params)
        let res = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-qd/bcow/index.html?jump=sign",
                "origin": "https://img.jf.10010.com",
                "Content-Type": "application/json"
            },
            jar,
            url: `https://m.jf.10010.com/jf-yuech/p/freeLoginRock`,
            method: 'post',
            data: encrypted_params
        }).catch(err => console.error(err))

        result = res.data
        if (result.code !== 0) {
            throw new Error(result.message)
        }

        return result.data
    },
    doVideoReward: async (axios, options) => {
        const { plat } = options
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
            'remark1': '签到小游戏集牛卡，赚牛气',
            'remark': '签到小游戏翻倍得积分',
            'version': appInfo.unicom_version,
            'codeId': 945810471
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
    timesDrawForPrize: async (axios, options) => {
        const { Authorization, params } = options
        const useragent = buildUnicomUserAgent(options, 'p')

        let { data } = await axios.request({
            headers: {
                "Authorization": `Bearer ${Authorization}`,
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-qd/bcow/index.html?jump=sign",
                "origin": "https://img.jf.10010.com"
            },
            url: `https://m.jf.10010.com/jf-yuech/api/gameResultV2/timesDrawForPrize`,
            method: 'post',
            data: params
        })
        if (data.code === 0) {
            if ('drawResultPO' in data.data && data.data.drawResultPO) {
                console.reward(data.data.drawResultPO.prizeName)
                console.info(data.data.drawResultPO.prizeType, data.data.drawResultPO.prizeName)
            } else if ('consumptionV1Infos' in data.data && data.data.consumptionV1Infos && 'gameResult' in data.data.consumptionV1Infos) {
                let gameResult = data.data.consumptionV1Infos.gameResult
                console.info(gameResult.drawStatus, gameResult.prizeStatus)
            }
            return {
                advertTimes: data.data.consumptionV1Infos.advertTimes,
                freeTimes: data.data.consumptionV1Infos.freeTimes,
                doublingStatus: data.data.drawResultPO ? data.data.drawResultPO.doublingStatus : false
            }
        } else {
            console.info(data.message)
            return {
                advertTimes: 0,
                freeTimes: 0,
                doublingStatus: false
            }
        }
    },
    doTask: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let plat = await dailyNcow.openPlatLine(axios, options)
        let { token, activityInfos } = await dailyNcow.freeLoginRock(axios, {
            ...options,
            ...plat
        })

        let activity = activityInfos.activityVOs[0]
        let Authorization = token.access_token
        let freeTimes = activity.activityTimesInfo.freeTimes
        let advertTimes = activity.activityTimesInfo.advertTimes

        do {
            console.info(activity.activityName + `[${activity.activityId}]`, "已消耗机会", (1 + 4) - (freeTimes + advertTimes), "剩余免费机会", freeTimes, '看视频广告机会', advertTimes)
            if (!freeTimes && !advertTimes) {
                console.info('没有游戏次数')
                break
            }

            let p = { activityId: 'Ac-yccnk', currentTimes: freeTimes, integral: 10, type: '免费' }

            if (!freeTimes && advertTimes) {
                let { params } = await dailyNcow.doVideoReward(axios, {
                    ...options,
                    plat
                })
                p = {
                    'activityId': activity.activityId,
                    'currentTimes': advertTimes,
                    'type': '广告',
                    'integral': 10,
                    'orderId': params['orderId'],
                    'phoneType': 'android',
                    'version': appInfo.version
                }
                advertTimes--
            } else {
                freeTimes--
            }

            await dailyNcow.timesDrawForPrize(axios, {
                ...options,
                Authorization,
                params: encryptParamsV3(p, plat.jfid)
            })

            console.info('等待15秒再继续')
            await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
        } while (freeTimes || advertTimes)
    }
}

module.exports = dailyNcow