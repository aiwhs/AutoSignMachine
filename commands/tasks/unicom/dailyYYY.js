const { encryptParamsV1, encryptParamsV2, encryptParamsV3, signRewardVideoParams, decryptParamsV1 } = require('./CryptoUtil')
const crypto = require('crypto');
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var dailyYYY = {
  openPlatLine: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let searchParams = {}
    let result = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/yyyqd&duanlianjieabc=tbkwx`,
      method: 'GET',
      transformResponse: (data, headers) => {
        if ('location' in headers) {
          let uu = new URL(headers.location)
          let pp = {}
          for (let p of uu.searchParams) {
            pp[p[0]] = p[1]
          }
          if ('ticket' in pp) {
            searchParams = pp
          }
        }
        return data
      }
    }).catch(err => console.error(err))
    let jar = result.config.jar

    let cookiesJson = jar.toJSON()
    let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
    ecs_token = ecs_token.value
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }
    let jfid = cookiesJson.cookies.find(i => i.key == '_jf_id')
    jfid = jfid.value

    return {
      jar,
      jfid,
      searchParams
    }
  },
  freeLoginRock: async (axios, options) => {
    const { jfid, searchParams, jar } = options
    const useragent = buildUnicomUserAgent(options, 'p')

    let params = {
      activityId: "Ac-9b71780cb87844b9ac3ab5d34b11dd24",
      userCookie: jfid,
      userNumber: searchParams.userNumber,
      time: new Date().getTime()
    };

    let encrypted_params = encryptParamsV1(params)
    let res = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/shake/index.html?jump=sign",
        "origin": "https://img.jf.10010.com",
        "Content-Type": "application/json"
      },
      jar,
      url: `https://m.jf.10010.com/jf-yuech/p/freeLoginRock`,
      method: 'post',
      data: encrypted_params
    }).catch(err => console.error(err))

    result = res.data
    if (result.code !== 0) {
      throw new Error(result.message)
    }

    return result.data
  },
  doVideoReward: async (axios, options) => {
    const { plat } = options
    let params = {
      'arguments1': 'AC20200611152252',
      'arguments2': '',
      'arguments3': '',
      'arguments4': new Date().getTime(),
      'arguments6': '',
      'arguments7': '',
      'arguments8': '',
      'arguments9': '',
      'netWay': 'Wifi',
      'remark1': '签到小游戏摇摇乐不倒翁',
      'remark': '签到小游戏翻倍得积分',
      'version': appInfo.unicom_version,
      'codeId': 945689604
    }
    params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
    params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')

    result = await require('./taskcallback').reward(axios, {
      ...options,
      params,
      jar: plat.jar
    })
    return {
      params
    }
  },
  minusGameTimes: async (axios, options) => {
    const { Authorization, params } = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "Authorization": `Bearer ${Authorization}`,
        "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/shake/index.html?jump=sign"
      },
      jar: null,
      url: `https://m.jf.10010.com/jf-yuech/api/gameResultV2/minusGameTimes`,
      method: 'POST',
      data: params
    })
    return {
      resultId: data.data.resultId
    }
  },
  luckDrawForPrize: async (axios, options) => {
    const { Authorization, params, activityId } = options
    const useragent = buildUnicomUserAgent(options, 'p')

    let { data } = await axios.request({
      headers: {
        "Authorization": `Bearer ${Authorization}`,
        "user-agent": useragent,
        "referer": "https://m.jf.10010.com/cms/yuech/unicom-integral-ui/yuech-Blindbox/shake/index.html?jump=sign",
        "origin": "https://img.jf.10010.com"
      },
      url: `https://m.jf.10010.com/jf-yuech/api/gameResultV2/luckDrawForPrize`,
      method: 'post',
      data: params
    })

    if (data.code !== 0) {
      console.info("摇一摇送好礼:", data.message)
    } else {
      console.info('摇一摇送好礼:', data.data.status === '中奖' ? data.data.prizeName : data.data.status)
      if (data.data.doublingStatus) {
        console.info('提交积分翻倍')
        await dailyYYY.lookVideoDouble(axios, {
          ...options
        })
        await dailyYYY.lookVideoDoubleResult(axios, {
          ...options,
          Authorization,
          activityId: activityId,
          winningRecordId: data.data.winningRecordId
        })
      }
    }
  },
  lookVideoDouble: async (axios, options) => {
    // AC20200611152252 - 627292f1243148159c58fd58917c3e67 总30次，多个游戏共享，限制limit 1次
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200611152252',
      taskId: '627292f1243148159c58fd58917c3e67',
      codeId: 945689604,
      reward_name: '签到小游戏摇摇乐不倒翁',
      limit: 1
    })
  },
  lookVideoDoubleResult: async (axios, options) => {
    let { Authorization, activityId, winningRecordId } = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let res = await axios.request({
      headers: {
        "Authorization": `Bearer ${Authorization}`,
        "user-agent": useragent,
        "referer": "https://img.jf.10010.com/",
        "origin": "https://img.jf.10010.com"
      },
      url: `https://m.jf.10010.com/jf-yuech/api/gameResult/doublingIntegral?activityId=${activityId}&winningRecordId=${winningRecordId}`,
      method: 'get'
    })
    result = res.data
    if (result.code !== 0) {
      console.info("摇一摇送好礼翻倍结果:", result.message)
    } else {
      console.info("摇一摇送好礼翻倍结果:", result.data)
    }
  },
  doTask: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let plat = await dailyYYY.openPlatLine(axios, options)
    let { token, activityInfos } = await dailyYYY.freeLoginRock(axios, {
      ...options,
      ...plat
    })

    let activity = activityInfos.activityVOs[0]
    let Authorization = token.access_token
    let freeTimes = activity.activityTimesInfo.freeTimes
    let advertTimes = activity.activityTimesInfo.advertTimes

    do {
      let orderId = ''
      console.info(activity.activityName + `[${activity.activityId}]`, "已消耗机会", (1 + 4) - (freeTimes + advertTimes), "剩余免费机会", freeTimes, '看视频广告机会', advertTimes)
      if (!freeTimes && !advertTimes) {
        console.info('没有游戏次数')
        break
      }

      let p = {
        'activityId': activity.activityId,
        'currentTimes': freeTimes,
        'type': '免费'
      }

      if (!freeTimes && advertTimes) {
        let { params } = await dailyYYY.doVideoReward(axios, {
          ...options,
          plat
        })
        p = {
          'activityId': activity.activityId,
          'currentTimes': advertTimes,
          'type': '广告',
          'orderId': params['orderId'],
          'phoneType': 'android',
          'version': appInfo.version
        }
        advertTimes--
      } else {
        freeTimes--
      }

      let { resultId } = await dailyYYY.minusGameTimes(axios, {
        ...options,
        Authorization,
        params: encryptParamsV3(p, plat.jfid)
      })

      await dailyYYY.luckDrawForPrize(axios, {
        ...options,
        activityId: activity.activityId,
        Authorization,
        params: encryptParamsV3({
          activityId: activity.activityId,
          resultId: resultId
        }, plat.jfid)
      })

      console.info('等待15秒再继续')
      await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
    } while (freeTimes || advertTimes)
  }
}

module.exports = dailyYYY