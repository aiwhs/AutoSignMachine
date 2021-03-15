
const { appInfo, buildUnicomUserAgent } = require('../../../utils/device')
const { CompleteEvent } = require('../../../utils/EnumError')
var moment = require('moment');
moment.locale('zh-cn');
const cheerio = require('cheerio')

var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};

var exchangeDFlow = {
    exchangeFlow: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let phone = options.user + ''
        let phone_s = ''
        for (let char of phone) {
            phone_s += (parseInt(char) + 75) + '_'
        }

        // 默认兑换 1GB流量日包
        let product = [
            {
                productId: 'ff80808166c5ee6701676ce21fd14716',
                productName: '1GB流量日包',
                ebCount: '1000000'
            },
            {
                productId: '21010621565413402',
                productName: '2GB流量日包',
                ebCount: '2000000'
            },
            {
                productId: '21010621461012371',
                productName: '5GB流量日包',
                ebCount: '5000000'
            },
            {
                productId: '21010621253114290',
                productName: '10GB流量日包',
                ebCount: '10000000'
            }
        ]

        // 可使用 --exchangeDFlowCircle-productId 21010621565413402 选项指定兑换流量包ID
        let { 'exchangeDFlowCircle-productId': productId = 'ff80808166c5ee6701676ce21fd14716' } = options
        if (product.map(p => p.productId).indexOf(productId + '') === -1) {
            productId = 'ff80808166c5ee6701676ce21fd14716'
        }
        let selectedFlow = product.find(p => p.productId === productId)
        console.info('将兑换', selectedFlow.productName)

        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://m.client.10010.com/MyAccount/trafficController/myAccount.htm?flag=1&cUrl=https://m.client.10010.com/myPrizeForActivity/querywinninglist.htm?pageSign=1`,
                "origin": "https://m.client.10010.com",
                "X-Requested-With": "XMLHttpRequest"
            },
            url: `https://m.client.10010.com/MyAccount/exchangeDFlow/exchange.htm?userLogin=${phone_s}`,
            method: 'POST',
            data: transParams({
                'productId': selectedFlow.productId,
                'productName': selectedFlow.productName,
                'ebCount': selectedFlow.ebCount,
                'userLogin': phone_s,
                'pageFrom': '4'
            })
        })

        console.info('等待10秒查询激活状态')
        await new Promise((resolve, reject) => setTimeout(resolve, 10000))

        let flowPackages = await exchangeDFlow.querywinninglist(axios, options)
        await exchangeDFlow.queryPrizeDetails(axios, {
            ...options,
            firstPackage: flowPackages[0],
            selectedFlow
        })

    },
    // 查询我的流量礼包
    querywinninglist: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://m.client.10010.com/myPrizeForActivity/querywinninglist.htm?yw_code=&desmobile=${options.user}&version=${appInfo.unicom_version}`,
                "origin": "https://m.client.10010.com",
                "X-Requested-With": "XMLHttpRequest"
            },
            url: `https://m.client.10010.com/myPrizeForActivity/mygiftbag.htm`,
            method: 'POST',
            data: transParams({
                'typeScreenCondition': '2',
                'category': 'FFLOWPACKET',
                'pageSign': '1',
                'CALLBACKURL': 'https://m.client.10010.com/myPrizeForActivity/querywinninglist.htm'
            })
        })
        let $ = cheerio.load(data)
        let cards = $('.container_main').find('a')
        let flowPackages = []
        for (let card of cards) {
            let matched = $(card).attr('onclick').match(/toDetailPage\('(.*?)','(.*?)','(.*?)'\)/)
            let activeBt = $(card).find('.boxBG_footer .activeBt')
            let leftTime = $(card).find('.boxBG_footer .boxBG_footer_leftTime')
            let productName = $(card).find('.boxBG_ul li:last-child').text().split('：').pop()
            let html = $(leftTime).html()
            if (html) {
                leftTime = html.split('&nbsp;-&nbsp;').pop()
            } else {
                leftTime = ''
            }
            flowPackages.push({
                activeCode: matched[1],
                prizeRecordID: matched[2],
                leftTime: moment(leftTime).valueOf(),
                active: activeBt.length > 0,
                productName: productName.replace(/ /g, '')
            })
        }
        return flowPackages
    },
    // 激活流量包
    activationFlowPackages: async (axios, options) => {
        const { selectedFlow } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://m.client.10010.com/myPrizeForActivity/queryPrizeDetails.htm`,
                "origin": "https://m.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui"
            },
            url: `https://m.client.10010.com/myPrizeForActivity/myPrize/activationFlowPackages.htm`,
            method: 'POST',
            data: transParams({
                'activeCode': selectedFlow.activeCode,
                'prizeRecordID': selectedFlow.prizeRecordID,
                'activeName': '做任务领奖品'
            })
        })
        console.info(data)

        console.info('等待10秒查询激活状态')
        await new Promise((resolve, reject) => setTimeout(resolve, 10000))

        let flowPackages = await exchangeDFlow.querywinninglist(axios, options)
        let flow = flowPackages.find(f => f.prizeRecordID === selectedFlow.prizeRecordID && f.activeCode === selectedFlow.activeCode)
        if (!flow.active) {
            console.notify(selectedFlow.productName, '激活成功')
        } else {
            console.notify(selectedFlow.productName, '激活失败')
            throw new Error(selectedFlow.productName + ' 激活失败')
        }
    },
    queryPrizeDetails: async (axios, options) => {
        const { firstPackage, selectedFlow } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `http://m.client.10010.com/myPrizeForActivity/mygiftbag.htm`,
                "origin": "https://m.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui"
            },
            url: `https://m.client.10010.com/myPrizeForActivity/queryPrizeDetails.htm`,
            method: 'POST',
            data: transParams({
                'pageSign': '1',
                'clicksource': '1',
                'activeCode': firstPackage.activeCode,
                'prizeRecordID': firstPackage.prizeRecordID,
                'userNumber': firstPackage.user,
                'callbackUrl': 'https://m.client.10010.com/myPrizeForActivity/querywinninglist.htm',
                'shareTitle': '我的礼包全新改版',
                'shareContent': '奖品种类丰富，分类一目了然，多多参与联通手厅活动，你就有机会中大奖！',
                'shareIconURL': 'https://img.client.10010.com/myPrizeForActivity/view/images/shareiconurl.jpg',
                'shareURL': 'https://u.10010.cn/qADMV',
                'typeScreenCondition': '2'
            })
        })
        console.error(firstPackage, selectedFlow)
        let matched = data.match(/class="fy">([^<].*?)<\/span>/g)
        if (matched.length === 5) {
            let name_matched = matched[0].match(/class="fy">([^<].*?)<\/span>/)
            if (name_matched[1] !== selectedFlow.productName) {
                console.notify(selectedFlow.productName, '激活失败')
                throw new Error(selectedFlow.productName + ' 激活失败')
            } else {
                let state_matched = matched[2].match(/class="fy">([^<].*?)<\/span>/)
                let time_matched = matched[4].match(/class="fy">([^<].*?)<\/span>/)
                if (moment().subtract(40, 'minutes').isBefore(moment(time_matched[1])) && state_matched[1] === '已激活') {
                    console.notify(name_matched[1], '激活成功')
                } else {
                    console.notify(name_matched[1], '激活失败')
                    throw new Error(name_matched[1] + ' 激活失败')
                }
            }
        }
    },
    queryOcsPackageFlowLeftContent: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let { data } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": `https://img.client.10010.com/yuliangchaxun/index.html`,
                "origin": "https://img.client.10010.com",
                "X-Requested-With": "com.sinovatech.unicom.ui"
            },
            url: `https://m.client.10010.com/mobileservicequery/operationservice/queryOcsPackageFlowLeftContent`,
            method: 'POST',
            data: transParams({
                'mobile': options.user
            })
        })
        if (!data.resources) {
            throw new Error('获取流量明细记录失败')
        }
        return data.resources[0].details.filter(d => d.limited === '0')
    },
    doCircleCheck: async (axios, options) => {
        // 可使用 --exchangeDFlowCircle-minFlow 200 选项指定流量检查最小值
        let { 'exchangeDFlowCircle-minFlow': minFlow = 200 } = options
        if (typeof minFlow !== 'number') {
            minFlow = 200
        }
        // 可使用 --exchangeDFlowCircle-endMinute 45 选项指定距离0点的间隔分钟数，不足endMinute分钟时不再兑换流量
        let { 'exchangeDFlowCircle-endMinute': endMinute = 45 } = options
        if (typeof endMinute !== 'number') {
            endMinute = 45
        }
        if (!moment().isBefore(moment().endOf('days').subtract(endMinute, 'minutes'))) {
            throw new CompleteEvent('距离0点不足45分钟，不再兑换流量')
        }
        let need_exchange = false
        let data = await exchangeDFlow.queryOcsPackageFlowLeftContent(axios, options)
        if (data.length) {
            let notUsed = 0
            for (let d of data) {
                notUsed += parseFloat(parseFloat(d.total) - parseFloat(d.use))
            }
            console.info('剩余流量', parseFloat(notUsed).toFixed(2), 'MB', '检查限制', minFlow, 'MB')
            if (notUsed < minFlow) {
                console.info(`剩余流量包流量不足${minFlow}M`)
                need_exchange = true
            }
        } else {
            console.info('没有有效的流量包')
            need_exchange = true
        }

        if (need_exchange) {
            await exchangeDFlow.exchange(axios, options)
        } else {
            console.info('跳过兑换流量包')
        }
    },
    exchange: async (axios, options) => {
        let flowPackages = await exchangeDFlow.querywinninglist(axios, options)
        let flowPackagesActive = flowPackages.filter(f => f.active)
        if (flowPackagesActive.length) {
            await exchangeDFlow.activationFlowPackages(axios, {
                ...options,
                selectedFlow: flowPackagesActive.pop()
            })
        } else {
            await exchangeDFlow.exchangeFlow(axios, options)
        }
    },
    doTask: async (axios, options) => {
        await exchangeDFlow.exchange(axios, options)
    }
}
module.exports = exchangeDFlow