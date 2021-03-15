FROM alpine:latest

COPY . /AutoSignMachine/

WORKDIR /AutoSignMachine/

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
&& apk add --no-cache tzdata nodejs npm \
&& ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
&& cp docker/entrypoint.sh /entrypoint.sh \
&& chmod +x /entrypoint.sh \
&& npm install --registry https://registry.npm.taobao.org

ENTRYPOINT /entrypoint.sh