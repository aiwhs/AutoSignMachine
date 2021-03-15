const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
axiosCookieJarSupport(axios);

const err = (error) => {
  return Promise.reject(error)
}

var parseDefaultCookie = function (cookies) {
  let cookie = []
  if (Object.prototype.toString.call(cookies) == '[object String]') {
    cookie = cookies ? [cookies] : []
  } else if (Object.prototype.toString.call(cookies) == '[object Object]') {
    Object.keys(cookies).forEach(item => {
      cookie.push(item + '=' + cookies[item])
    })
  }
  return cookie.join('; ')
}

var setCookieString = function (jar, cookies, config) {
  let url
  if (config.url.indexOf('http') === 0) {
    url = config.url
  } else {
    url = config.baseURL + config.url
  }
  let uuuu = new URL(url)
  // console.log('setCookieString for', uuuu.origin)
  cookies = parseDefaultCookie(cookies)
  if (Object.prototype.toString.call(cookies) == '[object String]') {
    cookies.length && cookies.split('; ').forEach(cookie => {
      jar.setCookieSync(cookie, uuuu.origin + '/', {})
    })
  }
  return jar
}

module.exports = cookies => {

  const service = axios.create({
    headers: {
      Cookie: parseDefaultCookie(cookies)
    },
    jar: new tough.CookieJar(),
    retry: 3,
    retryDelay: 1000,
    timeout: 60000,
    withCredentials: true
  })

  const axiosRetryInterceptor = (err) => {
    let isNeedRetry = false
    let reson = '超过总重试次数'
    let isOther = false
    let config = err.config;
    let isMask = process.env.asm_verbose !== 'true'

    if (['ETIMEDOUT', 'ECONNABORTED', 'ECONNRESET'].indexOf(err.code) !== -1) {
      reson = '出现网络超时错误'
      isNeedRetry = true
    } else if (err.response && [500, 501, 502, 503, 504].indexOf(err.response.status) !== -1) {
      reson = '远程服务暂不可用'
      isNeedRetry = true
    } else if (err.response && [403, 404, 405].indexOf(err.response.status) !== -1) {
      reson = '可能出现API变更，无法请求'
      isNeedRetry = false
    } else {
      reson = '其他错误'
      isNeedRetry = false
      isOther = true
    }
    console.log(isMask ? '[非开发模式，隐藏url]' : config.url, reson, err.code ? err.code : '', err.response ? err.response.status : '')

    if (!config || !config.retry) return Promise.reject(err);

    config.__retryCount = config.__retryCount || 0;

    if (!isNeedRetry) {
      console.log(reson, '退出重试')
      config.__retryCount = 0
      return Promise.reject(new Error(isOther ? (isMask ? '[非开发模式，隐藏请求错误信息]' : err) : reson));
    }

    if (config.__retryCount >= config.retry) {
      console.log('超过总重试次数', '退出重试')
      config.__retryCount = 0
      return Promise.reject(new Error(reson));
    }

    config.__retryCount += 1;
    console.log(isMask ? '[非开发模式，隐藏url]' : config.url, '自动重试第' + config.__retryCount + '次');

    var backoff = new Promise((resolve) => setTimeout(resolve, config.retryDelay || 1));

    return backoff.then(function () {
      return service(config);
    });

  }

  service.interceptors.request.use(async config => {
    if (!('user-agent' in config.headers)) {
      config.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36'
    }
    let jar = config.jar
    if (!jar) {
      jar = new tough.CookieJar()
    } else {
      config.headers['Cookie'] = ''
    }
    config.jar = setCookieString(jar, cookies, config)
    return config
  }, err)

  service.interceptors.response.use(async response => response, axiosRetryInterceptor)

  return service;
}