
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { default: PQueue } = require('p-queue');

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

var Niujie = {
    // 转盘抽奖3次-1000牛气抽1次
    CalfLottery: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let n = 3
        do {
            console.info('第', n, '次')
            let { data } = await axios.request({
                headers: {
                    "user-agent": useragent,
                    "referer": "https://img.client.10010.com/2021springfestival/index.html",
                    "origin": "https://img.client.10010.com"
                },
                url: `https://m.client.10010.com/Niujie/calf/CalfLottery`,
                method: 'POST'
            })

            if (data.resplotterycode === '0000') {
                console.info('获得', data.respname)
            } else {
                console.info(data.message)
            }

            await new Promise((resolve, reject) => setTimeout(resolve, 2500))
        } while (--n)
    },
    // 牛气如意-秒杀抢兑
    spikePrize: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let prizes = [
            {
                name: 'vivos7',
                prizeId: '21013015030315978'
            },
            {
                name: '8折充值券',
                prizeId: '21013123452511221'
            },
            {
                name: '10G流量日包',
                prizeId: '21013015071318307'
            },
            {
                name: '腾讯视频会员',
                prizeId: '21012919443117040'
            }
        ]
        for (let prize of prizes) {
            console.info('尝试抢兑', prize.name)
            let { data } = await axios.request({
                headers: {
                    "user-agent": useragent,
                    "referer": "https://img.client.10010.com/2021springfestival/index.html",
                    "origin": "https://img.client.10010.com"
                },
                url: `https://m.client.10010.com/Niujie/imazamox/spikePrize`,
                method: 'POST',
                data: transParams({
                    'prizeId': prize.prizeId
                })
            })
            console.info(data.msg)
        }

    },
    getTaskList: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        console.info('获取牛气任务中')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/2021springfestival/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/Niujie/task/getTaskList`,
            method: 'POST'
        })
        return data.data
    },
    doNiuqiTask: async (axios, options) => {
        const { task } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        console.info('完成牛气任务中')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/2021springfestival/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/Niujie/task/doTask`,
            method: 'POST',
            data: transParams({
                'taskId': task.taskId
            })
        })
        await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/2021springfestival/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: task.taskUrl,
            method: 'get'
        })
        if (data.resplotterycode === '0000') {
            console.info('获得', data.respname)
        } else {
            console.info(data.msg)
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 500))
    },
    doNiuqiTasks: async (axios, options) => {
        let tasklist = await Niujie.getTaskList(axios, options)
        tasklist = tasklist.filter(t => t.taskStatus === '1')
        if (!tasklist.length) {
            console.info('每天领取牛气任务已完成，跳过')
        }
        for (let task of tasklist) {
            console.info('去完成', task.taskName)
            await Niujie.doNiuqiTask(axios, {
                ...options,
                task
            })
        }
    },
    doTask: async (axios, options) => {
        await Niujie.doNiuqiTasks(axios, options)
        await Niujie.CalfLottery(axios, options)
    },
    getPrizeListd: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')

        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/2021springfestival/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: 'https://m.client.10010.com/Niujie/imazamox/getPrizeListd',
            method: 'post',
            data: transParams({
                'type': 1
            })
        })
        return data.data.productList.filter(p => p.convertStatus == '1')
    },
    convertPrize: async (axios, options) => {
        console.info('开始尝试兑换奖品')
        const useragent = buildUnicomUserAgent(options, 'p')
        let getPrizeListd = await Niujie.getPrizeListd(axios, options)

        let queue = new PQueue({ concurrency: 2 });

        for (let p of getPrizeListd) {
            queue.add(async () => {
                let n = 3
                while (n > 0) {
                    let { data } = await axios.request({
                        headers: {
                            "user-agent": useragent,
                            "referer": "https://img.client.10010.com/2021springfestival/index.html",
                            "origin": "https://img.client.10010.com"
                        },
                        url: 'https://m.client.10010.com/Niujie/imazamox/convertPrize',
                        method: 'post',
                        data: transParams({
                            'prizeId': p.product_id,
                            'phone': options.user
                        })
                    })
                    if (data.status !== '0000') {
                        console.info(data.msg)
                        break
                    } else {
                        console.reward(p.product_name)
                        console.info(p.product_name)
                    }
                    --n
                }
            })
        }
        await queue.onIdle()
    },
    receiveCalf: async (axios, options) => {
        console.info('开始领取牛气值')
        const useragent = buildUnicomUserAgent(options, 'p')
        await axios.request({
            headers: {
                "user-agent": useragent,
                "origin": "https://img.client.10010.com"
            },
            url: 'https://img.client.10010.com/2021springfestival/index.html',
            method: 'get'
        })
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/2021springfestival/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: 'https://m.client.10010.com/Niujie/calf/receiveallCalf',
            method: 'get'
        })
        console.info('本轮牛气值领取完毕', data.message)
    },
    // 积分馆 翻签抽奖
    newYearLottery: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        console.info('积分馆翻签抽奖')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com/jifenguan2021cj/index.html",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/welfare-mall-front/mobile/newYearActivity/newYearLottery/v1`,
            method: 'POST'
        })
        if (data.code === '0000') {
            if (data.resdata) {
                console.reward(data.resdata.prizeName)
                console.info('获得', data.resdata.prizeName)
            } else {
                console.info('未获得奖励')
            }
        } else {
            console.info(data.msg)
        }
    },
}

module.exports = Niujie