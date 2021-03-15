const fs = require('fs-extra');
var dailyNotifyReward = {
    doNotify: async () => {
        let taskJson = fs.readFileSync(process.env.taskfile).toString('utf-8')
        taskJson = JSON.parse(taskJson)
        if (Object.prototype.toString.call(taskJson.rewards) === '[object Object]') {
            console.notify('今日获得奖品信息统计')
            for (let type in taskJson.rewards) {
                console.notify(`\t`, type, taskJson.rewards[type])
            }
        }
    }
}
module.exports = dailyNotifyReward