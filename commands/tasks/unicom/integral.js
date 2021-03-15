var crypto = require('crypto');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')
var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

var integral = {
  getflDetail: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/jifenshangcheng/jifen?loginType=0&scopeType=fl",
          "origin": "https://img.client.10010.com"
        },
        url: `/welfare-mall-front/mobile/show/flDetail/v1/0`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.code !== '0') {
          console.error('查询奖励积分失败', result.msg)
        } else {
          console.info('总奖励积分%s,可用奖励积分%s', result.resdata.score.totalscore, result.resdata.score.availablescore)
        }
        resolve()
      }).catch(reject)
    })
  },
  getTxDetail: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/jifenshangcheng/jifen?loginType=0&scopeType=fl",
          "origin": "https://img.client.10010.com"
        },
        url: `/welfare-mall-front/mobile/show/txDetail/v1/0`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.code !== '0') {
          console.error('查询通信积分失败', result.msg)
        } else {
          console.info('总通信积分%s,可用通信积分%s', result.resdata.score.totalscore, result.resdata.score.availablescore)
        }
        resolve()
      }).catch(reject)
    })
  },
  getDxDetail: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/jifenshangcheng/jifen?loginType=0&scopeType=fl",
          "origin": "https://img.client.10010.com"
        },
        url: `/welfare-mall-front/mobile/newShow/pointsdetails`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.code !== '200') {
          console.error('查询定向积分失败', result.msg)
        } else {
          console.info('总定向积分%s,可用定向积分%s,月到期%s', result.resdata.total, result.resdata.Surplus, result.resdata.expnum)
        }
        resolve()
      }).catch(reject)
    })
  },
  addFlow: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let i = 1
    do {
      // 签到看视频流量
      let { data } = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": "https://act.10010.com/SigninApp/",
          "origin": "https://act.10010.com"
        },
        url: `https://act.10010.com/SigninApp/mySignin/addFlow`,
        method: 'post',
        data: 'stepflag=22'
      })

      if (data.reason === '00') {
        console.reward('flow', data.addNum)
        console.info('获得流量+', data.addNum)
      }

      // 签到下载App奖励
      let { data: datan } = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": "https://act.10010.com/SigninApp/",
          "origin": "https://act.10010.com"
        },
        url: `https://act.10010.com/SigninApp/mySignin/addFlow`,
        method: 'post',
        data: 'stepflag=23'
      })
      if (datan.reason === '00') {
        console.reward('flow', data.addNum)
        console.info('获得流量+', datan.addNum)
      }
      ++i

    } while (i <= 3)
  },
  getCoins: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://act.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://act.10010.com/SigninApp/signinCoinDetails/jumpCoinDetails.do",
          "origin": "https://act.10010.com"
        },
        url: `/SigninApp/signin/getGoldTotal`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.status !== '0000') {
          console.error('查询金币信息失败', result.msg)
        } else {
          console.info('总金币%s', result.data.goldTotal)
        }
        resolve()
      }).catch(reject)
    })
  },
  winterTwoGetIntegral: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')

    let { data: ndata } = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com/",
        "origin": "https://img.client.10010.com"
      },
      url: `https://m.client.10010.com/welfare-mall-front/mobile/winterTwo/getIntegral/v1`,
      method: 'post'
    })

    if (ndata.resdata.code !== '0000') {
      console.error('东奥积分活动领取失败', ndata.resdata.desc)
    } else {
      console.info('东奥积分活动领取成功')
    }
  },
  winterTwoStatus: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/",
          "origin": "https://img.client.10010.com"
        },
        url: `/welfare-mall-front/mobile/winterTwo/winterTwoShop/v1`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.resdata.code !== '0000') {
          console.error('获取东奥积分活动状态失败', result.resdata.desc)
        } else {
          console.info('获取东奥积分活动状态成功 已连续领取%s天', result.resdata.signDays)
        }
        resolve()
      }).catch(reject)
    })
  },

  dxIntegralEveryDay: (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    return new Promise((resolve, reject) => {
      axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/",
          "origin": "https://img.client.10010.com"
        },
        url: `/welfare-mall-front/mobile/integral/gettheintegral/v1`,
        method: 'post'
      }).then(res => {
        let result = res.data
        if (result.code !== '0') {
          console.error('每日定向积分领取失败', result.msg)
        } else {
          console.reward('100定向积分')
          console.info('每日定向积分领取成功')
        }
        resolve()
      }).catch(reject)
    })
  },

  todaySign: async (axios, options) => {
    const useragent = `okhttp/4.4.0`
    let { data } = await axios.request({
      baseURL: 'https://act.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/SigninApp/signin/todaySign`,
      method: 'post'
    })
    if (data.status = '0000') {
      console.info('翻倍签到成功')
    } else {
      console.error('翻倍签到失败')
    }
  },

  gamebox: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let params = {
      'methodType': 'reward',
      'deviceType': 'Android',
      'clientVersion': appInfo.version,
      'isVideo': 'N'
    }
    let { data, config } = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/game_box`,
      method: 'post',
      data: transParams(params)
    })
    if (data) {
      if (data.code !== '0000') {
        console.info(data.desc)
      } else {
        console.info('宝箱领取', data.desc)
        if (data.flag === 'N' && data.data.secondState !== 'Y') {
          await integral.gameboxVideo(axios, {
            ...options,
            jar: config.jar
          })
        }
      }
    } else {
      console.error('宝箱领取失败')
    }
  },
  gameboxVideo: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')

    await require('./rewardVideo').doReward(axios, {
      ...options,
      acid: 'AC20200728150217',
      taskId: '528a06737ac24317a3166027c1e3fe06',
      codeId: 945510695,
      reward_name: '游戏视频广告积分'
    })

    let { data } = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/game_box`,
      method: 'post',
      data: transParams({
        'methodType': 'reward',
        'deviceType': 'Android',
        'clientVersion': appInfo.version,
        'isVideo': 'Y'
      })
    })
    if (data) {
      if (data.code !== '0000') {
        console.info(data.desc)
      } else {
        console.info('视频宝箱领取', data.desc)
      }
    } else {
      console.error('视频宝箱领取失败')
    }

    console.info('积分翻倍')
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200728150217',
      taskId: '5e5b05beb9ae4cdebdaf4ed59da1c697',
      codeId: 945535750,
      reward_name: '游戏频道看视频得积分2'
    })

  }
}
module.exports = integral