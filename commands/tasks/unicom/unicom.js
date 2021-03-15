const { scheduler } = require('../../../utils/scheduler')
const { getCookies, saveCookies } = require('../../../utils/util')
const _request = require('../../../utils/request')

var start = async (params) => {
  const { cookies, options } = params

  let init = async (request, savedCookies) => {
    await require('./init')(request, {
      ...params,
      cookies: savedCookies || cookies
    })
    return {
      request
    }
  }
  let taskOption = {
    init
  }

  // 每日签到积分
  await scheduler.regTask('dailysignin', async (request) => {
    await require('./dailysignin').doTask(request, options)
    await require('./integral').addFlow(request, options)
  }, taskOption)

  // 冬奥积分活动 20201231
  await scheduler.regTask('winterTwo', async (request) => {
    await require('./integral').winterTwoGetIntegral(request, options)
    await require('./integral').winterTwoStatus(request, options)
  }, taskOption)

  // 每日定向积分 20201231
  await scheduler.regTask('dxIntegralEveryDay', async (request) => {
    await require('./integral').dxIntegralEveryDay(request, options)
  }, taskOption)

  // 每日游戏楼层宝箱
  await scheduler.regTask('dailygamebox', async (request) => {
    await require('./integral').gamebox(request, options)
  }, taskOption)

  // 首页-积分商城-定向积分专区-每日抽奖(1次免费及5次花费定向积分抽奖)
  await scheduler.regTask('dailylotteryintegral', async (request) => {
    await require('./dailyShop').dailyintegrallottery(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-沃之树
  await scheduler.regTask('dailywoTree', async (request) => {
    await require('./woTree').doTask(request, options)
  }, taskOption)

  await scheduler.regTask('dailyBookRead', async (request) => {
    // 首页-小说-阅读越有礼打卡赢话费
    await require('./dailyBookRead').doTask(request, options)
    await require('./dailyVideoBook').doTask(request, options)
  }, taskOption)

  // 首页-小说-会员日活动-签到抽大奖
  await scheduler.regTask('dailyBookMemberDay', async (request) => {
    await require('./dailyBookRead').dovideoIntegralTask(request, options)
    await require('./dailyBookRead').doMemberDaySign(request, options)
  }, taskOption)

  // 首页-小说-阅读现金红包雨-看视频得积分
  await scheduler.regTask('dailyRedbagRainVideoIntegral', async (request) => {
    // 看视频得积分
    await require('./dailyRedbagRain').dovideoIntegralTask(request, options)
  }, taskOption)

  // 首页-小说-阅读现金红包雨
  // 活动已下线
  // await scheduler.regTask('dailyRedbagRain', async (request) => {
  //   // 看视频得积分
  //   await require('./dailyRedbagRain').getRedBag(request, options)
  // }, {
  //   ...taskOption,
  //   startTime: 20 * 3600 - 10 * 55,
  //   ignoreRelay: true
  // })

  // 首页-小说-读满10章赢好礼
  await scheduler.regTask('dailyBookRead10doDraw', async (request) => {
    // 首页-小说-读满10章赢好礼
    await require('./dailyVideoBook').read10doDraw(request, options)
    // 首页-签到有礼-免流量得福利-3积分天天拿(阅读打卡) 已下线
    // await require('./dailyVideoBook').giftBoints(request, options)
  }, taskOption)

  // 首页-小说-章节详情-看视频领积分
  await scheduler.regTask('dailyBookVideo', async (request) => {
    // 首页-小说-读满10章赢好礼-看视频领2积分
    await require('./dailyVideoBook').dovideoIntegralTask(request, options)
    // 首页-小说-章节详情-看视频领积分
    await require('./dailyBookVideo').doTask(request, options)
  }, taskOption)

  await scheduler.regTask('dailyBookLuckdraw', async (request) => {
    // 首页-小说-阅读福利抽大奖
    await require('./dailyBookLuckdraw').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费领-1G流量日包
  await scheduler.regTask('daily1GFlowTask', async (request) => {
    await require('./daily1GFlowTask').doTask(request, options)
  }, {
    ...taskOption,
    startTime: 20 * 3600,
    ignoreRelay: true
  })

  // 首页-签到有礼-免费领-浏览领积分
  await scheduler.regTask('dailyLiuLan', async (request) => {
    await require('./dailyTTliulan').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费领-领免费霸王餐
  await scheduler.regTask('dailyScratchCard', async (request) => {
    await require('./dailyScratchCard').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费拿-看视频夺宝
  // 易出现本次操作需要进行验证，暂时注释
  // await scheduler.regTask('dailyVideoFreeGoods', async (request) => {
  //   await require('./dailyVideoFreeGoods').doTask(request, options)
  // }, {
  //   isCircle: true,
  //   startTime: 10 * 3600,
  //   intervalTime: 4 * 3600
  // })

  // 首页-签到有礼-免费抽-赢vivo x60
  await scheduler.regTask('dailyNcow', async (request) => {
    await require('./dailyNcow').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿红米笔记本-接元宝
  await scheduler.regTask('dailyIngots', async (request) => {
    await require('./dailyIngots').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-抓OPPO手机
  await scheduler.regTask('dailyGrabdollPage', async (request) => {
    await require('./dailyGrabdollPage').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿666积分-豪礼大派送抽奖
  await scheduler.regTask('jflottery', async (request) => {
    await require('./jflottery').timesDraw(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿苹果iPad Pro(摇一摇)
  await scheduler.regTask('dailyYYY', async (request) => {
    await require('./dailyYYY').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-华为mate40pro(刮刮乐)
  await scheduler.regTask('dailyVideoScratchcard', async (request) => {
    await require('./dailyVideoScratchcard').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-赢三星Galaxy Z(试试手气)
  // 活动已下线
  // await scheduler.regTask('dailyCheapStorePage', async (request) => {
  //   await require('./dailyCheapStorePage').doTask(request, options)
  // }, {
  //   isCircle: true,
  //   intervalTime: 4 * 3600,
  //   ...taskOption
  // })

  // 首页-签到有礼-免费抽-拆华为Pad(去抽奖)
  await scheduler.regTask('dailyLKMH', async (request) => {
    await require('./dailyLKMH').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿iPhone12(摇一摇)
  await scheduler.regTask('dailyYYQ', async (request) => {
    await require('./dailyYYQ').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-赢Apple Watch(去抽奖)
  // 游戏已下线
  // await scheduler.regTask('dailyTurntablePage', async (request) => {
  //   await require('./dailyTurntablePage').doTask(request, options)
  // }, taskOption)

  // 首页-签到有礼-赚更多福利-看视频奖励5积分
  await scheduler.regTask('dailyVideo', async (request) => {
    await require('./dailyVideo').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-赚更多福利-天天抽好礼
  await scheduler.regTask('dailylottery', async (request) => {
    await require('./dailylottery').doTask(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-每日打卡
  await scheduler.regTask('producGameSignin', async (request) => {
    await require('./producGame').gameBox(request, options)
    await require('./producGame').gameSignin(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-天天领取3G流量包
  await scheduler.regTask('dailygameflow', async (request) => {
    await require('./producGame').doGameFlowTask(request, options)
  }, taskOption)

  // 首页-积分查询-游戏任务
  await scheduler.regTask('dailygameIntegral', async (request) => {
    await require('./producGame').doGameIntegralTask(request, options)
  }, taskOption)

  // 首页-知识-限时免费（连续7天阶梯激励）
  await scheduler.regTask('dailyCourse', async (request) => {
    await require('./dailyCourse').doTask(request, options)
  }, {
    ...taskOption,
    startTime: 9 * 3600
  })

  // await require('./integral').getflDetail(request, options)
  // await require('./integral').getTxDetail(request, options)
  // await require('./integral').getDxDetail(request, options)
  // await require('./integral').getCoins(request, options)

  // 每日评论积分
  await scheduler.regTask('dailycomment', async (request) => {
    await require('./commentSystem').commentTask(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-每日打卡-完成今日任务(200m)
  await scheduler.regTask('todayDailyTask', async (request) => {
    await require('./producGame').gameBox(request, options)
    await require('./producGame').doTodayDailyTask(request, options)
  }, {
    ...taskOption,
    startTime: 22 * 3600
  })

  // 首页-签到有礼-居家娱乐馆
  // 活动已下线
  // await scheduler.regTask('gameYearBox', async (request) => {
  //   await require('./gameYearBox').doTask(request, options)
  // }, {
  //   ...taskOption,
  //   startTime: 18 * 3600
  // })

  // // 首页-牛气-秒杀抢兑
  // await scheduler.regTask('NiujieSpikePrize', async (request) => {
  //   await require('./Niujie').spikePrize(request, options)
  // }, {
  //   ...taskOption,
  //   startTime: 9.6 * 3600,
  //   ignoreRelay: true
  // })

  // 首页-牛气-转盘抽奖
  // await scheduler.regTask('NiujieTask', async (request) => {
  //   await require('./Niujie').doTask(request, options)
  // }, taskOption)

  // // 首页-牛气-积分馆-翻签抽奖
  // await scheduler.regTask('newYearLottery', async (request) => {
  //   await require('./Niujie').newYearLottery(request, options)
  // }, taskOption)

  // // 首页-牛气-场馆领牛气
  // await scheduler.regTask('NiujieReceiveCalf', async (request) => {
  //   await require('./Niujie').receiveCalf(request, options)
  // }, {
  //   isCircle: true,
  //   intervalTime: 50 * 60,
  //   startTime: 0,
  //   ...taskOption
  // })

  // // 首页-牛气-兑换奖品
  // await scheduler.regTask('convertPrize', async (request) => {
  //   await require('./Niujie').convertPrize(request, options)
  // }, {
  //   ...taskOption,
  //   startTime: 22 * 3600
  // })

  // 首页-知识-阅读答题赢好礼
  await scheduler.regTask('dailyBookAnswer', async (request) => {
    await require('./dailyBookAnswer').doTask(request, options)
  }, taskOption)

  // 首页-积分乐园-集牛卡
  await scheduler.regTask('newYearUserSign', async (request) => {
    await require('./newYearUserSign').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费拿-猜拳拿奖
  await scheduler.regTask('dailyFingerSign', async (request) => {
    await require('./dailyFingerSign').doTask(request, options)
  }, taskOption)

  // 首页-积分商城-火热抢购-三只松鼠-看视频得积分
  await scheduler.regTask('dailyShopVideoIntegral', async (request) => {
    await require('./dailyShop').dovideoIntegralTask(request, options)
  }, taskOption)

  // 服务-办理-套餐变更-赚积分
  await scheduler.regTask('dailyPackageIntegral', async (request) => {
    await require('./dailyOtherRewardVideo').doPackeageChangeVideoIntegralTask(request, options)
  }, taskOption)

  // 服务-查询-电子发票-赚积分
  await scheduler.regTask('dailyWisdomActivityIntegral', async (request) => {
    await require('./dailyOtherRewardVideo').doWisdomActivityIntegralTask(request, options)
  }, taskOption)

  // 福利社-聚人气-看视频得积分
  // await scheduler.regTask('doWelfareActivityIntegralTask', async (request) => {
  //   await require('./dailyOtherRewardVideo').doWelfareActivityIntegralTask(request, options)
  // }, taskOption)

  // 首页-签到有礼-免费领-饿了么红包
  await scheduler.regTask('dailyUnicomTask', async (request) => {
    await require('./dailyUnicomTask').doIntegralAd(request, options)
    await require('./dailyUnicomTask').doTurnCard(request, options)
  }, taskOption)

  // 冬奥专区-赢冬奥纪念品-玩游戏抽奖
  await scheduler.regTask('olympicgame', async (request) => {
    await require('./olympicgame').doTask(request, options)
  }, taskOption)


  // 我的钱包-沃钱包-幸运抽大奖
  await scheduler.regTask('dailystw', async (request) => {
    await require('./dailystw').doTask(request, options)
  }, taskOption)


  // 沃钱包-联通支付日-转盘抽奖
  await scheduler.regTask('PayDayParty', async (request) => {
    await require('./PayDayParty').doTask(request, options)
  }, taskOption)


  // 冬奥-冰雪俱乐部-联通客户日-幸运九宫格
  await scheduler.regTask('dailyClubLottery', async (request) => {
    await require('./dailyClubLottery').doTask(request, options)
  }, taskOption)

  // 积分商城-疯踩小橙（沃耀联通小游戏）
  await scheduler.regTask('woyaoliantong', async (request) => {
    await require('./woyaoliantong').doTask(request, options)
  }, taskOption)

  // 超级星期五-元宵喜乐会
  // 活动下线
  // await scheduler.regTask('lanternFestival', async (request) => {
  //   await require('./lanternFestival').doTask(request, options)
  // }, taskOption)

  // 话费购签到
  await scheduler.regTask('hfgo', async (request) => {
    await require('./hfgo').doTask(request, options)
  }, taskOption)

  // 首页-签到-APP下载领积分
  await scheduler.regTask('dailyDownloadApp', async (request) => {
    await require('./dailyDownloadApp').doTask(request, options)
  }, {
    ...taskOption,
    startTime: 13 * 3600,
  })

  // 清理领取某些未知方式的积分
  // 该处理可能会导致某些活动任务机会不足导致错误，所以执行时间要迟
  await scheduler.regTask('dailyOtherRewardVideo', async (request) => {
    await require('./dailyOtherRewardVideo').cleanRewardVideo(request, options)
  }, {
    ...taskOption,
    startTime: 21.5 * 3600,
    ignoreRelay: true
  })

  // 每日0点自动兑换流量
//  await scheduler.regTask('exchangeDFlow', async (request) => {
//    await require('./exchangeDFlow').doTask(request, options)
//  }, {
//    ...taskOption,
//    startTime: 0,
//    startHours: 0,
//    ignoreRelay: true
//  })

  // 定时检测流量兑换
  // 可使用 --exchangeDFlowCircle-intervalTime 1800 选项指定流量检查间隔时间，单位秒
  // 可使用 --exchangeDFlowCircle-minFlow 200 选项指定流量检查最小值
  // 可使用 --exchangeDFlowCircle-productId 21010621565413402 选项指定兑换流量包ID
//  let { 'exchangeDFlowCircle-intervalTime': intervalTime = 1800 } = options
//  if (typeof intervalTime !== 'number') {
//    intervalTime = 1800
//  }
//  await scheduler.regTask('exchangeDFlowCircle', async (request) => {
//    await require('./exchangeDFlow').doCircleCheck(request, options)
//  }, {
//    ...taskOption,
//    isCircle: true,
//    intervalTime: intervalTime,
//    startTime: 5 * 60,
//    ignoreRelay: true
//  })

  // 每日奖励信息结果推送
  if (!('asm_func' in process.env) || process.env.asm_func === 'false') {
    await scheduler.regTask('dailyNotifyReward', async (request) => {
      await require('./dailyNotifyReward').doNotify(request, options)
    }, {
      ...taskOption,
      startTime: 22 * 3600,
      ignoreRelay: true
    })
  }

}
module.exports = {
  start
}