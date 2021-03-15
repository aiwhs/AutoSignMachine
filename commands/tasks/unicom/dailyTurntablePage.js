var crypto = require('crypto');
var moment = require('moment');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')
// 幸运大转盘
var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};
function w() {
  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
    , t = [];
  return Object.keys(e).forEach((function (a) {
    t.push("".concat(a, "=").concat(encodeURIComponent(e[a])))
  }
  )),
    t.join("&")
}

function encryption(data, key) {
  var iv = "";
  var cipherEncoding = 'base64';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}

var dailyTurntablePage = {
  getGoodsList: async (axios, options) => {
    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
    const useragent = buildUnicomUserAgent(options, 'p')
    let result = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://wxapp.msmds.cn/`,
        "origin": "https://wxapp.msmds.cn"
      },
      url: `https://wxapp.msmds.cn/jplus/api/change/luck/draw/gift/v1/list`,
      method: 'POST',
      data: transParams({
        'channelId': 'LT_channel',
        'phone': phone,
        'token': options.ecs_token,
        'sourceCode': 'lt_turntable'
      })
    })
    if (result.data.code !== 200) {
      console.info(result.data.msg)
      return false
    }
    return result.data.data
  },
  doTask: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let searchParams = {}
    let result = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/turntablePage`,
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
    let jar1 = result.config.jar

    let cookiesJson = jar1.toJSON()
    let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
    ecs_token = ecs_token.value
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }

    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
    let playCounts = 0
    let isLookVideo = false
    do {
      let res = await dailyTurntablePage.getGoodsList(axios, {
        ...options,
        ecs_token,
        phone
      })

      if (!res) {
        break
      }

      playCounts = res.playCounts
      isLookVideo = res.isLookVideo

      if (!playCounts && !isLookVideo) {
        console.info('没有游戏次数')
        break
      }

      if (!playCounts && isLookVideo) {

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
          'remark': '签到小游戏买什么都省转盘抽奖',
          'version': appInfo.unicom_version,
          'codeId': 945535695
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        params['orderId'] = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')
        params['arguments4'] = new Date().getTime()

        result = await require('./taskcallback').reward(axios, {
          ...options,
          params,
          jar: jar1
        })
        let a = {
          'channelId': 'LT_channel',
          "phone": phone,
          'token': ecs_token,
          'videoOrderNo': params['orderId'],
          'sourceCode': 'lt_turntable'
        }

        let timestamp = moment().format('YYYYMMDDHHmmss')
        result = await axios.request({
          headers: {
            "user-agent": useragent,
            "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/turntablePage?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&userNumber=${options.user}`,
            "origin": "https://wxapp.msmds.cn"
          },
          url: `https://wxapp.msmds.cn/jplus/api/change/luck/draw/gift/v1/liantong/look/video`,
          method: 'POST',
          data: transParams(a)
        })

        if (result.data.code !== 200) {
          console.error('提交任务失败', result.data.msg)
        } else {
          console.info('提交任务成功', `${result.data.data}`)
        }
      }

      let a = {
        'channelId': 'LT_channel',
        'code': '',
        'flag': '',
        "phone": phone,
        'token': ecs_token,
        'taskId': '',
        'sourceCode': 'lt_turntable'
      }

      let timestamp = moment().format('YYYYMMDDHHmmss')
      result = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/turntablePage?ticket=${searchParams.ticket}&type=02&version=${appInfo.unicom_version}&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&userNumber=${options.user}`,
          "origin": "https://wxapp.msmds.cn"
        },
        url: `https://wxapp.msmds.cn/jplus/api/change/luck/draw/gift/v1/playLuckDraw?` + w(a),
        method: 'POST'
      })

      if (result.data.code !== 200) {
        console.error('提交任务失败', result.data.msg)
      } else {
        let good = result.data.data.list.find(f => f.giftId === result.data.data.giftId)
        console.info('提交任务成功，获得', good.giftName)
        if (result.data.data.lookVideoDouble) {
          console.info('提交积分翻倍')
          await dailyTurntablePage.lookVideoDouble(axios, {
            ...options,
            jar: result.config.jar
          })
        }
      }

      console.info('等待25秒再继续')
      await new Promise((resolve, reject) => setTimeout(resolve, 25 * 1000))

    } while (playCounts || isLookVideo)
  },
  lookVideoDouble: async (axios, options) => {
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200716103629',
      taskId: 'fc32b68892de4299b6ccfb2de72e1ab8',
      codeId: 945535695,
      reward_name: '签到小游戏买什么都省转盘抽奖'
    })
  }
}

module.exports = dailyTurntablePage