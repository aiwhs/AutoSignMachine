const { encryptParamsV1, encryptParamsV2, signRewardVideoParams, decryptParamsV1, decryptParamsV2 } = require('./CryptoUtil')
const crypto = require('crypto');
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')

// 积分乐园-集牛卡

var newYearUserSign = {
    openPlatLine: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let searchParams = {}
        let result = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/jifenguan2021cj/index.html`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLineNew.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/nhjyxdj`,
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
    loginNewYear: async (axios, options) => {
        const { jfid, searchParams, jar } = options
        const useragent = buildUnicomUserAgent(options, 'p')

        let params = {
            activityId: "Ac-10010",
            userCookie: jfid,
            userNumber: searchParams.userNumber,
            time: new Date().getTime()
        };

        let encrypted_params = encryptParamsV1(params)
        let res = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-game/index.html?from=nyear",
                "origin": "https://img.jf.10010.com",
                "Content-Type": "application/json"
            },
            jar,
            url: `https://m.jf.10010.com/jf-yuech/p/loginNewYear`,
            method: 'post',
            data: encrypted_params
        }).catch(err => console.error(err))

        result = res.data
        if (result.code !== 0) {
            throw new Error(result.message)
        }

        return result.data
    },
    donNwYearUserSign: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        const {
            token: {
                access_token: Authorization
            }
        } = options
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Authorization": `Bearer ${Authorization}`,
                "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-game/index.html?from=nyear",
                "origin": "https://m.jf.10010.com"
            },
            url: 'https://m.jf.10010.com/jf-yuech/api/gameResultV2/newYearUserSign?activityId=Ac-3e2a9ffe24884420beab373eea776166&sharePhone=null',
            method: 'get'
        })
        if (data.code !== 0) {
            console.info(data.message)
        } else {
            if (data.data.signInfoPO.cardList.length) {
                data.data.signInfoPO.cardList.forEach(c => {
                    console.info('获得卡片', c.name)
                })
            } else {
                console.info('暂未获得卡片')
            }
        }
    },
    doTask: async (axios, options) => {
        let plat = await newYearUserSign.openPlatLine(axios, options)
        let { token, signInfoPO } = await newYearUserSign.loginNewYear(axios, {
            ...options,
            ...plat
        })
        await newYearUserSign.donNwYearUserSign(axios, {
            options,
            token
        })
    }
}

module.exports = newYearUserSign