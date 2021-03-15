var dailyTTliulan = {
  doTask: async (axios, options) => {
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200814162815',
      taskId: '6c54032f662c4d2bb576872ed408232c',
      codeId: 945535616,
      reward_name: '手厅浏览有礼发积分'
    })
  }
}
module.exports = dailyTTliulan