var crypto = require('crypto');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')

var dailysignin = {
  getIntegral: async (axios, options) => {
    const useragent = `okhttp/4.4.0`
    let { data, config } = await axios.request({
      baseURL: 'https://act.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/SigninApp/signin/getIntegral`,
      method: 'post'
    })
    if (data.status !== '0000') {
      throw new Error(result.msg)
    } else {
      if (data.status === '0000') {
        console.info('用户已有累计积分:' + data.data.integralTotal)
      } else {
        throw new Error('获取积分信息失败')
      }
    }
    return {
      ...data.data,
      jar: config.jar
    }
  },
  query: async (axios, options) => {
    const useragent = `okhttp/4.4.0`
    let { data } = await axios.request({
      baseURL: 'https://act.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/SigninApp/signin/getContinuous`,
      method: 'post'
    })
    return data
  },
  daySign: async (axios, options) => {
    const useragent = `okhttp/4.4.0`
    let { data, config } = await axios.request({
      baseURL: 'https://act.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/SigninApp/signin/daySign`,
      method: 'post'
    })
    return {
      data,
      config
    }
  },
  doTask: async (axios, options) => {
    let { integralTotal } = await dailysignin.getIntegral(axios, options)
    let result = await dailysignin.query(axios, options)
    if (result.status === '0000') {
      if (result.data.todaySigned === '1') {
        let { data, config } = await dailysignin.daySign(axios, options)
        if (data.status === '0000') {
          console.reward('integral', data.data.newCoin - integralTotal)
          console.info('积分签到成功+' + (data.data.newCoin - integralTotal) + '积分', '总积分:' + data.data.newCoin)
          if (data.data.doubleShowFlag) {
            await dailysignin.lookVideoDouble(axios, {
              ...options,
              jar: config.jar
            })
          }
        } else {
          console.error('积分签到失败', data.msg)
        }
      } else {
        console.info('今日已签到')
      }
    } else {
      console.error('获取签到状态失败', result.msg)
    }
  },
  lookVideoDouble: async (axios, options) => {
    const { jar } = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let params = {
      'arguments1': '',
      'arguments2': '',
      'arguments3': '',
      'arguments4': new Date().getTime(),
      'arguments6': '',
      'arguments7': '',
      'arguments8': '',
      'arguments9': '',
      'netWay': 'Wifi',
      'remark1': '签到看视频翻倍得积分',
      'remark': '签到积分翻倍',
      'version': appInfo.unicom_version,
      'codeId': 945535743
    }
    params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
    params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')

    await require('./taskcallback').reward(axios, {
      ...options,
      params,
      jar
    })

    let { data } = await axios.request({
      baseURL: 'https://act.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com",
        "origin": "https://img.client.10010.com"
      },
      url: `/SigninApp/signin/bannerAdPlayingLogo`,
      method: 'post'
    })
    if (data.status === '0000') {
      console.reward('integral', data.data.prizeCount)
      console.info('积分翻倍成功:', data.data.prizeCount)
    } else {
      console.error('积分翻倍失败:', data.msg)
    }
  }
}

module.exports = dailysignin