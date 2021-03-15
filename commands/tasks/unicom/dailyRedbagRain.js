const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const crypto = require('crypto');
const { RSAUtils } = require('./RSAUtils');
const { signRewardVideoParams } = require('./CryptoUtil')
const moment = require('moment');

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

// 阅读-每晚8点现金红包雨
var dailyRedbagRain = {
    dovideoIntegralTask: async (request, options) => {
        await require('./rewardVideo').doTask(request, {
            ...options,
            acid: 'AC20200521222721',
            taskId: 'c32ef7f06d8e4b5fa3818a5504da2109',
            codeId: 945569148,
            reward_name: '现金红包雨看视频得积分'
        })
    },
    oauthMethod: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/finderInterface/woReadOauth/?typeCode=oauthMethod`,
            method: 'GET'
        })
        return data.data.key
    },
    shouTingLogin: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        //密码加密
        var modulus = "00D9C7EE8B8C599CD75FC2629DBFC18625B677E6BA66E81102CF2D644A5C3550775163095A3AA7ED9091F0152A0B764EF8C301B63097495C7E4EA7CF2795029F61229828221B510AAE9A594CA002BA4F44CA7D1196697AEB833FD95F2FA6A5B9C2C0C44220E1761B4AB1A1520612754E94C55DC097D02C2157A8E8F159232ABC87";
        var exponent = "010001";
        var key = RSAUtils.getKeyPair(exponent, '', modulus);
        let phonenum = RSAUtils.encryptedString(key, options.user);

        let { config: st_config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "X-Requested-With": "XMLHttpRequest"
            },
            url: `http://st.woread.com.cn/touchextenernal/common/shouTingLogin.action`,
            method: 'POST',
            data: transParams({
                phonenum
            })
        })
        let st_jar = st_config.jar
        let cookiesJson = st_jar.toJSON()
        let diwert = cookiesJson.cookies.find(i => i.key == 'diwert')
        let userAccount = cookiesJson.cookies.find(i => i.key == 'useraccount')
        if (!userAccount || !diwert) {
            throw new Error('获取用户信息失败')
        }
        return {
            st_jar,
            phonenum
        }
    },
    isPhoneLogin: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        //密码加密
        var modulus = "00D9C7EE8B8C599CD75FC2629DBFC18625B677E6BA66E81102CF2D644A5C3550775163095A3AA7ED9091F0152A0B764EF8C301B63097495C7E4EA7CF2795029F61229828221B510AAE9A594CA002BA4F44CA7D1196697AEB833FD95F2FA6A5B9C2C0C44220E1761B4AB1A1520612754E94C55DC097D02C2157A8E8F159232ABC87";
        var exponent = "010001";
        var key = RSAUtils.getKeyPair(exponent, '', modulus);
        let phonenum = RSAUtils.encryptedString(key, options.user);

        let { data, config: st_config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "X-Requested-With": "XMLHttpRequest"
            },
            url: `http://st.woread.com.cn/touchextenernal/redbagRain/isPhoneLogin.action`,
            method: 'POST',
            data: transParams({
                phonenum
            })
        })
    },
    getRedBag: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')

        if (moment().isBefore(moment().startOf('days').add('19.5', 'hours'), 'seconds')) {
            throw new Error('还未到时间，跳过')
        }
        let { st_jar, phonenum } = await dailyRedbagRain.shouTingLogin(axios, options)
        await dailyRedbagRain.isPhoneLogin(axios, options)

        let startTime = moment().startOf('days').add('20', 'hours')

        // 等待时间
        do {
            let s = startTime.diff(moment(), 'seconds')
            if (s < 0) {
                break
            }
            if (s > 1 * 3600) {
                console.info('倒计时等待', Math.ceil(s / 3600), '小时')
                await new Promise((resolve, reject) => setTimeout(resolve, 10 * 60 * 1000))
            } else if (s > 2 * 60) {
                console.info('倒计时等待', Math.ceil(s / 60), '分钟')
                await new Promise((resolve, reject) => setTimeout(resolve, 60 * 1000))
            } else if (s <= 10) {
                console.info('倒计时等待', s, '秒')
                await new Promise((resolve, reject) => setTimeout(resolve, 100))
            }
        } while (moment().isBefore(startTime))

        let time = 10
        do {

            let { data } = await axios.request({
                headers: {
                    "user-agent": useragent,
                    "referer": `http://st.woread.com.cn/touchextenernal/redbagRain/index.action?channelid=18000690&yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
                    "origin": "https://st.woread.com.cn",
                },
                jar: st_jar,
                url: `http://st.woread.com.cn/touchextenernal/redbagRain/getRedBag.action?source=42&userAccount=` + phonenum,
                method: 'get'
            })

            if (data.code == "0000") {
                if (data.innercode == "0000") {
                    console.info('获得', data.redPrice + '元')
                } else {
                    console.info(data.message)
                    if (data.message.indexOf('红包已领完') !== -1 || data.message.indexOf('无效的重复请求') !== -1 || data.message.indexOf('不在活动有效期') !== -1) {
                        break
                    }
                }
            } else {
                console.info(data.message)
                if (data.message.indexOf('红包已领完') !== -1 || data.message.indexOf('无效的重复请求') !== -1 || data.message.indexOf('不在活动有效期') !== -1) {
                    break
                }
            }
            let tt = Math.floor(Math.random() * 30) + 20
            console.info('等待', tt, '毫秒')
            await new Promise((resolve, reject) => setTimeout(resolve, tt))

        } while (--time > 0)

        console.info('红包雨结束')
    }
}
module.exports = dailyRedbagRain