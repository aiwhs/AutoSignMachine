const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};
var lanternFestival = {
    signIn: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/superFriday/",
                "origin": "https://img.client.10010.com"
            },
            url: 'https://m.client.10010.com/super-five-cards/lanternFestival/doTask/v1',
            method: 'post',
            data: transParams({
                params: '{"from":"955000006","taskId":"1"}'
            })
        })
        if (data.code === '0') {
            console.info('签到成功', data.msg)
        } else {
            console.error('签到失败', data.msg)
        }
    },
    doMovieSignin: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/superFriday/",
                "origin": "https://img.client.10010.com"
            },
            url: 'https://m.client.10010.com/super-five-cards/lanternFestival/doTask/v1',
            method: 'post',
            data: transParams({
                params: '{"from":"955000006","taskId":"2"}'
            })
        })
        if (data.code === '0') {
            console.info('签到电影成功', data.msg)
        } else {
            console.error('签到电影失败', data.msg)
        }
    },
    dolLuckyPrize: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/superFriday/",
                "origin": "https://img.client.10010.com"
            },
            url: 'https://m.client.10010.com/super-five-cards/lanternFestival/luckyPrize/v1',
            method: 'post',
            data: transParams({
                params: '{"from":"955000006"}'
            })
        })
        if (data.code === '0') {
            console.info('抽奖成功', data.resdata ? data.resdata.prizeName : '无奖品')
            if (data.resdata && data.resdata.prizeName) {
                console.reward(data.resdata.prizeName)
            }
        } else {
            console.error('抽奖失败', data.msg)
        }
    },
    doTask: async (axios, options) => {
        console.info('开始签到及抽奖')
        await lanternFestival.dolLuckyPrize(axios, options)
        
        await lanternFestival.signIn(axios, options)
        await lanternFestival.dolLuckyPrize(axios, options)

        await lanternFestival.doMovieSignin(axios, options)
        await lanternFestival.dolLuckyPrize(axios, options)
        console.info('签到抽奖结束')
    }
}
module.exports = lanternFestival