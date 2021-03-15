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
var PayDayParty = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            headers: {
                "user-agent": useragent
            },
            url: `http://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://epay.10010.com/partyServer/PayDayParty/mouldIndex.do?activityId=LTZL20210228CJ01&bizFrom=stsy&markerName=mould_PayDayParty&from=activity&channelType=STBN00001&duanlianjieabc=qA8J3&desmobile=${options.user}&yw_code=&version=${appInfo.unicom_version}`,
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
    changeTicket: async (axios, options) => {
        const { jar, searchParams } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://epay.10010.com/partyServer/PayDayParty/mouldIndex.do?activityId=LTZL20210228CJ01&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&desmobile=${options.user}&from=activity&bizFrom=stsy&channelType=STBN00001&duanlianjieabc=qA8J3&yw_code=&markerName=mould_PayDayParty&userNumber=${options.user}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `https://epay.10010.com/partyServer/PayDayParty/changeTicket.do`,
            method: 'post',
            data: transParams({
                'activityId': 'LTZL20210228CJ01',
                'bizFrom': 'stsy',
                'ticket': searchParams.ticket,
                'channelType': 'STBN00001'
            })
        })
        // {"returnCode":"0","wap_sessionid":"0e5a9b66f80c4461b6e02b8a825f003b","loginId":"17585920865","returnMsg":"登入成功","unionSessionId":"2ecbc4131d2c5bdffb24c333c3a67ce1"}
        if (data.returnCode === '0') {
            console.info('获取登录信息成功')
            return data
        } else {
            console.error('获取登录信息失败')
            return false
        }
    },
    timeRemains: async (axios, options) => {
        const { jar, wap_sessionid, searchParams } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://epay.10010.com/partyServer/PayDayParty/mouldIndex.do?activityId=LTZL20210228CJ01&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&desmobile=${options.user}&from=activity&bizFrom=stsy&channelType=STBN00001&duanlianjieabc=qA8J3&yw_code=&markerName=mould_PayDayParty&userNumber=${options.user}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `https://epay.10010.com/partyServer/PayDayParty/timeRemains.do`,
            method: 'post',
            data: transParams({
                'loginId': options.user,
                'activityId': 'LTZL20210228CJ01',
                'wap_sessionID': wap_sessionid,
                'version': '3.0.0',
                'bizFrom': 'stsy',
                'partyId': 'LTZL20210228CJ01'
            })
        })
        // {"timeRemain":"1","returnCode":"0","returnMsg":"ok"}
        if (data.returnCode === '0') {
            console.info('获取抽奖次数成功')
            return data
        } else {
            console.error('获取抽奖次数失败')
            return false
        }
    },
    unifyDraw: async (axios, options) => {
        const { jar, wap_sessionid, searchParams, goods } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://epay.10010.com/partyServer/PayDayParty/mouldIndex.do?activityId=LTZL20210228CJ01&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&desmobile=${options.user}&from=activity&bizFrom=stsy&channelType=STBN00001&duanlianjieabc=qA8J3&yw_code=&markerName=mould_PayDayParty&userNumber=${options.user}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `https://epay.10010.com/partyServer/PayDayParty/unifyDraw.do`,
            method: 'post',
            data: transParams({
                'loginId': options.user,
                'wap_sessionID': wap_sessionid,
                'activityId': 'LTZL20210228CJ01',
                'partyId': 'LTZL20210228CJ01',
                'version': '3.0.0',
                'bizFrom': 'stsy'
            })
        })
        console.info('抽奖结束')
        if (data.returnCode === '0') {
            if ('prizeId' in data) {
                let good = goods.find(g => g.prizeId === data.prizeId)
                console.info('获得', good.prizeName)
                console.reward(good.prizeName)
            } else {
                console.info('未获得奖品')
            }
        } else {
            console.error('抽奖失败', data.returnMsg)
        }
    },
    getGoods: async (axios, options) => {
        const { jar, searchParams } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let timestamp = moment().format('YYYYMMDDHHmmss')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://epay.10010.com/partyServer/PayDayParty/mouldIndex.do?activityId=LTZL20210228CJ01&type=02&ticket=${searchParams.ticket}&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&desmobile=${options.user}&from=activity&bizFrom=stsy&channelType=STBN00001&duanlianjieabc=qA8J3&yw_code=&markerName=mould_PayDayParty&userNumber=${options.user}`,
                "X-Requested-With": appInfo.package_name
            },
            jar,
            url: `https://epay.10010.com/partyServer/PayDayParty/getZPInfo.do`,
            method: 'post',
            data: transParams({
                'activityId': 'LTZL20210228CJ01',
                'version': '3.0.0',
                'bizFrom': 'stsy'
            })
        })
        return JSON.parse(data.zpPrizeList)
    },
    doTask: async (axios, options) => {
        if (moment().format('DD') !== '28') {
            console.info('非联通支付日，跳过')
            return
        }
        let { jar, searchParams } = await PayDayParty.openPlatLine(axios, options)
        let { wap_sessionid } = await PayDayParty.changeTicket(axios, {
            ...options,
            jar,
            searchParams
        })
        let times = await PayDayParty.timeRemains(axios, {
            ...options,
            jar,
            searchParams,
            wap_sessionid
        })
        if (!times || parseInt(times.timeRemain) <= 0) {
            console.info('没有游戏次数')
            return
        }
        let goods = await PayDayParty.getGoods(axios, {
            ...options,
            jar,
            searchParams,
            wap_sessionid
        })
        await PayDayParty.unifyDraw(axios, {
            ...options,
            jar,
            goods,
            searchParams,
            wap_sessionid
        })
    }
}

module.exports = PayDayParty