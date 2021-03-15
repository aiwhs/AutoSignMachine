var dailyBookVideo = {
  doTask: async (request, options) => {
    await require('./rewardVideo').doTask(request, {
      ...options,
      acid: 'AC20200521222721',
      taskId: '5a6dd5106495402d9dcc5e801f3171b3',
      reward_name: '章节视频得积分',
      arguments7: 'woyuedu',
      arguments8: 'a123456'
    })
  }
}

module.exports = dailyBookVideo