var dailyOtherRewardVideo = {
    // see https://m.jf.10010.com/jf-yuech/p/freeLoginGuess
    cleanRewardVideo: async (axios, options) => {
        // clean 4积分 30次
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200611152252',
            taskId: '627292f1243148159c58fd58917c3e67',
            codeId: 945689604,
            reward_name: '签到小游戏得积分'
        })

        // clean 6积分 30次
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200611152252',
            taskId: '73e3907bbf9c4748b2fe9a053cee5e82',
            codeId: 945689604,
            reward_name: '签到小游戏得积分'
        })

        // 抓OPPO手机
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '23cdde55584547369d70fa61093956cc',
            codeId: 945719787,
            reward_name: '签到小游戏买什么都省抓娃娃1积分翻3倍'
        })

        // 接元宝
        await require('./rewardVideo').doTask(axios, {
            ...options,
            acid: 'AC20200716103629',
            taskId: '45d6dbc3ad144c938cfa6b8e81803b85',
            codeId: 945757409,
            reward_name: '到小游戏买什么都省接元宝积分翻倍'
        })

    },
    // 服务-办理-套餐变更-赚积分
    doPackeageChangeVideoIntegralTask: async (request, options) => {
        await require('./rewardVideo').doTask(request, {
            ...options,
            acid: 'AC20201013153418',
            taskId: '8a6437e839494400b7ff34327759448f',
            codeId: 945576426,
            reward_name: '套餐变更看视频得积分'
        })
    },
    // 服务-查询-电子发票-赚积分
    doWisdomActivityIntegralTask: async (request, options) => {
        await require('./rewardVideo').doTask(request, {
            ...options,
            acid: 'AC20201013153418',
            taskId: '0f1bf4c79828485dbc612380288b9f10',
            codeId: 945576436,
            reward_name: '电子发票看视频得积分'
        })
    },
    // 福利社-聚人气-看视频得积分
    doWelfareActivityIntegralTask: async (request, options) => {
        await require('./rewardVideo').doTask(request, {
            ...options,
            acid: 'AC20200416152907',
            taskId: 'ed0be2a2869f4f448afcff9f25e18e23',
            codeId: 945340295,
            reward_name: '聚人气看视频得积分'
        })
    }
}

module.exports = dailyOtherRewardVideo