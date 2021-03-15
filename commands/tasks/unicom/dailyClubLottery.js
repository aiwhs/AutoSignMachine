const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const moment = require('moment')
var dailyClubLottery = {
  openPlatLine: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let searchParams = {}
    let result = await axios.request({
      headers: {
        "user-agent": useragent
      },
      url: `http://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://c.10010.com/clubint/go/wyzrwljb`,
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

    return {
      jar,
      ecs_token,
      searchParams
    }
  },
  woappouathlogin: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let { jar, searchParams } = await dailyClubLottery.openPlatLine(axios, options)
    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "origin": "https://club.10010.com",
        "referer": `https://club.10010.com/newLogin/`,
        "X-Requested-With": appInfo.package_name
      },
      url: `https://c.10010.com/newsso/unicom/sso/newWoapplogin/woappouathlogin`,
      method: 'post',
      data: {
        "ticket": searchParams.ticket,
        "ufc": "appcs",
        "channel": "woapp"
      }
    })
    return {
      searchParams,
      payload: data.payload
    }
  },
  luckyDrawByActId: async (axios, options) => {
    const { accesstoken } = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "AuthToken": 'MEM_' + accesstoken,
        "referer": `https://club.10010.com/mday/`,
        "origin": "https://club.10010.com"
      },
      url: `https://c.10010.com/newactivity/unicom/activity/actcmpt/luckydraw/luckyDrawByActId`,
      method: 'post',
      data: {
        "act_id": "522",
        "ap_id": "1358256940093804544"
      }
    })
    if (data.code === 200) {
      console.reward(data.payload.la_name)
      console.info(data.payload.la_name)
    } else {
      console.info(data.msg)
    }
  },
  doTask: async (axios, options) => {
    if (moment().format('DD') !== '25') {
      console.info('非联通客户日，跳过')
      return
    }
    let { payload } = await dailyClubLottery.woappouathlogin(axios, options)
    await dailyClubLottery.luckyDrawByActId(axios, {
      ...options,
      ...payload
    })
  }
}

module.exports = dailyClubLottery