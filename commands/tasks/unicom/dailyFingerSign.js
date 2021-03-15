const { encryptParamsV1, encryptParamsV2, encryptParamsV3, signRewardVideoParams, decryptParamsV1, decryptParamsV2, decryptParamsV3 } = require('./CryptoUtil')
const crypto = require('crypto');
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { TryNextEvent } = require('../../../utils/EnumError')

var dailyFingerSign = {
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
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/fingerSignq&duanlianjieabc=tbKFo`,
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
    freeLoginGuess: async (axios, options) => {
        const { jfid, searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')

        let params = {
            activityId: "Ac-yc0001,Ac-yc0002,Ac-yc0003",
            userCookie: jfid,
            userNumber: searchParams.userNumber,
            time: new Date().getTime()
        };

        let encrypted_params = encryptParamsV1(params)
        let res = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/fingerqd/index.html?jump=sign",
                "origin": "https://m.jf.10010.com",
                "Content-Type": "application/json"
            },
            jar,
            url: `https://m.jf.10010.com/jf-yuech/p/freeLoginGuess`,
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
        const { plat, codeId } = options
        let params = {
            'arguments1': 'AC20200611152252',
            'arguments2': 'GGPD',
            'arguments3': '627292f1243148159c58fd58917c3e67',
            'arguments4': new Date().getTime(),
            'arguments6': "517050707",
            'arguments7': "517050707",
            'arguments8': "123456",
            'arguments9': "4640b530b3f7481bb5821c6871854ce5",
            'netWay': 'Wifi',
            'remark1': '签到小游戏猜拳拿奖',
            'remark': '签到抽奖小游戏',
            'version': appInfo.unicom_version,
            'codeId': codeId
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
    minusRondGames: async (axios, options) => {
        const { Authorization, params } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Authorization": `Bearer ${Authorization}`,
                "Origin": "https://m.jf.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/fingerqd/index.html?jump=sign"
            },
            url: `https://m.jf.10010.com/jf-yuech/api/gameResultV2/minusRondGames`,
            method: 'POST',
            data: params
        })
        return {
            resultId: data.data?.roundGame?.roundId
        }
    },
    roundGameForPrize: async (axios, options) => {
        const { Authorization, params, activityId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "Authorization": `Bearer ${Authorization}`,
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/fingerqd/index.html?jump=sign",
                "origin": "https://img.jf.10010.com"
            },
            url: `https://m.jf.10010.com/jf-yuech/api/gameResultV2/roundGameForPrize`,
            method: 'post',
            data: params
        })
        if (data.code === 0) {
            if ('drawResultPO' in data.data && data.data.drawResultPO) {
                console.reward(data.data.drawResultPO.prizeName)
                console.info(data.data.drawResultPO.prizeType, data.data.drawResultPO.prizeName)
                if (data.data.drawResultPO.doublingStatus) {
                    console.info('提交积分翻倍')
                    await dailyFingerSign.lookVideoDouble(axios, {
                        ...options
                    })
                    await dailyFingerSign.lookVideoDoubleResult(axios, {
                        ...options,
                        Authorization,
                        activityId: activityId,
                        winningRecordId: data.data.drawResultPO.winningRecordId
                    })
                }
            } else if ('consumptionV2Infos' in data.data && data.data.consumptionV2Infos && 'roundGame' in data.data.consumptionV2Infos) {
                let roundGame = data.data.consumptionV2Infos.roundGame
                if (roundGame.drawStatus == 1) {
                    console.info('平分秋色')
                } else if (roundGame.drawStatus == 2) {
                    console.info('不慎落败')
                } else if (roundGame.drawStatus == 3) {
                    console.info('获得胜利', roundGame.prizeStatus)
                }
            }
        } else {
            console.info(data.message)
        }
    },
    lookVideoDouble: async (axios, options) => {
        // AC20200611152252 - 627292f1243148159c58fd58917c3e67 总30次，多个游戏共享，限制limit 1次
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200611152252',
            taskId: '627292f1243148159c58fd58917c3e67',
            codeId: 945689604,
            reward_name: '猜拳拿奖翻倍得积分',
            limit: 1
        })
    },
    lookVideoDoubleResult: async (axios, options) => {
        let { Authorization, activityId, winningRecordId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let res = await axios.request({
            headers: {
                "Authorization": `Bearer ${Authorization}`,
                "user-agent": useragent,
                "referer": "https://img.jf.10010.com/",
                "origin": "https://img.jf.10010.com"
            },
            url: `https://m.jf.10010.com/jf-yuech/api/gameResult/doublingIntegral?activityId=${activityId}&winningRecordId=${winningRecordId}`,
            method: 'get'
        })
        result = res.data
        if (result.code !== 0) {
            console.info("猜拳拿奖翻倍结果:", result.message)
        } else {
            console.info("猜拳拿奖翻倍结果:", result.data)
        }
    },
    doTask: async (axios, options) => {

        // 4次2局
        let a = 1

        let noTry = false

        do {
            let plat = await dailyFingerSign.openPlatLine(axios, options)
            let { token, activityInfos, roundGame } = await dailyFingerSign.freeLoginGuess(axios, {
                ...options,
                ...plat
            })

            let activity = activityInfos.activityVOs.find(a => a.activityTimesInfo.advertTimes + a.activityTimesInfo.freeTimes)
            if (!activity) {
                console.info('已没有免费游戏次数')
                noTry = true
                break
            }
            let Authorization = token.access_token
            let freeTimes = activity.activityTimesInfo.freeTimes
            let advertTimes = activity.activityTimesInfo.advertTimes

            let resultId
            if (roundGame && roundGame.drawStatus !== '2') {
                console.info('存在未结束的回合，尝试出拳')
                resultId = roundGame.roundId
                activity = roundGame
            } else {
                console.info(activity.activityName + `[${activity.activityId}]`, "已消耗机会", (1 + 4) - (freeTimes + advertTimes), "剩余免费机会", freeTimes, '看视频广告机会', advertTimes)
                if (!freeTimes && !advertTimes) {
                    console.info('没有游戏次数')
                    break
                }

                let p = { activityId: activity.activityId, currentTimes: freeTimes, integral: 10, type: '免费' }

                if (!freeTimes && advertTimes) {
                    let { params } = await dailyFingerSign.doVideoReward(axios, {
                        ...options,
                        plat,
                        codeId: activity.advert.videoAndroid
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

                let res = await dailyFingerSign.minusRondGames(axios, {
                    ...options,
                    Authorization,
                    params: encryptParamsV3(p, plat.jfid)
                })
                if (!res.resultId) {
                    throw new Error('无法获得游戏回合')
                }
                resultId = res.resultId
            }

            let m = 2
            do {
                await dailyFingerSign.roundGameForPrize(axios, {
                    ...options,
                    Authorization,
                    activityId: activity.activityId,
                    params: encryptParamsV3({
                        activityId: activity.activityId,
                        resultId: resultId
                    }, plat.jfid)
                })
                await new Promise((resolve, reject) => setTimeout(resolve, 1000))
            } while (--m > 0)

            a++

            console.info('等待10秒再继续')
            await new Promise((resolve, reject) => setTimeout(resolve, 10 * 1000))
        } while (a <= 4)

        if (!noTry) {
            throw new TryNextEvent('在下一轮尝试一次')
        }
    }
}

module.exports = dailyFingerSign