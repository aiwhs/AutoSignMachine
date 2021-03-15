const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var moment = require('moment');
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

// 我的钱包-沃钱包-钱包福利幸运大抽奖 
var dailystw = {
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
        let { jar, jfid, searchParams } = await dailystw.openPlatLine(axios, options)
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
            url: `http://stw.yb.zhenyouweb.com/?unionSessionId=${unionSessionId}&position=STWDQB001`,
            method: 'get'
        })
        return {
            jar: config.jar
        }
    },
    turntablePageluckyDraw: async (axios, options) => {
        const { jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://stw.yb.zhenyouweb.com/index`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `http://stw.yb.zhenyouweb.com/api/167368`,
            method: 'get'
        })
        console.info(data)
        if (data.status === 1) {
            if (data.is_winning) {
                console.log('主要获得的是优惠券！！')
                console.reward(data.prize.introduction)
            } else {
                console.log(data.info, data.prize.name)
            }
        } else {
            console.error('抽奖失败', data.errortips)
        }

        return {
            can_num: data.can_num
        }
    },
    doTask: async (axios, options) => {
        let auth = await dailystw.epayauth(axios, options)
        let { jar } = await dailystw.toTurntablePage(axios, {
            ...options,
            unionSessionId: auth.unionSessionId
        })
        let can_num = 3
        while (can_num > 0) {
            console.log('第', can_num, '次游戏机会')
            let data = await dailystw.turntablePageluckyDraw(axios, {
                ...options,
                jar
            })
            can_num = data.can_num
            console.info('等待2秒再继续')
            await new Promise((resolve, reject) => setTimeout(resolve, 2 * 1000))
        }
    }
}

module.exports = dailystw