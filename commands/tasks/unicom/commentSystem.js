
const { device, appInfo, buildUnicomUserAgent } = require('../../../utils/device')

var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};
module.exports = {
  commentTask: async (axios, options) => {
  const useragent = buildUnicomUserAgent(options, 'p')
  console.info('尝试文章点赞')
    let result = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": "https://img.client.10010.com/kuaibao/index.html",
        "origin": "https://img.client.10010.com"
      },
      url: `/commentSystem/getNewsList`,
      method: 'post',
      data: transParams({
        pageNum: 1,
        pageSize: 10,
        reqChannel: '00'
      })
    }).catch(err => console.error('获取文章数据失败'))
    if (!result || result.data.code !== '0000') {
      throw new Error('获取文章数据失败')
    }
    let newsIds = result.data.data.map(i => (
      {
        id: i.id,
        mainTitle: i.mainTitle,
        subTitle: i.subTitle
      }
    ))
    if (!newsIds.length) {
      throw new Error('获取文章数据失败')
    }
    for (let newsId of newsIds) {
      let result
      try {
        result = await axios.request({
          baseURL: 'https://m.client.10010.com/',
          headers: {
            "user-agent": useragent,
            "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${newsId.id}&taskId=`,
            "origin": "https://img.client.10010.com"
          },
          url: `/commentSystem/getCommentList`,
          method: 'post',
          data: transParams({
            id: newsId.id,
            pageNum: 1,
            pageSize: 20,
            reqChannel: 'quickNews'
          })
        })
      } catch (err) {
        continue
      }
      let data = result.data
      if (!result || data.code !== '0000') {
        throw new Error('获取文章评论数据失败')
      } else {
        let comments = []
        if ('length' in data.commentList) {
          comments = data.commentList.map(i => (
            {
              comId: i.id,
              nickId: i.nickName
            }
          ))
        }
        for (let comment of comments) {
          // 取消点赞
          await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
              "user-agent": useragent,
              "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${newsId.id}&taskId=`,
              "origin": "https://img.client.10010.com"
            },
            url: `/commentSystem/csPraise`,
            method: 'post',
            data: transParams({
              'pointChannel': '02',
              'pointType': '02',
              'reqChannel': 'quickNews',
              'reqId': comment.comId,
              'praisedMobile': comment.nickId,
              'newsId': newsId.id
            })
          }).catch(() => console.error('文章点赞失败'))
          // 进行点赞
          let result = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
              "user-agent": useragent,
              "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${newsId.id}&taskId=`,
              "origin": "https://img.client.10010.com"
            },
            url: `/commentSystem/csPraise`,
            method: 'post',
            data: transParams({
              'pointChannel': '02',
              'pointType': '01',
              'reqChannel': 'quickNews',
              'reqId': comment.comId,
              'praisedMobile': comment.nickId,
              'newsId': newsId.id
            })
          }).catch(() => console.error('文章点赞失败'))
          if (!result || result.data.code !== '0000') {
            console.error('文章评论点赞失败', result ? result.data.desc : '')
          } else {
            if (result.data.growScore === '0') {
              break
            }
            console.info('文章评论点赞成功')
          }
        }


        // 取消点赞
        await axios.request({
          baseURL: 'https://m.client.10010.com/',
          headers: {
            "user-agent": useragent,
            "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${newsId.id}&taskId=`,
            "origin": "https://img.client.10010.com"
          },
          url: `/commentSystem/csPraise`,
          method: 'post',
          data: transParams({
            'pointChannel': '01',
            'pointType': '02',
            'reqChannel': 'quickNews',
            'reqId': newsId.id
          })
        }).catch(() => console.error('文章点赞失败'))
        // 进行点赞
        let result = await axios.request({
          baseURL: 'https://m.client.10010.com/',
          headers: {
            "user-agent": useragent,
            "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${newsId.id}&taskId=`,
            "origin": "https://img.client.10010.com"
          },
          url: `/commentSystem/csPraise`,
          method: 'post',
          data: transParams({
            'pointChannel': '01',
            'pointType': '01',
            'reqChannel': 'quickNews',
            'reqId': newsId.id
          })
        }).catch(() => console.error('文章点赞失败'))
        if (!result || result.data.code !== '0000') {
          console.error('文章点赞失败', result ? result.data.desc : '')
        } else {
          if (result.data.growScore === '0') {
            break
          }
          console.info('文章点赞成功')
        }
      }
      break
    }

    console.info('尝试文章评论')
    let n = 5
    do {
      let news = newsIds[newsIds.length - 1]
      result = await axios.request({
        baseURL: 'https://m.client.10010.com/',
        headers: {
          "user-agent": useragent,
          "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${news.id}&taskId=`,
          "origin": "https://img.client.10010.com"
        },
        url: `/commentSystem/saveComment`,
        method: 'post',
        data: transParams({
          'id': news.id,
          'belongPro': '098',
          'commentContent': '6666...!',
          'newsTitle': news.mainTitle,
          'reqChannel': 'quickNews',
          'subTitle': news.subTitle,
          'upLoadImgName': ''
        })
      }).catch(() => console.error('保存评论失败'))
      if (!result || result.data.code !== '0000') {
        console.error('保存评论失败', result ? result.data.desc : '')
      } else {
        console.info('保存评论成功')
        result = await axios.request({
          baseURL: 'https://m.client.10010.com/',
          headers: {
            "user-agent": useragent,
            "referer": `https://img.client.10010.com/kuaibao/detail.html?pageFrom=newsList&id=${news.id}&taskId=`,
            "origin": "https://img.client.10010.com"
          },
          url: `/commentSystem/delDynamic`,
          method: 'post',
          data: transParams({
            'reqChannel': 'quickNews',
            'reqId': result.data.commentDetail.id,
            'type': '01'
          })
        }).catch(() => console.error('删除评论失败'))
        if (!result || result.data.code !== '0000') {
          console.error('删除评论失败', result ? result.data.desc : '')
        } else {
          console.info('删除评论成功')
        }
      }
    } while (--n)
  }
}