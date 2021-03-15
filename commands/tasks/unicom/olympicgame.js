
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

var olympicgame = {
    getHome: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        await axios.request({
            headers: {
                "user-agent": useragent,
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html"
            },
            url: `https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/index.html`,
            method: 'get',
            params: {
                'yw_code': '',
                'desmobile': options.user,
                'version': appInfo.unicom_version
            }
        })

        await axios.request({
            headers: {
                "user-agent": useragent,
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/index.html"
            },
            url: `https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html`,
            method: 'get',
            params: {
                'yw_code': '',
                'desmobile': options.user,
                'version': appInfo.unicom_version
            }
        })
    },
    getInfo: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Origin": "https://img.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html"
            },
            url: `https://m.client.10010.com/olympicgame/winterolympicgame/getInfo`,
            method: 'POST'
        })
        console.info(data.msg)
        return data
    },
    beginGame: async (axios, options) => {
        const { usernumber } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Origin": "https://img.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html"
            },
            url: `https://m.client.10010.com/olympicgame/winterolympicgame/beginGame`,
            method: 'POST',
            data: transParams({
                usernumber: usernumber
            })
        })
        console.info('开始游戏', data.msg)
        if (data.state !== '0000') {
            return false
        } else {
            return true
        }
    },
    addEnergy: async (axios, options) => {
        const { usernumber } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Origin": "https://img.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html"
            },
            url: `https://m.client.10010.com/olympicgame/winterolympicgame/addEnergy`,
            method: 'POST',
            data: transParams({
                usernumber: usernumber,
                energy: '100'
            })
        })
        console.info('增加能量值', data.msg)
    },
    lottery: async (axios, options) => {
        const { usernumber } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "Origin": "https://img.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui",
                "referer": "https://img.client.10010.com/duoaozhuanqu/dongaozhuanquPro/game.html"
            },
            url: `https://m.client.10010.com/olympicgame/winterolympicgame/lottery`,
            method: 'POST',
            data: transParams({
                usernumber: usernumber
            })
        })
        console.info('刮奖', data.msg)
    },
    doTask: async (axios, options) => {
        await olympicgame.getHome(axios, options)
        let game = await olympicgame.getInfo(axios, options)
        let n = game.gametimes
        let usernumber = game.usernumber

        while (n > 0) {
            let flag = await olympicgame.beginGame(axios, {
                ...options,
                usernumber
            })
            if (flag) {

                await olympicgame.addEnergy(axios, {
                    ...options,
                    usernumber
                })

                await olympicgame.lottery(axios, {
                    ...options,
                    usernumber
                })

            } else {
                console.error('开始游戏失败')
            }
            --n
        }
    }
}

module.exports = olympicgame