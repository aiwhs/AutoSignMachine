
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')
const crypto = require('crypto')

// default
let account = {
    yhChannel: "GGPD",
    accountChannel: "517050707",
    accountUserName: "517050707",
    accountPassword: "123456",
    accountToken: "4640b530b3f7481bb5821c6871854ce5",
}

var rewardVideo = {
    buildRewardParams(options) {
        const {
            acid, taskId, codeId, reward_name, remark,
            arguments2, arguments6, arguments7, arguments8, arguments9,
            orderId
        } = options
        return {
            'arguments1': acid, // acid
            'arguments2': arguments2 !== undefined ? arguments2 : account.yhChannel, // yhChannel
            'arguments3': taskId, // yhTaskId menuId
            'arguments4': new Date().getTime(), // time
            'arguments6': arguments6 !== undefined ? arguments6 : account.accountChannel,
            'arguments7': arguments7 !== undefined ? arguments7 : account.accountUserName,
            'arguments8': arguments8 !== undefined ? arguments8 : account.accountPassword,
            'arguments9': arguments9 !== undefined ? arguments9 : account.accountToken,
            'orderId': orderId !== undefined ? orderId : crypto.createHash('md5').update(new Date().getTime() + '').digest('hex'),
            'netWay': 'Wifi',
            'remark1': reward_name,
            'remark': remark || reward_name,
            'version': appInfo.unicom_version,
            'codeId': codeId
        }
    },
    /**
     * 查询任务
     * @param {*} request 
     * @param {*} options 
     */
    query: async (request, options) => {
        const { acid, taskId, arguments2, arguments6 } = options
        let params = {
            'arguments1': acid, // acid
            'arguments2': arguments2 !== undefined ? arguments2 : account.yhChannel, // yhChannel
            'arguments3': taskId, // yhTaskId menuId
            'arguments4': new Date().getTime(), // time
            'arguments6': arguments6 !== undefined ? arguments6 : account.accountChannel,
            'netWay': 'Wifi',
            'version': appInfo.unicom_version,
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        return await require('./taskcallback').query(request, {
            ...options,
            params
        })
    },
    /**
     * 看视频完成任务
     * @param {*} request 
     * @param {*} options 
     */
    doTask: async (request, options) => {
        // 活动 任务 广告代码位  备注
        const { reward_name, remark, limit } = options
        let { num, jar, fixNum } = await rewardVideo.query(request, options)
        if (num <= 0) {
            console.info(reward_name || remark, '今日已完成')
            return
        }
        let n = 0
        do {

            if (limit && n >= limit) {
                break
            }

            console.info('第', num, '次')
            let params = rewardVideo.buildRewardParams(options)
            params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
            await require('./taskcallback').doTask(request, {
                ...options,
                params,
                jar
            })

            let s = Math.floor(Math.random() * 20)
            console.info('等待%s秒再继续', s)
            await new Promise((resolve, reject) => setTimeout(resolve, s * 1000))

            ++n;

        } while (--num > 0)
    },
    /**
     * 看视频获得游戏机会
     * @param {*} request 
     * @param {*} options 
     */
    doReward: async (request, options) => {
        // 活动 任务 广告代码位  备注
        const { reward_name, remark } = options
        let { num, jar } = await rewardVideo.query(request, options)
        if (num <= 0) {
            console.info(reward_name || remark, '今日已完成')
            return
        }
        let params = rewardVideo.buildRewardParams(options)
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        await require('./taskcallback').doReward(request, {
            ...options,
            params,
            jar
        })

        return params
    },
    /**
     * 看视频获得游戏机会
     * @param {*} request 
     * @param {*} options 
     */
    doRewardNoQuery: async (request, options) => {
        // 活动 任务 广告代码位  备注
        const { jar } = options
        let params = rewardVideo.buildRewardParams(options)
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        await require('./taskcallback').doReward(request, {
            ...options,
            params,
            jar
        })

        return params
    }
}

module.exports = rewardVideo