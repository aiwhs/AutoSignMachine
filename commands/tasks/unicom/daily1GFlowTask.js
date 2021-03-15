
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var daily1GFlowTask = {
    getTaskInfo: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/SigininApp/index.html`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://act.10010.com/SigninApp/doTask/getTaskInfo`,
            method: 'post'
        })
        if (data.status === '0000') {
            return {
                tasks: data.data.taskList.filter(t => t.status === '1'),
                jar: config.jar
            }
        } else {
            return {
                tasks: [],
                jar: config.jar
            }
        }
    },
    finishVideo: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/SigininApp/index.html`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://act.10010.com/SigninApp/doTask/finishVideo`,
            method: 'post'
        })
        if (data.status === '0000') {
            console.info('看视频成功')
            return true
        } else {
            console.error('看视频失败')
            return false
        }
    },
    getPrize: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data, config } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/SigininApp/index.html`,
                "origin": "https://img.client.10010.com"
            },
            url: `https://act.10010.com/SigninApp/doTask/getPrize`,
            method: 'post'
        })
        if (data.status === '0000') {
            if (data.data.state === '0') {
                console.reward('1GB流量日包')
            }
            console.info(data.data.returnStr)
        } else {
            console.error('领取失败', data.msg)
        }
    },
    doTask: async (axios, options) => {
        let { tasks: undoTasks, jar } = await daily1GFlowTask.getTaskInfo(axios, options)
        if (undoTasks.length > 0) {
            console.info('存在未完成的任务', undoTasks.length)
            if (undoTasks.find(t => t.action == 'LOCAL_DOTASK_WATCH_VIDEO')) {
                console.info('尝试完成看视频条件')
                await require('./rewardVideo').doRewardNoQuery(axios, {
                    ...options,
                    acid: '',
                    taskId: '',
                    arguments6: '',
                    arguments7: '',
                    arguments8: '',
                    arguments9: '',
                    codeId: 945796512,
                    reward_name: '签到页做任务得奖励',
                    remark: '签到积分翻倍',
                    jar
                })
                let flag = await daily1GFlowTask.finishVideo(axios, options)
                if (!flag) {
                    throw new Error('在下一轮尝试一次')
                }
            }
            if (undoTasks.length > 1) {
                throw new Error('日常签到任务还未完成')
            }
        }
        await daily1GFlowTask.getPrize(axios, options)
    }
}

module.exports = daily1GFlowTask