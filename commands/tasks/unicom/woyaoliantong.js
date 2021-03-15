const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var woyaoliantong = {
  openPlatLine: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let searchParams = {}
    let result = await axios.request({
      headers: {
        "user-agent": useragent
      },
      url: `http://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://m.jf.10010.com/jf-order/avoidLogin/forActive/woyaoliantong&duanlianjieabc=qAl9a`,
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
      ecs_token,
      searchParams
    }
  },
  login: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let { jar, jfid, searchParams } = await woyaoliantong.openPlatLine(axios, options)
    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://m.jf.10010.com/cms/yuech/index.html?id=Ac-ffec5cf6ef654268a6e942a1b2dfb035 `,
        "X-Requested-With": appInfo.package_name
      },
      url: `https://m.jf.10010.com/jf-yuech/p/login?userCookie=${jfid}&userNumber=${options.user}&activityId=Ac-ffec5cf6ef654268a6e942a1b2dfb035`,
      method: 'get'
    })
    return {
      searchParams,
      token: data.data.access_token
    }
  },
  getActivity: async (axios, options) => {
    const { accesstoken } = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "Authorization": 'bearer ' + accesstoken,
        "referer": `https://m.jf.10010.com/cms/yuech/index.html?id=Ac-ffec5cf6ef654268a6e942a1b2dfb035`,
      },
      url: `https://m.jf.10010.com/jf-yuech/api/activity/Ac-ffec5cf6ef654268a6e942a1b2dfb035`,
      method: 'get'
    })
    return data.data
  },
  doTask: async (axios, options) => {
    // let { token } = await woyaoliantong.login(axios, options)
    // let activity = await woyaoliantong.getActivity(axios, {
    //   ...options,
    //   accesstoken: token
    // })
    // console.info('游戏名称', activity.activityName)
    // console.info('预设每关游戏时间', JSON.parse(activity.gameTime).join(',')) // [30,25,20]
    // console.info('预设每关通关分数', JSON.parse(activity.threshold).join(',')) // [49,69,138]
    // console.info('预设游玩花费', activity.consumeIntegral) // 50 通信积分

    let gameScore = 0
    let aval = [1, 2, 3]

    // 2 == doubling ? "618c46bbd8334754868c86ea97688f60" : "627292f1243148159c58fd58917c3e67";
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200611152252',
      taskId: '627292f1243148159c58fd58917c3e67',
      codeId: 945369805,
      reward_name: '积分商城小游戏',
      limit: 1
    })
  }
}

module.exports = woyaoliantong