const { buildUnicomUserAgent, appInfo } = require('../../../utils/device')
var moment = require('moment');
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};
var hfgo = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            headers: {
                "user-agent": useragent,
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm?to_url=https://account.bol.wo.cn/cuuser/open/openLogin/hfgo&yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
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
    login: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { config } = await axios.request({
            headers: {
                "user-agent": useragent,
            },
            jar,
            url: `https://account.bol.wo.cn/cuuser/open/openLogin/hfgo?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&yw_code=&desmobile=${options.user}&userNumber=${options.user}`,
            method: 'GET'
        })
        return {
            jar: config.jar
        }
    },
    toSignPage: async (axios, options) => {
        const { searchParams, jar, token } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
            },
            jar,
            url: `https://hfgo.wo.cn/hfgoapi/cuuser/auth/autoLogin`,
            method: 'GET',
            params: transParams({
                'redirectUrl': 'https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo',
                'Authorization': token
            })
        })
        return {
            jar: config.jar
        }
    },
    actUserSign: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo",
            },
            jar,
            url: `https://atp.bol.wo.cn/atpapi/act/actUserSign/everydaySign?actId=1516`,
            method: 'get'
        })
        if (data.code === '0000') {
            console.info('签到成功')
        } else {
            console.error('签到失败', data.message)
        }
    },
    isSign: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo",
            },
            jar,
            url: `https://atp.bol.wo.cn/atpapi/act/actUserSign/isOrSign?actId=1516`,
            method: 'get'
        })
        if (data.code === '0000' && data.data === true) {
            return true
        } else {
            return false
        }
    },
    signState: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo",
            },
            jar,
            url: `https://atp.bol.wo.cn/atpapi/act/actUserSign/data?actId=1516`,
            method: 'get'
        })
        if (data.code === '0000') {
            return data.data
        } else {
            console.error(data.message)
            return {}
        }
    },
    lotteryNum: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo",
            },
            jar,
            url: `https://atp.bol.wo.cn/atpapi/act/record/residueCount?actId=517`,
            method: 'get'
        })
        if (data.code === '0000') {
            return data.data
        } else {
            console.error(data.message)
            return 0
        }
    },
    lottery: async (axios, options) => {
        const { searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://atp.bol.wo.cn/atpsign/ACT202012221038331042965g65tNa?product=hfgo",
            },
            jar,
            url: `https://atp.bol.wo.cn/atpapi/act/lottery/start/v1/actPath/ACT202009101956022770009xRb2UQ/0`,
            method: 'get'
        })
        if (data.code === '0000') {
            console.info('抽奖完成')
            if ('prizeName' in data.data && data.data.prizeName) {
                console.info('获得', data.data.prizeName)
                console.reward('话费购-' + data.data.prizeName)
            } else {
                console.info('未获得奖品')
            }
        } else {
            console.error(data.message)
        }
    },
    doTask: async (axios, options) => {
        let { jar, searchParams } = await hfgo.openPlatLine(axios, options)
        let { jar: jar1 } = await hfgo.login(axios, {
            ...options,
            searchParams,
            jar
        })
        let token = jar1.toJSON().cookies.find(i => i.key == 'token')
        token = token.value
        let { jar: jar2 } = await hfgo.toSignPage(axios, {
            ...options,
            jar: jar1,
            token
        })
        let isS = await hfgo.isSign(axios, {
            ...options,
            jar: jar2
        })
        if (!isS) {
            console.info('还未签到')
            await hfgo.actUserSign(axios, {
                ...options,
                jar: jar2
            })
        } else {
            console.error('已经签到过')
        }

        let state = await hfgo.signState(axios, {
            ...options,
            jar: jar2
        })
        if ('signCount' in state) {
            console.info('已连续签到', state.signCount, '天')
            if (state.signCount == 3) {
                console.log("获得3次抽奖机会")
            } else if (state.signCount == 7) {
                console.info('获得', '5元优惠券')
                console.reward('话费购-' + '5元优惠券')
            }
        }

        console.info('开始抽奖')
        let num = await hfgo.lotteryNum(axios, {
            ...options,
            jar: jar2
        })
        console.info('剩余', num, '次抽奖机会')
        while (num > 0) {
            console.info('第', num, '次')
            await hfgo.lottery(axios, {
                ...options,
                jar: jar2
            })
            num--
        }
    }
}

module.exports = hfgo