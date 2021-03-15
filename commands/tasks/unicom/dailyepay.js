const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var moment = require('moment');
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

// 我的钱包-沃钱包-幸运抽大奖
var dailyepay = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            headers: {
                "user-agent": useragent
            },
            url: `http://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://epay.10010.com/appH5/index.html%23/acchome/index&yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
            method: 'GET',
            transformResponse: (data, headers) => {
                if ('location' in headers) {
                    let uu = new URL(headers.location)
                    let pp = {}
                    for (let p of uu.searchParams) {
                        pp[p[0]] = p[1]
                    }
                    if (!pp.length) {
                        let queryArray = headers.location.split('?')[1].split('&');
                        queryArray.map(query => {
                            let temp = query.split('=')
                            if (temp.length === 1) {
                                pp[temp[0]] = '';
                            } else {
                                pp[temp[0]] = temp[1];
                            }
                        })
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
    epayauth: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { jar, jfid, searchParams } = await dailyepay.openPlatLine(axios, options)
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://epay.10010.com/appH5/index.html`,
                "origin": `https://epay.10010.com`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `https://epay.10010.com/appH5/auth/index.do`,
            method: 'post',
            data: transParams({
                'areaId': '',
                'channel': 3,
                'desmobile': options.user,
                'ticket': searchParams.ticket,
                'timestamp': timestamp,
                'token': '',
                'type': 02,
                'version': appInfo.version,
            })
        })
        if (data.resultCode === '0') {
            return data
        } else {
            console.error('获取登录状态失败')
            return false
        }
    },
    toTurntablePage: async (axios, options) => {
        const { unionSessionId } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "X-Requested-With": appInfo.package_name
            },
            url: `http://shtwo.turntable.cszyweb.cn/?unionSessionId=${unionSessionId}&position=STWDQB001`,
            method: 'get'
        })
        return {
            jar: config.jar
        }
    },
    turntablePageLogin: async (axios, options) => {
        const { unionSessionId, jar, username } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://shtwo.turntable.cszyweb.cn/?unionSessionId=${unionSessionId}&position=STWDQB001`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `http://shtwo.turntable.cszyweb.cn/api/user/login?username=${username}`,
            method: 'get'
        })
        if (data.code === 0) {
            console.info('获取登录状态成功')
            return data.data
        } else {
            console.error('获取登录状态失败')
            return false
        }
    },
    turntablePageDetail: async (axios, options) => {
        const { username, unionSessionId, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://shtwo.turntable.cszyweb.cn/?unionSessionId=${unionSessionId}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `http://shtwo.turntable.cszyweb.cn/api/turntable/detail?username=${username}`,
            method: 'get'
        })
        if (data.code === 0) {
            console.info('获取用户信息成功')
            return data.data
        } else {
            console.error('获取用户信息失败')
            return false
        }
    },
    turntablePageluckyDraw: async (axios, options) => {
        const { username, unionSessionId, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://shtwo.turntable.cszyweb.cn/?unionSessionId=${unionSessionId}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `http://shtwo.turntable.cszyweb.cn/api/turntable/luckyDraw?username=${username}`,
            method: 'get'
        })
        if (data.code === 0) {
            if (data.is_prize) {
                console.reward(data.data.introduction)
            } else {
                console.log(data.msg, data.data.introduction)
            }
        } else {
            console.error('抽奖失败', data.msg)
        }
    },
    doTask: async (axios, options) => {
        let auth = await dailyepay.epayauth(axios, options)
        let { jar } = await dailyepay.toTurntablePage(axios, {
            ...options,
            unionSessionId: auth.unionSessionId
        })
        let login = await dailyepay.turntablePageLogin(axios, {
            ...options,
            jar,
            username: '' // TODO 未知生成来源
        })
        let userinfo = await dailyepay.turntablePageDetail(axios, {
            ...options,
            jar,
            username: login.username,
            unionSessionId: auth.unionSessionId
        })
        let n = userinfo.available_count
        if (n <= 0) {
            console.info('无游戏次数')
            return
        }
        console.log('剩余', n, '次游戏机会')
        while (n > 0) {
            console.log('第', n, '次游戏机会')
            await dailyepay.turntablePageluckyDraw(axios, {
                ...options,
                jar,
                username: login.username,
                unionSessionId: auth.unionSessionId
            })
            console.info('等待2秒再继续')
            await new Promise((resolve, reject) => setTimeout(resolve, 2 * 1000))
            --n
        }
    }
}

module.exports = dailyepay