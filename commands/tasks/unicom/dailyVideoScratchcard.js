var crypto = require('crypto');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { signRewardVideoParams } = require('./CryptoUtil')
// 疯狂刮刮乐
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

var dailyVideoScratchcard = {
  getGoodsList: async (axios, options) => {
    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
    const useragent = buildUnicomUserAgent(options, 'p')
    let result = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://wxapp.msmds.cn/`,
        "origin": "https://wxapp.msmds.cn"
      },
      url: `https://wxapp.msmds.cn/jplus/h5/channelScratchCard/findAllCard`,
      method: 'GET',
      params: transParams({
        'channelId': 'LT_channel',
        'phone': phone,
        'token': options.ecs_token,
        'sourceCode': 'lt_scratchcard'
      })
    })
    return result.data.data.allCards.filter(c => !c.status)
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
      url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/scratchcardPage?source=unicom&duanlianjieabc=tbkR2`,
      method: 'get',
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
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }
    ecs_token = ecs_token.value

    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')

    let goods = await dailyVideoScratchcard.getGoodsList(axios, {
      ...options,
      ecs_token,
      phone
    })

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
      'remark': '签到小游戏幸运刮刮卡',
      'version': appInfo.unicom_version,
      'codeId': 945597731
    }
    params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])

    if (goods.length) {
      for (let good of goods) {
        console.info('开始处理', good.name)
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
          'cardId': good.id,
          'sourceCode': 'lt_scratchcard'
        }
        result = await axios.request({
          headers: {
            "user-agent": useragent,
            "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/scratchcardItemPage`,
            "origin": "https://wxapp.msmds.cn"
          },
          url: `https://wxapp.msmds.cn/jplus/h5/channelScratchCard/doScratchCard?` + w(a),
          method: 'GET'
        })
        if (result.data.code !== 200) {
          console.info(result.data.msg)
        } else {
          console.reward('integral', result.data.data.prizeType ? result.data.data.integral : 0)
          console.info('提交任务成功', `+${result.data.data.prizeType ? result.data.data.integral : 0}`)
        }
        console.info('等待15秒再继续')
        await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
      }
    } else {
      console.info('暂无可刮得商品')
    }
  }
}

module.exports = dailyVideoScratchcard