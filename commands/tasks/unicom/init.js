const { getCookies, saveCookies } = require('../../../utils/util')
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')
var crypto = require('crypto');
var moment = require('moment');
moment.locale('zh-cn');

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDc+CZK9bBA9IU+gZUOc6
FUGu7yO9WpTNB0PzmgFBh96Mg1WrovD1oqZ+eIF4LjvxKXGOdI79JRdve9
NPhQo07+uqGQgE4imwNnRx7PFtCRryiIEcUoavuNtuRVoBAm6qdB0Srctg
aqGfLgKvZHOnwTjyNqjBUxzMeQlEC2czEMSwIDAQAB
-----END PUBLIC KEY-----`.toString('ascii')

// 创建加密算法
const rsapublicKeyEncode = function (data) {
  let crypted = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, Buffer.from(data + '')).toString('base64');
  return crypted;
};

var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

module.exports = async (axios, params) => {
  let { cookies, options } = params
  const useragent = buildUnicomUserAgent(options, 'p')
  let token_online
  let appId
  let data

  if (cookies) {
    let res = await axios.request({
      baseURL: 'https://m.client.10010.com',
      headers: {
        "user-agent": useragent,
        "referer": "https://m.client.10010.com",
        "origin": "https://m.client.10010.com"
      },
      url: `/mobileService/customer/query/getMyUnicomDateTotle.htm`,
      method: 'post'
    })
    data = res.data
    config = res.config
    let cookiesJson = config.jar.toJSON()
    token_online = cookiesJson.cookies.find(i => i.key == 'token_online')
    if (token_online) {
      token_online = token_online.value
    } else {
      token_online = undefined
    }
    appId = cookiesJson.cookies.find(i => i.key == 'appId')
    if (appId) {
      appId = appId.value || options.appid
    } else {
      appId = undefined
    }
  }

  if (Object.prototype.toString.call(data) !== '[object Object]' || !data || !('phone' in data)) {
    console.info('cookies凭据访问失败，将使用账户密码登录')
    if (!('appid' in options) || !options['appid']) {
      throw new Error("需要提供appid")
    }
    if (options['user']) {
      if (!('password' in options) || !options['password']) {
        throw new Error("需要提供登陆密码")
      }
    } else if (!cookies) {
      throw new Error("需要提供登录信息，使用密码账号或者cookies")
    }
    var params = {
      // ChinaunicomMobileBusiness
      'appId': appId || options.appid,
      'deviceBrand': device.deviceBrand,
      'deviceCode': device.deviceId, // IMEI
      'deviceId': device.deviceId,
      'deviceModel': device.deviceModel,
      'deviceOS': device.android_version,
      'isRemberPwd': 'true',
      'keyVersion': '',
      'mobile': rsapublicKeyEncode(options.user + ''),
      'netWay': 'Wifi',
      'password': rsapublicKeyEncode(options.password + ''),
      'pip': '172.16.70.15',
      'provinceChanel': 'general',
      'simCount': '0',
      'timestamp': moment().format('YYYYMMDDHHmmss'),
      'version': appInfo.unicom_version,
      'yw_code': ''
    }
    const { data, config } = await axios.request({
      baseURL: 'https://m.client.10010.com',
      headers: {
        "user-agent": useragent,
        "referer": "https://m.client.10010.com",
        "origin": "https://m.client.10010.com"
      },
      url: `/mobileService/login.htm`,
      method: 'post',
      data: transParams(params)
    })
    if (data.code !== '0') {
      console.notify('登陆失败:' + data.dsc)
      throw new Error('登陆失败:' + data.dsc)
    }
    cookies = 'token_online=' + data.token_online + '; appId=' + data.appId
    await saveCookies('unicom_' + (options.user || 'default'), cookies, config.jar)
    console.info('获得登录状态成功')
  } else {
    var params = {
      'appId': appId,
      'deviceBrand': device.deviceBrand,
      'deviceCode': device.deviceId, // IMEI
      'deviceId': device.deviceId,
      'deviceModel': device.deviceModel,
      'deviceOS': device.android_version,
      'netWay': 'Wifi',
      'platformToken': '0867442035025655300000391200CN01',
      'pushPlatform': 'samsung',
      'reqtime': new Date().getTime(),
      'token_online': token_online,
      'version': appInfo.unicom_version,
    }
    if (!params.appId) {
      throw new Error('appId参数无效')
    }
    if (!params.token_online) {
      throw new Error('token_online参数无效')
    }
    const { data, config } = await axios.request({
      baseURL: 'https://m.client.10010.com',
      headers: {
        "user-agent": useragent,
        "referer": "https://m.client.10010.com",
        "origin": "https://m.client.10010.com"
      },
      url: `/mobileService/onLine.htm`,
      method: 'post',
      data: transParams(params)
    }).catch(err => console.error(err))

    if (data.code !== '0') {
      console.notify('登陆失败:' + data.dsc)
      throw new Error('登陆失败:' + data.dsc)
    }
    cookies += '; token_online=' + data.token_online + '; appId=' + data.appId
    await saveCookies('unicom_' + (options.user || 'default'), cookies, config.jar)
    console.info('获得登录状态成功')
  }
}