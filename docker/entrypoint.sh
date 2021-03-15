#!/bin/sh
if [ ${enable_unicom} ];then
  echo "10 9-17 * * *       node /AutoSignMachine/index.js unicom --cookies ${cookies} --user ${user} --password ${password} --appid ${appid} >/var/log/${user}log.\$(date +%F-%T)" >> /var/spool/cron/crontabs/root
  echo "0 9-17/2 * * *       rm -rf /root/.AutoSignMachine/taskFile_unicom_*" >> /var/spool/cron/crontabs/root
fi

/usr/sbin/crond -S -c /var/spool/cron/crontabs -f -L /dev/stdout
