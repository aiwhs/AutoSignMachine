
const { buildUnicomUserAgent, appInfo } = require('../../../utils/device')
var moment = require('moment');

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

var dailyBookAnswer = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let { data, config } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm?to_url=https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
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
        return {
            searchParams,
            jar: config.jar
        }
    },
    shoutingTicketLogin: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { jar, searchParams } = await dailyBookAnswer.openPlatLine(axios, options)
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "accessToken": "Bearer ef1a204b17ff4b23ab097af979a640f0",
                "chc": "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                "origin": "https://edu.10155.com",
                "referer": `https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&type=06&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&userNumber=${options.user}`,
                "jrPlatform": "2",
                "X-Requested-With": appInfo.package_name
            },
            url: `https://edu.10155.com/wxx-api/Api/Shouting/shoutingTicketLogin`,
            method: 'post',
            data: transParams({
                accountID: options.user,
                chc: "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                jrPlatform: "ACTIVITY",
                shoutingversion: appInfo.unicom_version,
                ticket: searchParams.ticket,
                ua: useragent
            })
        })
        return {
            searchParams,
            accessToken: data.data.accessToken
        }
    },
    userActInfo: async (axios, options) => {
        const { accessToken, searchParams } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "accessToken": accessToken,
                "chc": "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                "referer": `https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&type=06&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&userNumber=${options.user}`,
                "jrPlatform": "2",
                "X-Requested-With": appInfo.package_name
            },
            url: `https://edu.10155.com/wxx-api/Api/Stdthd/userActInfo`,
            method: 'post',
            data: transParams({
                actId: '2',
                chc: "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                jrPlatform: "ACTIVITY"
            })
        })
        return data.data
    },
    getToday: async (axios, options) => {
        const { accessToken, searchParams } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "accessToken": accessToken,
                "chc": "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                "referer": `https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&type=06&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&userNumber=${options.user}`,
                "jrPlatform": "2",
                "X-Requested-With": appInfo.package_name
            },
            url: `https://edu.10155.com/wxx-api/Api/Stdthd/actInfo`,
            method: 'post',
            data: transParams({
                actId: '2',
                chc: "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                jrPlatform: "ACTIVITY"
            })
        })
        return data.data.today
    },
    answer: async (axios, options) => {
        const { accessToken, searchParams, actId, questionId, answerId } = options
        let timestamp = moment().format('YYYYMMDDHHmmss')
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "accessToken": accessToken,
                "chc": "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                "referer": `https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&type=06&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&userNumber=${options.user}`,
                "jrPlatform": "2",
                "X-Requested-With": appInfo.package_name
            },
            url: `https://edu.10155.com/wxx-api/Api/Stdthd/answer`,
            method: 'post',
            data: transParams({
                actId: actId,
                questionId: questionId,
                answerId: answerId,
                chc: "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                jrPlatform: "ACTIVITY"
            })
        })
    },
    raffle: async (axios, options) => {
        const { accessToken, searchParams, actId, answerId } = options
        let timestamp = moment().format('YYYYMMDDHHmmss')
        const useragent = buildUnicomUserAgent(options, 'p')
        let prizeMap = {
            '6': "樊登读书课程月卡",
            '7': "简七理财课程月卡",
            '8': "腾讯视频VIP周卡",
            '9': "爱奇艺VIP周卡"
        }
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "accessToken": accessToken,
                "chc": "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                "referer": `https://edu.10155.com/wact/stdt2.html?jrPlatform=SHOUTING&type=06&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&chc=VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg&yw_code=&userNumber=${options.user}`,
                "jrPlatform": "2",
                "X-Requested-With": appInfo.package_name
            },
            url: `https://edu.10155.com/wxx-api/Api/Stdthd/raffle`,
            method: 'post',
            data: transParams({
                actId: actId,
                answerId: answerId,
                chc: "VHFWJgE9DzhWOABjVS9QY1EgBDIEOlBkAioJMFBg",
                jrPlatform: "ACTIVITY"
            })
        })
        if (data.data.sbl_reward_id) {
            console.reward(prizeMap[data.data.sbl_reward_id + ''])
            console.notify(data.message, prizeMap[data.data.sbl_reward_id + ''] || '')
        } else {
            console.info(data.message, '未中奖')
        }
    },
    doTask: async (axios, options) => {
        let { accessToken, searchParams } = await dailyBookAnswer.shoutingTicketLogin(axios, options)
        let { answer } = await dailyBookAnswer.userActInfo(axios, {
            ...options,
            searchParams,
            accessToken
        })
        let today = await dailyBookAnswer.getToday(axios, {
            ...options,
            searchParams,
            accessToken
        })
        if (!answer || answer.sal_answer_status === '0') {
            await dailyBookAnswer.answer(axios, {
                ...options,
                searchParams,
                accessToken,
                actId: today.sq_act_id,
                questionId: today.sq_id,
                answerId: today.sq_answer
            })
            let { answer: useanswer, round } = await dailyBookAnswer.userActInfo(axios, {
                ...options,
                searchParams,
                accessToken
            })
            if (useanswer.sal_answer_status === '1') {
                console.info('答题正确')
            } else {
                console.error('答题错误')
                return
            }
            let bonus = "1" == useanswer.sal_is_bonus && "0" == useanswer.sal_get_bonus ? 1 : 0
            console.info('已答题', round.srl_success_days, '天', '抽奖次数', bonus, '次')
            if (bonus) {
                await dailyBookAnswer.raffle(axios, {
                    ...options,
                    searchParams,
                    accessToken,
                    actId: useanswer.sq_act_id,
                    answerId: useanswer.sal_id
                })
                console.info('今日答题抽奖结束')
            }
        } else {
            console.info('今日已答题完毕')
        }
    }

}
module.exports = dailyBookAnswer