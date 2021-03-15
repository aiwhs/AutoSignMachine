

const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var dailylottery = {
  encryptmobile: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let res = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/jifenshangcheng/Directional?from=9110001000%E2%80%8B&yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
        "origin": "https://img.client.10010.com"
      },
      url: `/dailylottery/static/textdl/userLogin?flag=1&floortype=tbanner&from=9110001000%E2%80%8B&oneid=undefined&twoid=undefined`,
      method: 'get'
    })
    let result = res.data
    let encryptmobile = result.substr(result.indexOf('encryptmobile=') + 14, 32)
    return encryptmobile
  },
  doTask: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let encryptmobile = await dailylottery.encryptmobile(axios, options)

    let res = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com/",
        "origin": "https://img.client.10010.com"
      },
      url: `/dailylottery/static/active/findActivityInfo?areaCode=085&groupByType=&mobile=${encryptmobile}`,
      method: 'GET'
    })

    let acid = res.data.acCode
    let usableAcFreq = res.data.acFrequency.usableAcFreq
    do {
      res = await axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": "https://img.client.10010.com/",
          "origin": "https://img.client.10010.com"
        },
        url: `/dailylottery/static/doubleball/choujiang?usernumberofjsp=${encryptmobile}`,
        method: 'post'
      })
      let result = res.data
      if (result.Rsptype === '6666') {
        console.error('抽奖失败', result.RspMsg)
        break
      } else {
        console.info(result.RspMsg)
      }

      console.info('等待15秒再继续')
      await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))

    } while (--usableAcFreq)
  }
}
module.exports = dailylottery