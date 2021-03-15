# AutoSignMachine

**一个自动执行任务的工具，通过它可以实现账号自动签到，自动领取权益等功能，帮助我们轻松升级。**


## 联通APP签到任务
**实现现联通帐号的每日签到任务。**
详细功能目录如下:

* **每日签到积分**
* **冬奥积分活动**
* **每日定向积分**
* **每日游戏楼层宝箱**
* **每日抽奖**
* **首页-游戏-娱乐中心-沃之树**
* **首页-小说-阅读越有礼打卡赢话费**
* **首页-小说-读满10章赢好礼**
* **首页-小说-读满10章赢好礼-看视频领2积分**
* **首页-签到有礼-免流量得福利-3积分天天拿(阅读打卡)**
* **首页-小说-阅读福利抽大奖**
* **首页-签到有礼-免费领-浏览领积分**
* **首页-签到有礼-免费拿-看视频夺宝**
* **首页-签到有礼-免费抽**
* **首页-签到有礼-赚更多福利**
* **首页-游戏-娱乐中心-每日打卡**
* **每日游戏时长-天天领取3G流量包**
* **首页-积分查询-游戏任务**

```sh
node index.js unicom --user 131*******12 --password 11****11 --appid f7af****ebb
```

### docker单用户部署
```sh
# 构建（如果不想构建镜像，可以直接使用qingjiubaba/unicom:latest这个镜像（直接替换docker命令的最下面一行即可），会根据情况，选择更新）
git clone https://github.com/aiwhs/AutoSignMachine.git
cd AutoSignMachine/
docker build -t unicom:latest -f docker/Dockerfile .
# 运行(cookies和账号密码两种方式二选一),/root/log目录是存储日志使用，可以不要这一行参数
docker run \
  --name unicom \
  -itd \
  -v /root/log:/var/log \
  -e enable_unicom=true \
  -e user=131*******12 \
  -e password=11****11 \
  -e appid=f7af****ebb \
  unicom:latest
```

### 注意
#### cron中`%`号需要转义`\%`

### 脚本运行机制
任务并非在一次命令执行时全部执行完毕，任务创建时会根据某个时间段，将所有任务分配到该时间段内的随机的某个时间点，然后使用定时任务定时运行脚本入口，内部子任务的运行时机依赖于任务配置项的运行时间及延迟时间，这种机制意味着，只有当脚本的运行时间在当前定时任务运行时间之前，脚本子任务才有可能有选择的被调度出来运行

### crontab 任务示例
在4-23小时之间每隔三十分钟尝试运行可运行的脚本子任务
```txt
*/30 4-23 * * * /bin/node /AutoSignMachine/index.js unicom --user 1******5 --password 7****** --appid 1************9
```

### 多用户配置

```sh
#创建2个映射目录，log存放日志，记得清理日志哦，crontabs存放计划任务，echo命令第一条只执行一个，第二条有多少个用户，就配置多少条，时间可以自定义

mkdir /{log,crontabs}
echo "0 0-23/6 * * *       rm -rf /root/.AutoSignMachine/taskFile_unicom_*" >>/crontabs/root
echo "10 9-17/2 * * *       node /AutoSignMachine/index.js unicom --user 1******5 --password 7****** --appid 1************9 >/var/log/1******5log.\$(date +%F-%T)" >>/crontabs/root

docker run \
  --name unicom \
  -itd \
  -v /log:/var/log \
  -v /crontabs:/var/spool/cron/crontabs \
  unicom:latest
```

### 运行测试
```sh
## 立即模式, 一次性执行所有任务，仅建议测试任务是否正常时运行，该方式无法重试周期任务
## 该模式不缓存cookie信息，频繁使用将可能导致账号安全警告
#增加 --tryrun

## 指定任务模式，可以指定仅需要运行的子任务，多用户使用规则参看`多用户配置`
#增加 --tasks taskName1,taskName2,taskName3
```

### 赞赏码(整理不易，请赏杯茶水费)
<div align=center><img width="250" height="250" src="https://itwhs.github.io/img/reward/wechat.png" src="https://itwhs.github.io/img/reward/alipay.jpg"/></div>
<div align=center><img width="250" height="250" src="https://itwhs.github.io/img/reward/alipay.jpg"/></div>
