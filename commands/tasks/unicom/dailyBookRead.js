
const { RSAUtils } = require('./RSAUtils');
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var moment = require('moment');
moment.locale('zh-cn');

var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

var dailyBookRead = {
  shouTingLogin: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    //密码加密
    var modulus = "00D9C7EE8B8C599CD75FC2629DBFC18625B677E6BA66E81102CF2D644A5C3550775163095A3AA7ED9091F0152A0B764EF8C301B63097495C7E4EA7CF2795029F61229828221B510AAE9A594CA002BA4F44CA7D1196697AEB833FD95F2FA6A5B9C2C0C44220E1761B4AB1A1520612754E94C55DC097D02C2157A8E8F159232ABC87";
    var exponent = "010001";
    var key = RSAUtils.getKeyPair(exponent, '', modulus);
    let phonenum = RSAUtils.encryptedString(key, options.user);

    let { config: st_config } = await axios.request({
      headers: {
        "user-agent": useragent,
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/common/shouTingLogin.action`,
      method: 'POST',
      data: transParams({
        phonenum
      })
    })
    let st_jar = st_config.jar
    let cookiesJson = st_jar.toJSON()
    let diwert = cookiesJson.cookies.find(i => i.key == 'diwert')
    let userAccount = cookiesJson.cookies.find(i => i.key == 'useraccount')
    if (!userAccount || !diwert) {
      throw new Error('获取用户信息失败')
    }
    return {
      st_jar,
      phonenum
    }
  },
  // 阅读会员日活动-看视频得积分
  dovideoIntegralTask: async (request, options) => {

    if (moment().day() !== 3) {
      console.info('不是会员日(星期3)跳过')
      return
    }

    await require('./rewardVideo').doTask(request, {
      ...options,
      acid: 'AC20200521222721',
      taskId: 'c32ef7f06d8e4b5fa3818a5504da2109',
      codeId: 945569148,
      reward_name: '阅读会员日看视频得积分'
    })
  },
  // 阅读会员日活动-签到
  doMemberDaySign: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')

    if (moment().day() !== 3) {
      console.info('不是会员日(星期3)跳过')
      return
    }

    const { st_jar } = await dailyBookRead.shouTingLogin(axios, options)

    let { data } = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `http://st.woread.com.cn/touchextenernal/memberday/index.action?yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
        "origin": "http://st.woread.com.cn"
      },
      jar: st_jar,
      url: `http://st.woread.com.cn/touchextenernal/memberday/signin.action`,
      method: 'post'
    })

    if (data.code === '0000') {
      console.info('阅读会员日活动', '签到成功')
    } else {
      console.info('阅读会员日活动', data.message)
    }

  },
  doTask: async (request, options) => {
    await require('./rewardVideo').doTask(request, {
      ...options,
      acid: 'AC20200521222721',
      taskId: '93273c65ee2048c29b8e630a4b456cf0',
      codeId: 945535616,
      reward_name: '阅读计时器任务得积分'
    })
  }
}

module.exports = dailyBookRead