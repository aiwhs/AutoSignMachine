const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
// 三只松鼠详情页看视频得积分
var dailyShop = {
    dovideoIntegralTask: async (request, options) => {
        await require('./rewardVideo').doTask(request, {
            ...options,
            acid: 'AC20200624091508',
            taskId: '10e36b51060a46499e48082656602bf8',
            codeId: 945254816,
            reward_name: '10分精彩看视频得积分',
            remark: '支付页'
        })
    },
    encryptmobile: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let res = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/jifenshangcheng/Directional?from=9110001000%E2%80%8B`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/dailylottery/static/textdl/userLogin?flag=1&floortype=tbanner&from=9110001000%E2%80%8B&oneid=undefined&twoid=undefined`,
            method: 'get'
        })
        let result = res.data
        let encryptmobile = result.substr(result.indexOf('encryptmobile=') + 14, 32)
        return encryptmobile
    },
    getActivty: async (axios, options) => {
        const { encryptmobile } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://m.client.10010.com/dailylottery/static/integral/firstpage?encryptmobile=${encryptmobile}`,
            },
            url: `https://m.client.10010.com/dailylottery/static/active/findActivityInfojifen?areaCode=085&groupByType=&mobile=${encryptmobile}`,
            method: 'get'
        })
        return data
    },
    duihuan: async (axios, options) => {
        const { encryptmobile } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://m.client.10010.com/dailylottery/static/integral/firstpage?encryptmobile=${encryptmobile}`,
            },
            url: `https://m.client.10010.com/dailylottery/static/integral/duihuan?goldnumber=10&banrate=30&usernumberofjsp=${encryptmobile}`,
            method: 'get'
        })
        if (data.code === '3000') {
            console.info('兑换抽奖机会成功')
            return true
        } else {
            console.error('兑换抽奖机会失败')
            return false
        }
    },
    dailyfreelottery: async (axios, options) => {
        const { encryptmobile } = options
        console.info('开始抽奖')
        const useragent = buildUnicomUserAgent(options, 'p')

        let res = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/",
                "origin": "https://img.client.10010.com"
            },
            url: `/dailylottery/static/integral/choujiang?usernumberofjsp=${encryptmobile}`,
            method: 'post'
        })
        let result = res.data
        if ('id' in result) {
            console.info('获得奖品', result.RspMsg)
        } else {
            console.error('抽奖失败', result.RspMsg)
        }
    },
    // 花费积分来抽奖-支持定向积分
    dailyintegrallottery: async (axios, options) => {
        let encryptmobile = await dailyShop.encryptmobile(axios, options)
        let activty = await dailyShop.getActivty(axios, {
            ...options,
            encryptmobile
        })
        let usableAcFreq = activty.acFrequency.usableAcFreq

        // 消耗已有的抽奖次数
        if (usableAcFreq > 0) {
            console.info('消耗已有的抽奖次数', usableAcFreq)
            while (usableAcFreq > 0) {
                await dailyShop.dailyfreelottery(axios, {
                    ...options,
                    encryptmobile
                })
                --usableAcFreq
            }
        }

        console.info('尝试5次，花费10定向积分兑换抽奖机会')

        await require('./integral').getDxDetail(axios, options)

        let n = 5 // max 30
        do {
            console.info('第', n, '次')
            let flag = await dailyShop.duihuan(axios, {
                ...options,
                encryptmobile
            })
            if (!flag) {
                continue
            }
            await dailyShop.dailyfreelottery(axios, {
                ...options,
                encryptmobile
            })
        } while (--n > 0)
    }
}
module.exports = dailyShop