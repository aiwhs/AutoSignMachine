const { encrypt, decrypt } = require('./downapp/downappCryptoUtil')
const crypto = require('crypto');
const jce = require('./downapp/jce')
const zlib = require('zlib')
const path = require('path')
const fs = require('fs-extra')

// let sharkSend = {
//     jD: 0, //isRsa
//     jE: '',//isGuid
//     jG: '',//isFP,
//     jF: false, // isHello
// }

function retCode(retCode) {
    let finalRetCode = retCode
    if (retCode > 0) {
        finalRetCode = Math.abs(-900000000) + retCode;
    } else {
        finalRetCode = -900000000 + retCode;
    }
    return finalRetCode
}
let publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDb49jFnNqMDLdl87UtY5jOMqqdMuvQg65Zuva3Qm1tORQGBuM04u7fqygA64XbOx9e/KPNkDNDmqS8SlsAPL1fV2lqM/phgV0NY62TJqSR+PLngwJd2rhYR8wQ1N0JE+R59a5c08EGsd6axStjHsVu2+evCf/SWU9Y/oQpEtOjGwIDAQAB
-----END PUBLIC KEY-----`
const rsapublicKeyEncode = function (data, publicKey) {
    let crypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, Buffer.from(data));
    return crypted;
};
function randomString(len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

let cg = {
    dO: 0, // int
    fm: 1,// int
    fn: 2, // int
    fq: 3, // int
    fr: 4, // int
    fo: 5, // byte[]
    fD: 6, // cf
    ft: 7, // int
    un1: 8, // byte[]
    un2: 9, // int
}


let byStruct = {
    dO: 0, // int cmdid
    fm: 1, // int seqNo
    fn: 2, // int
    fo: 3, // byte[]
    fp: 4, // long
    fq: 5, // int
    fr: 6, // int
    fs: 7, // bx
    ft: 8 // int
}

var aTMSConfig = {
    version: "2.0.0",
    ProductId: 13,
    a: '5253DC305AE12C0B',
    b: 6020,
    c: 222222,
    d: 'mazu.3g.qq.com',
    isUseIPList: true,
    e: "Tcc-1.0.1",
    DeviceId1: '', // Imei
    DeviceId2: '',
    DeviceId3: '',
    f: '',
    isAllowImei: true,
    isAllowMac: true,
    isAllowImsi: true,
    isAllowAndroidID: true,
    isAllowOther: true,
    isJavaTCC: true,
    isCheckLicence: false,
}
var dailyDownloadApp = {
    rsaKey: {},
    decryptsk_v: () => {
        // /DCIM/.tmfs/sk_v.dat
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/sk_v.dat'))
        let key = Buffer.from(buf.toString().replace(/\n/ig, ''), 'base64')
        // let b1 = new Uint8Array(decrypt(key));
        // let result = iconvLite.decode(Buffer.from(b1, 'hex'), 'gbk');
        let result = Buffer.from(decrypt(key)).toString()
        console.log(result)
        return result
    },
    decryptSK: () => {
        // /data/data/<package name>/shared_prefs/sk.xml
        let key_rsa = "" // 开发时使用的key_rsa
        let key = Buffer.from(key_rsa.replace(/\n/ig, ''), 'base64')
        let decodeStr = Buffer.from(decrypt(key)).toString()
        console.log(decodeStr)

        let splitIndex = decodeStr.indexOf("|")

        let rsaKey = {
            im: decodeStr.substring(0, splitIndex),  // randomEncodeKey
            il: decodeStr.substring(splitIndex + 1) // sessionId
        }
        console.log('use dev?', rsaKey)

        return (rsaKey.im && rsaKey.il) ? rsaKey : dailyDownloadApp.rsaKey
    },
    decrypt40805: () => {
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/40805.dat'))
        let version = buf.readInt32LE()
        console.log('mVersion', version)
        let aTimestamp = buf.slice(4).readInt32LE()
        console.log('mCreateTime', aTimestamp)
        let checksum = buf.slice(8, 24).toString('hex')
        let filemd5 = crypto.createHash("md5").update(buf.slice(24)).digest("hex")
        console.log('filemd5', filemd5)
        console.log('checksum', checksum)
        if (checksum === filemd5) {
            console.log('MD5校验成功')
        } else {
            console.error('MD5校验失败')
            return
        }
        let decypted = decrypt(buf.slice(24))
        let decoded = jce.decode(Buffer.from(decypted))
        let QQPIMCommList = decoded['0']['40805']['QQPIM.CommList']
        let s = jce.decode(QQPIMCommList)
        let s1 = jce.decode(s['0'])
        let s2 = jce.decode(s1['0'][0], {
            data1: 0, // package_name
            data2: 1, // id
            data3: 2, // task_info
            data4: 3, // task_info
            data5: 4, // task_info
            data6: 5, // task_info
            data7: 6, // unk
            data8: 7 // unk
        })
        console.log(s2)
    },
    encryptCompData: (cmdId, compData, rsaKey, clientSashimi) => {
        let clientData = dailyDownloadApp.concat(cmdId, compData)
        console.log('encrypt flag', (clientSashimi.ft & 2))
        if ((clientSashimi.ft & 2) == 0) {
            console.log('encrypt data', rsaKey.im)
            console.log('clientData raw', Buffer.from(clientData).length, Buffer.from(clientData).toString('hex'))
            clientData = Buffer.from(encrypt(clientData, rsaKey.im))
            console.log('clientData enc', Buffer.from(clientData).length, Buffer.from(clientData).toString('hex'))
        }
        return clientData
    },
    tryCompData: (jceBytes, cmdId, clientSashimi, rsaKey) => {
        let compData = jceBytes;
        if (jceBytes != null) {
            try {
                console.log('jceBytes length', jceBytes.length)
                if (jceBytes.length > 50) {
                    console.log('deflate data')
                    console.log('compressed raw', compData.length, Buffer.from(compData).toString('hex'))
                    compData = zlib.deflateSync(jceBytes);
                    if (clientSashimi != null) {
                        console.log('clientSashimi != null')
                        let oldFlag = clientSashimi.ft;
                        if (compData == null || compData.length >= jceBytes.length) {
                            let compLen = compData == null ? -1 : compData.length;
                            compData = jceBytes;
                            clientSashimi.ft |= 1;
                            console.log("ConverterUtil", "[shark_compress]donnot compress, length: " + jceBytes.length + " (if compress)|-> " + compLen + " cmdId: " + cmdId + " flag: " + oldFlag + " -> " + clientSashimi.ft);
                        } else {
                            clientSashimi.ft &= -2;
                            console.log('compressed data', compData.length, Buffer.from(compData).toString('hex'))
                            console.log("ConverterUtil", "[shark_compress]compressed, length: " + jceBytes.length + " -> " + compData.length + " cmdId: " + cmdId + " flag: " + oldFlag + " -> " + clientSashimi.ft);
                        }
                    }
                    return {
                        clientData: dailyDownloadApp.encryptCompData(cmdId, compData, rsaKey, clientSashimi),
                        clientSashimi
                    };
                }
            } catch (err) {
                return null;
            }
        }
        if (clientSashimi != null) {
            let oldFlag2 = clientSashimi.ft;
            clientSashimi.ft |= 1;
            console.log("ConverterUtil", "[shark_compress]without compress, length: " + (jceBytes != null ? "" + jceBytes.length : "null") + " cmdId: " + cmdId + " flag: " + oldFlag2 + " -> " + clientSashimi.ft);
        }

        return {
            clientData: dailyDownloadApp.encryptCompData(cmdId, compData, rsaKey, clientSashimi),
            clientSashimi
        }
    },
    concat: (cmdId, compData) => {
        let buf = Buffer.from('')
        if (cmdId) {
            buf = Buffer.alloc(4)
            buf.writeInt32BE(cmdId)
            console.log('cmdId', cmdId, Buffer.from(buf).toString('hex'))
        }
        if (compData) {
            buf = Buffer.concat([buf, Buffer.from(compData)])
        }
        return buf
    },
    buildCsRegist: () => {
        let btStruct = {
            at: 0,
            dT: 1,
            dU: 2,
            dV: 3,
            dW: 4,
            dX: 5,
            cv: 6,
            cw: 7,
            cx: 8,
            dY: 9,
            dZ: 10,
            ea: 11,
            eb: 12,
            ec: 13,
            ed: 14,
            ee: 15,
            ef: 16,
            eg: 17,
            eh: 18,
            ei: 19,
            ej: 20,
            ek: 21,
            el: 22,
            em: 23,
            en: 24,
            eo: 25,
            ep: 26,
            eq: 27,
            er: 28,
            es: 29,
            et: 30,
            eu: 31,
            ev: 32,
            ew: 33,
            ex: 34,
            ey: 35,
            ez: 36,
            eA: 37,
            eB: 38,
            eC: 39,
            eD: 40,
            version: 41,
            eE: 42,
            eF: 43,
            eG: 44,
            eH: 45,
            eI: 46,
            eJ: 47,
            eK: 48,
            eL: 49,
            eM: 50,
            eN: 51,
            eO: 52,
            eP: 53,
            eQ: 54,
            eR: 55,
            eS: 56,
            eT: 57,
            eU: 58,
            eV: 59,
            eW: 60,
            eX: 61,
            eY: 62,
            eZ: 63,
            fa: 64,
            fb: 65,
            fc: 66
        }
        let btParam = {}

        console.log('CsRegist', btParam)
        return jce.encode(btParam, btStruct)
    },
    buildReqRSA: () => {
        let reqRsaStruct = {
            dR: 0 // byte[0]=0
        }
        let randomEncodeKey = randomString(16); // "DFG#$%^#%$RGHR(&*M<><"//
        let rsaKey = {}
        let reqRsaParam = {}
        let sessionId = ''
        if (dailyDownloadApp.rsaKey.il && dailyDownloadApp.rsaKey.im) {
            randomEncodeKey = dailyDownloadApp.rsaKey.im
            sessionId = dailyDownloadApp.rsaKey.il
        }
        let prikey = rsapublicKeyEncode(randomEncodeKey, publicKey)
        reqRsaParam = {
            dR: prikey
        }
        console.log('randomEncodeKey', randomEncodeKey)
        console.log('sessionId', sessionId)
        console.log('prikey', prikey.toString('hex'))
        rsaKey = {
            im: randomEncodeKey,  // randomEncodeKey
            il: sessionId // sessionId
        }
        return {
            rsaKey,
            reqRSA: jce.encode(reqRsaParam, reqRsaStruct)
        }
    },
    buildReqSashimi: (byParam, data, rsaKey) => {
        console.log('data raw', data.length, Buffer.from(data).toString('hex'))
        let byStruct = {
            dO: 0, // int cmdid
            fm: 1, // int seqNo
            fn: 2, // int
            fo: 3, // byte[]
            fp: 4, // long
            fq: 5, // int
            fr: 6, // int
            fs: 7, // bx
            ft: 8 // int
        }

        // let byParam = {
        //     dO: cmdid,
        //     fm: seqNo,
        //     // fn: undefined,
        //     fo: undefined,
        //     // fp: 4294967296,
        //     ft: 0
        // }

        let { clientData, clientSashimi } = dailyDownloadApp.tryCompData(data, byParam.dO, byParam, rsaKey)
        console.log('ReqSashimi', {
            ...clientSashimi,
            fo: clientData
        })
        return jce.encodeNested({
            ...clientSashimi,
            fo: clientData
        }, byStruct)
    },
    buildBjParam: (adConf, seesionId) => {
        // bj
        let bjStruct = {
            cJ: 0, // apn  sharkfin.apn
            cX: 1, // sharkfin.authType
            as: 2, // sharkfin.guid
            cY: 3, // pid string  sharkfin.ext1
            cZ: 4, // sessionId
            cw: 5, // task config b()  sharkfin.buildno
            da: 6, // sharkfin.netType
            db: 7, // sharkfin.accountId
            dc: 8, // sharkfin.bootType
            dd: 9 // sharkfin.wsGuid
        }

        let sharkfinParam = {
            cJ: 1,
            cX: 0,
            as: adConf.guid,
            cY: 'b26527',
            // cZ: undefined,
            cw: 6015,
            da: 1,
            db: -1,
            dc: -1,
            // dd: null
        }
        if (seesionId) {
            sharkfinParam.cZ = seesionId
        }

        console.log('sharkfinParam', sharkfinParam)
        return jce.encodeNested(sharkfinParam, bjStruct)
    },
    buildReqSharkParam: (seqNo, bj, encoded_by) => {
        let reqSharkStruct = {
            fm: 0,// int seqNoTag
            fn: 1,// int
            fw: 2,// int
            fx: 3, // bj,
            fy: 4 // array by
        }
        let reqSharkParam = {
            fm: seqNo, // seqNo
            fw: 4, // 固定为4
            fx: bj,
            fy: [encoded_by]
        }
        console.log('reqSharkParam', reqSharkParam)
        let reqSharkEncoded = jce.encode(reqSharkParam, reqSharkStruct)
        // fs.writeFileSync(path.join(__dirname, 'downapp/1-1.bin'), Buffer.from(reqSharkEncoded))
        return reqSharkEncoded
    },
    doPost: async (axios, reqShark) => {
        // mazu.3g.qq.com
        // 163.177.92.29
        let res = await axios.request({
            url: 'http://163.177.92.27',
            headers: {
                'Content-Type': ' application/octet-stream',
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 6.0.1; VKY_AL00 Build/V417IR)'
            },
            method: 'post',
            responseType: 'arraybuffer',
            data: reqShark
        })
        console.log(res.data.length, Buffer.from(res.data).toString('hex'))
        return res.data
    },
    // Rsa更新
    updateRsaKey: async (axios) => {
        let { rsaKey, reqRSA } = dailyDownloadApp.buildReqRSA()
        let adConf = {
            guid: '03021321010411160500055376653281'
        }
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 152,
            fm: 15,
            fo: undefined,
            ft: 0 | 2
        }, reqRSA, rsaKey)
        let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
        let reqShark = dailyDownloadApp.buildReqSharkParam(12, bj, reqSashimi)
        // dailyDownloadApp.decodeClientData(reqShark, rsaKey)
        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
        // console.log(Buffer.from(tt))
        tt = jce.decode(Buffer.from(tt))
        dailyDownloadApp.rsaKey.im = rsaKey.im
        dailyDownloadApp.rsaKey.il = tt['0']
        console.log('updateRsaKey', dailyDownloadApp.rsaKey)
    },
    // 处理数据
    decryptData: (s2, rsaKey) => {
        let decryData = new Int8Array(s2.fo);
        console.log('decrypt flag', (s2.ft & 2))
        if ((s2.ft & 2) == 0) {
            console.log('decrypt data', rsaKey.im)
            console.log('decryData raw', Buffer.from(decryData).length, Buffer.from(decryData).toString('hex'))
            decryData = decrypt(decryData, rsaKey.im)
            console.log('decryData dec', Buffer.from(decryData).length, Buffer.from(decryData).toString('hex'))
        } else {
            decryData = decryData
        }
        let decmpData = null
        console.log('decryData length', decryData.length)
        if (decryData.length >= 4) {

            // 0-4 headbyte
            console.log('jce bytes count', decryData.length - 4)
            let jceCmpData = decryData.slice(4)

            if (jceCmpData != null && jceCmpData.length > 0) {
                if ((s2.ft & 1) == 0) {
                    console.log('inflate data')
                    console.log('uncompressed raw', jceCmpData.length, Buffer.from(jceCmpData).toString('hex'))
                    decmpData = zlib.inflateSync(jceCmpData);
                    console.log('uncompressed data', decmpData.length, Buffer.from(decmpData).toString('hex'))
                } else {
                    decmpData = jceCmpData;
                }
                if (decmpData == null) {
                    console.log("ConverterUtil", "[shark_v4]dataForReceive2JceBytes(), decompress failed!");
                }
            }
        }
        return decmpData
    },
    // 解码发送数据
    decodeClientData: (buf, rsaKey) => {
        console.log('ClientData length', buf.length)
        let s = jce.decode(buf)
        console.log(s)
        // if ('0' in s) {
        //     let k = jce.decode(s['0'])
        //     console.log(k)
        //     let k1 = jce.decode(k['3'])
        //     console.log(k1)

        //     let decmpData_arr = []
        //     if ('4' in k) {
        //         k['4'].map(i => {
        //             let s2 = jce.decode(i, byStruct)
        //             console.log('s2', s2)
        //             let decmpData = dailyDownloadApp.decryptData(s2, rsaKey)
        //             console.log('decmpData length', decmpData.length)
        //             if (decmpData) {
        //                 console.log('decmpData', decmpData.length, Buffer.from(decmpData).toString('hex'))
        //                 decmpData_arr.push(decmpData)
        //             }
        //         })
        //     }
        //     let h = jce.decode(decmpData_arr[0])
        //     console.log(h)
        //     let h1 = jce.decode(h['0'])
        //     console.log(h1)
        //     let h2 = jce.decode(h['1'][0])
        //     console.log(h2)
        // }
        // if ('2' in s) {
        //     s['2'].map(i => {
        //         let k = jce.decode(i)
        //         console.log(k)
        //         let k1 = jce.decode(k['5'])
        //         console.log(k1)
        //         console.log('k1k1', k1['23'].length, Buffer.from(k1['23']).toString('base64'))
        //     })
        // }
        if ('3' in s) {
            let s1 = jce.decode(s['3'])
            console.log(s1)
        }
        let decmpData_arr = []
        if ('4' in s) {
            s['4'].map(i => {
                let s2 = jce.decode(i, byStruct)
                console.log('s2', s2)
                let decmpData = dailyDownloadApp.decryptData(s2, rsaKey)
                console.log('decmpData length', decmpData.length)
                if (decmpData) {
                    console.log('decmpData', decmpData.length, Buffer.from(decmpData).toString('hex'))
                    decmpData_arr.push(decmpData)
                }
            })
        }

        console.log('decmpData_arr', decmpData_arr)
        return decmpData_arr
    },
    // 解码接收数据
    decodeServerData: (data, rsaKey) => {
        console.log('ServerData length', data.length)
        let r_s = jce.decode(data)// ch
        console.log(r_s)
        let r_s1 = jce.decode(r_s['2'][0], cg)  //cg
        console.log(r_s1)
        let r_s_decmpData = dailyDownloadApp.decryptData(r_s1, rsaKey)
        return r_s_decmpData
    },
    // TODO
    registerGuid: async (axios) => {
        let data = dailyDownloadApp.buildCsRegist()
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 1,
            fm: 2,
            fo: undefined,
            ft: 0
        }, data)
        let bj = dailyDownloadApp.buildBjParam()
        let reqShark = dailyDownloadApp.buildReqSharkParam(1, bj, reqSashimi)
        console.log(reqShark)
        // TODO
    },
    // TODO
    sendFirstPkg: async (axios) => {
        let rsaKey = dailyDownloadApp.decryptSK()
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 997,
            fm: 14,
            fo: undefined,
            ft: 0
        }, null, rsaKey)
        let bj = dailyDownloadApp.buildBjParam()
        let reqShark = dailyDownloadApp.buildReqSharkParam(12, bj, reqSashimi)
        // let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
    },
    buildPStruct(productInfo) {
        // productInfo task
        let pStruct = {
            ae: 0, // int coin_productId
            af: 1, // int coin_version
        }
        // let productInfo = productInfos[0]
        let pParam = {
            ae: productInfo.coin_productId,
            af: productInfo.coin_version
        }
        console.log('pParam', pParam)
        return {
            productInfo,
            pStructEncoded: jce.encodeNested(pParam, pStruct)
        }
    },
    buildUserInfoStruct(user, productInfo, adConf) {
        let { pStructEncoded } = dailyDownloadApp.buildPStruct(productInfo)
        console.log('pStructEncoded', Buffer.from(pStructEncoded.data).toString('hex'))
        let userinfoStruct = {
            ap: 0, // p JceStruct productInfo
            aq: 1, // string  accountId  phone
            ar: 2, // string  loginKey  token
            as: 3, // string  guid
            at: 4, // string
        }
        let userinfoParam = {
            ap: pStructEncoded,
            aq: user.accountId,
            ar: user.loginKey,
            as: adConf.guid,
            at: ''
        }
        console.log('userinfoParam', userinfoParam)
        return {
            productInfo,
            userinfoParam,
            userinfoStructEncoded: jce.encodeNested(userinfoParam, userinfoStruct)
        }
    },
    buildTasksReq(user, productInfo, adConf) {
        let { userinfoStructEncoded } = dailyDownloadApp.buildUserInfoStruct(user, productInfo, adConf)
        console.log('userinfoStructEncoded', Buffer.from(userinfoStructEncoded.data).toString('hex'))
        let tasksReqStruct = {
            S: 0, // v JceStruct
            Z: 1 // array[taskid]
        }
        let tasksReqParam = {
            S: userinfoStructEncoded,
            Z: [productInfo.coin_unkown3]
        }
        console.log('tasksReqParam', tasksReqParam)
        return {
            productInfo,
            tasksReq: jce.encode(tasksReqParam, tasksReqStruct)
        }
    },
    // 领取任务
    getTasksReq: async (axios, options) => {
        const { ecs_token, platId } = options
        let rsaKey = dailyDownloadApp.decryptSK()
        let adConf = {
            guid: '03021321010411160500055376653281'
        }
        let user = {
            accountId: options.user + '',
            loginKey: `${ecs_token}|085`
        }

        let { tasksReq } = dailyDownloadApp.buildTasksReq(user, {
            coin_productId: 8127,
            coin_version: 1,
            coin_unkown3: platId // 812759 // 103
        }, adConf)

        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 5110, // cmdid
            fm: 3,
            fo: undefined,
            ft: 0,
            fp: 4294967296 // 未知固定
        }, tasksReq, rsaKey)
        let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
        let reqShark = dailyDownloadApp.buildReqSharkParam(3, bj, reqSashimi)
        // let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
        let productInfos = []
        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
        if (tt) {
            let s = jce.decode(tt)
            console.log(s)
            let s1 = jce.decode(s['1'][0])
            console.log(s1)
            s1['1'].map(s => {
                let s1 = jce.decode(s)
                console.log(s1)
                let s2 = jce.decode(s1['4'])
                console.log(s2)
                let s3 = jce.decode(s1['8'])
                console.log('decode productInfo', s3)
                productInfos.push(s3)
            })
        }
        return productInfos
    },
    buildTaskOrderData: (productInfo) => {
        let tasks = [{ '0': productInfo.coin_unkown1, '1': productInfo.coin_task_id, '2': productInfo.coin_unkown2, '3': productInfo.coin_unkown3 }]
        let result = []
        for (let task of tasks) {
            let t = jce.encode(task)
            console.log('task raw', t.length, task)
            result.push(t)
        }
        return result
    },
    buildSubmitBatchTaskReq(user, productInfo, adConf) {
        let { userinfoStructEncoded } = dailyDownloadApp.buildUserInfoStruct(user, productInfo, adConf)
        console.log('userinfoStructEncoded', Buffer.from(userinfoStructEncoded.data).toString('hex'))
        let tasksReqStruct = {
            S: 0, // v JceStruct
            Z: 1 // array[taskid]
        }
        let tasksReqParam = {
            S: userinfoStructEncoded,
            Z: dailyDownloadApp.buildTaskOrderData(productInfo) // order_data
        }
        console.log('tasksReqParam', tasksReqParam)
        return {
            tasksReq: jce.encode(tasksReqParam, tasksReqStruct)
        }
    },
    // TODO 未使用
    submitBatchTaskReq: async (axios, options) => {
        const { productInfo, ecs_token } = options
        let rsaKey = dailyDownloadApp.decryptSK()
        let adConf = {
            guid: '03021321010411160500055376653281'
        }
        let account = {
            yhChannel: "GGPD",
            accountChannel: "517050707",
            accountUserName: "517050707",
            accountPassword: "123456",
            accountToken: "4640b530b3f7481bb5821c6871854ce5",
        }
        let user = {
            accountId: `${options.user}`,
            loginKey: `${ecs_token}|085|AC20200624091508|f65cd1e62af1407f88b069c0ffd4e1d8|${productInfo.coin_unkown3}|10.0.2.15|${account.yhChannel}|${account.accountChannel}|${account.accountUserName}|${account.accountPassword}|${account.accountToken}|xxx`
        }
        let { tasksReq } = dailyDownloadApp.buildSubmitBatchTaskReq(user, productInfo, adConf)
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 5112, // cmdid
            fm: 160,
            fo: undefined,
            ft: 0,
            fp: 4294967296 // 未知固定
        }, tasksReq, rsaKey)
        let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
        let reqShark = dailyDownloadApp.buildReqSharkParam(21, bj, reqSashimi)

        let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)

        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
        // if (tt) {
        //     let s = jce.decode(tt)
        //     console.log(s)
        //     let s1 = jce.decode(s['1'][0])
        //     console.log(s1)
        //     s1['1'].map(s => {
        //         let s1 = jce.decode(s)
        //         console.log(s1)
        //         let s2 = jce.decode(s1['4'])
        //         console.log(s2)
        //         let s3 = jce.decode(s1['8'])
        //         console.log(s3)
        //     })
        // }
    },
    buildStructEncoded3: (user, productInfo, adConf) => {
        let c3 = Buffer.from('B38AFQABFgAmCDUzOTAxMTQ1MAFCYDMnxQEBwAYcMTY5MTk0Njg2OTM3OTIxOTQ2NjE2MDYwMDk3MBEDXyAJNgBGQgIAAYkFERPfJgw3THpJR3VLVEdYRDQyQiTW0EkAAgoABxwsMgADDnRAAVxmAAsKAAUcLDIAAw4sQAFcZgALWQxpDFALZgsxMzAwNzE0OTc4NXQ/5DgNgQCWkGakP5MzM7Q8KVhXzNAB4gWM2AX5Dwz2EA05LjE0Ni4xNDcuMTM48hFgMyfF8hIAG3Do9hNQSBqUvaWxiSTRPT59onWYvlfRFoZLiXi4qN0mTZ1KmtoxNrqz3Xbo2WsNEnUoWlvriSM9Fx7lmTMCTb8ZQoh5cv0qlaRnSurHon55H6Yxek78FPwV9hYgMDMwMjEzMjEwMTA0MTExNjA1MDAwNTUzNzY2NTMyODH8F/YYAPwZ9hoCTkHxGwCW9hwCTkH2HR8CAAMOuxEH9CIAAw68MRdxQQCWUQCWcQCWoQCW0QNf+B4M9h8A8CAB8iEDNndZ/CL0Iz8uFHv2JAD2JQD2JgD2JwD2KADwKf/2KgD2KwD2LAD2LQD8Lvwv/DDzMQAAAACzPXbS9jIIMTkwMjM5NzD2MwcxMzkxNzgy/DQGAI0CAAMPvRAELEYMSk5zSmQtS1RHZkRLUAxgC3YAiAyWAKyyYDMnxMkM1T9mbm2hiyBG7PwP/BD2EQD2EjE1MzkwMTE0NV8xNjM4ODQ3MzQyMTgxNjE1NzkxN185NDQ4NDMxOTU5MTA4MDk1MzEy+BMAAQYJdXNlcl90eXBlFgEw9RQAAAAAAAAAAP3/AAw=', 'base64')
        console.log('kkkk 0', c3.length, Buffer.from(c3).toString('base64'))
        jce.decode(c3)
        let a = jce.encodeNested({
            '0': 53901145,
            '1': 93116421,
            '2': '000116083836393537383035',
            '3': c3, // buffer
            '4': 69,
            '5': 0,
            '6': 53901156,
            '7': 0,
            '8': '',
            '9': 102,
            '10': 1
        })
        return {
            structEncoded3: a
        }
    },
    buildStructEncoded2: (user, productInfo, adConf, map) => {
        let { structEncoded3 } = dailyDownloadApp.buildStructEncoded3(user, productInfo, adConf)
        console.log('structEncoded3 b', structEncoded3.data.length, Buffer.from(structEncoded3.data).toString('hex'))
        jce.decode(structEncoded3.data)

        let time = parseInt(new Date().getTime() / 1000)
        let a = jce.encodeNested({
            '0': parseInt(map.RCMD_ENTRY_CONTEXT_KEY_SESSIONID),
            '1': '',
            '2': '',
            '3': 0,
            '4': parseInt(map.DDS_ID),
            '5': `${map.RCMD_ENTRY_CONTEXT_KEY_ITEM_ID}_${map.RCMD_ENTRY_CONTEXT_KEY_PARTNER_ID}`,
            '6': 0,
            // 7  map.RCMD_ENTRY_CONTEXT_KEY_ITEM_EVENT_REPORT_CONTEXT
            '7': `#${map.RCMD_ENTRY_CONTEXT_KEY_ITEM_Type}#${map.RCMD_ENTRY_CONTEXT_KEY_ITEM_ID}#${map.DDS_ID}#${map.RCMD_ENTRY_CONTEXT_KEY_ALGO_MODID}#${map.RCMD_ENTRY_CONTEXT_KEY_SESSIONID}#${map.TARGET_ID}#${map.RCMD_ENTRY_CONTEXT_KEY_SESSIONID}##${time}#${map.RCMD_ENTRY_CONTEXT_KEY_PRICE}#1.047362589#0#${map.RECALL_MODEL_ID},#${map.RCMD_ENTRY_CONTEXT_KEY_CUSTOMIZED_KEY_ID}##:#10004090=${map.RCMD_ENTRY_CONTEXT_KEY_PRICE},#10004090=1.047362589,#TARGET_ID=${map.TARGET_ID},##`,
            '8': '06A2744E4A0EF32DA88355161B12A6AC', // ?sign?
            '9': time,
            '10': parseInt(map.TARGET_ID),
            '11': 'getAppList_33',
            '12': '',
            '13': 54,
            '14': '',
            '15': '',
            '16': 8127
        })
        console.log('structEncoded3 a', a.data.length, Buffer.from(a.data).toString('hex'))
        jce.decode(a.data)

        let c = jce.encodeNested({
            '0': '',
            '1': '',
            '2': '',
            '3': '',
            '4': '',
            '5': '',
            '6': '',
            '7': '',
            '8': ''
        })
        console.log('structEncoded3 c', c.data.length, Buffer.from(c.data).toString('hex'))
        jce.decode(c.data)
        let param = [
            a,
            structEncoded3,
            c
        ]
        console.log('a', Buffer.from(a.data).toString('hex'))
        console.log('b', Buffer.from(structEncoded3.data).toString('hex'))
        console.log('c', Buffer.from(c.data).toString('hex'))
        console.log('param', param)

        return {
            time,
            structEncoded2: jce.encode(param)
        }
    },
    buildStructEncoded1: (user, productInfo, adConf) => {

        let BackendExtendInfo = Buffer.from('CgwWACYAPExWAGx2AO+/vQDvv73vv73vv70NZ2V0QXBwTGlzdF8zM++/vQDvv70277+9AO+/vQ8A77+9EO+/vREBCxoMHCYYMDAwMTE2MDgzOTMyMzUzNzMyMzIzNTM2PQABAmwHfwAVAAEWACYINTM5MDExNDUwAUJgMyfvv70BAe+/vQYcMTY5MTk0Njg2OTM3OTIxOTQ2NjE2MDYwMDk3MBEDXyAJNgBGQgIAAe+/vQURE++/vSYMN0x6SUd1S1RHWEQ0MkIk77+977+9SQACCgAHHCwyAAMOdEABXGYACwoABRwsMgADDixAAVxmAAtZDGkMUAtmCzEzMDA3MTQ5Nzg1dD/vv704De+/vQDvv73vv71m77+9P++/vTMz77+9PClYV++/ve+/vQHvv70F77+977+9Be+/vQ8M77+9EA05LjE0Ni4xNDcuMTM477+9EWAzJ++/ve+/vRIAG3Dvv73vv70TUEga77+977+977+977+977+9JO+/vT0+fe+/vXXvv73vv71X77+9Fu+/vUvvv71477+977+977+9Jk3vv71K77+977+9MTbvv73vv73vv71277+977+9aw0SdShaW++/vSM9Fx7vv70zAk3vv70ZQu+/vXly77+9Ku+/ve+/vWdK77+9x6J+eR/vv70xek7vv70U77+9Fe+/vRYgMDMwMjEzMjEwMTA0MTExNjA1MDAwNTUzNzY2NTMyODHvv70X77+9GADvv70Z77+9GgJOQe+/vRsA77+977+9HAJOQe+/vR0fAgADDu+/vREH77+9IgADDu+/vTEXcUEA77+9UQDvv71xAO+/ve+/vQDvv73vv70DX++/vR4M77+9HwDvv70gAe+/vSEDNndZ77+9Iu+/vSM/LhR777+9JADvv70lAO+/vSYA77+9JwDvv70oAO+/vSnvv73vv70qAO+/vSsA77+9LADvv70tAO+/vS7vv70v77+9MO+/vTEAAAAA77+9PXbvv73vv70yCDE5MDIzOTcw77+9MwcxMzkxNzgy77+9NAYA77+9AgADD++/vRAELEYMSk5zSmQtS1RHZkRLUAxgC3YA77+9DO+/vQDvv73vv71gMyfvv73vv70M77+9P2Zube+/ve+/vSBG77+977+9D++/vRDvv70RAO+/vRIxNTM5MDExNDVfMTYzODg0NzM0MjE4MTYxNTc5MTdfOTQ0ODQzMTk1OTEwODA5NTMxMu+/vRMAAQYJdXNlcl90eXBlFgEw77+9FAAAAAAAAAAA77+977+9AAxMXGIDNndkfO+/vQDvv71m77+9AQsqBgAWACYANgBGAFYAZgB2AO+/vQAL', 'base64')
        console.log('BackendExtendInfo', (BackendExtendInfo + '').length, Buffer.from(BackendExtendInfo + '').toString('base64'))

        let map = {
            'BackendExtendInfo': BackendExtendInfo + '',
            DDS_ID: '9950243502',
            ERP_COMM_CUSTOM_CHANNEL: 'ChinaUnicom',
            RCMD_CONTEXT_KEY_SW_COLLECTION_TAG_ID: '0',
            RCMD_CONTEXT_KEY_SW_COLLECTION_TAG_NAME: '',
            RCMD_CONTEXT_KEY_SW_COLLECTION_TITLE: '',
            RCMD_ENTRY_CONTEXT_KEY_ALGO_MODID: '995024355',
            RCMD_ENTRY_CONTEXT_KEY_CUSTOMIZED_KEY_ID: '863',
            RCMD_ENTRY_CONTEXT_KEY_DDSID: '9950243502',
            RCMD_ENTRY_CONTEXT_KEY_ITEM_EVENT_REPORT_CONTEXT: '#2#com.ximalaya.ting.lite#9950243502#995024355#1187883726#99502435#1187883726##1613965252#1.02#0.29778733#0#390001008,#863##:#10004090=1.02,#10004090=0.29778733,#TARGET_ID=99502435,##',
            RCMD_ENTRY_CONTEXT_KEY_ITEM_ID: 'com.ximalaya.ting.lite',
            RCMD_ENTRY_CONTEXT_KEY_ITEM_Type: '2',
            RCMD_ENTRY_CONTEXT_KEY_PARTNER_ID: '54',
            RCMD_ENTRY_CONTEXT_KEY_PRICE: '1.02',
            RCMD_ENTRY_CONTEXT_KEY_RATING: '26214.4',
            RCMD_ENTRY_CONTEXT_KEY_SESSIONID: '1187883726',
            RCMD_ENTRY_CONTEXT_KEY_SW_COLLECTION_ENTRY_RELATED_SEARCH_KEYWORD: '',
            RCMD_ENTRY_CONTEXT_KEY_SW_COLLECTION_ENTRY_RELATED_SEARCH_NUM: '0',
            RECALL_MODEL_ID: '390001008,',
            RECALL_MODEL_INDEX: '6,',
            RECALL_SCORE: '994',
            TARGET_ID: '99502435',
            YYBAdId: '863',
            subProductIdStr: '8127'
        }

        let { structEncoded2, time } = dailyDownloadApp.buildStructEncoded2(user, productInfo, adConf, map)
        console.log(jce.decode(structEncoded2))
        console.log('structEncoded2 h', structEncoded2.length, Buffer.from(structEncoded2).toString('hex'))

        let struct = {
            a: 0, // int
            b: 1, // int
            c: 2, // int
            d: 3, // string
            e: 4, // string
            f: 5, // int
            g: 6, // buffer
            h: 7, // buffer
            i: 8, // int
            j: 9, // int
            k: 10, //int
            l: 11, // int
            m: 12, //int 
            n: 13, // string
            o: 14,  // string
            p: 15, // object
            q: 16, // int
            r: 17, // int
            s: 18, // buffer
        }

        let param = {
            a: parseInt(map.DDS_ID), // int
            b: parseInt(map.RCMD_ENTRY_CONTEXT_KEY_SESSIONID), // int
            c: 0, // int
            d: '', // string
            e: '', // string
            f: 0, // int
            g: jce.encode([]), // buffer
            h: structEncoded2, // buffer
            i: 0, // int
            j: 1, // int
            k: 0, //int
            l: 1, // int
            m: 0, //int 
            n: '', // string
            o: '',  // string
            p: map, // object
            q: time, // int time ?
            r: 0, // int
            s: jce.encode([]) // buffer
        }

        console.log('param', param)
        jce.setEncoding('latin1')
        return {
            map,
            structEncoded1: jce.encode(param, struct)
        }
    },
    buildStructEncoded: (user, productInfo, adConf) => {
        let { structEncoded1, map } = dailyDownloadApp.buildStructEncoded1(user, productInfo, adConf)
        console.log('structEncoded1 b', structEncoded1.length, Buffer.from(structEncoded1).toString('hex'))
        jce.setEncoding('utf-8')
        jce.decode(structEncoded1)
        let struct = {
            a: 0, // int
            b: 1, // struct
            c: 2, // int
            d: 3, // int
            e: 4, // int
            f: 5 // int
        }
        let param = {
            a: 8,
            b: structEncoded1,
            c: parseInt(map.TARGET_ID),
            d: 1613993354, // time
            e: 0,
            f: 0
        }
        console.log('param', param)
        return {
            structEncoded: jce.encodeNested(param, struct)
        }
    },
    buildActiveAppReqReq: (user, productInfo, adConf) => {
        let { structEncoded } = dailyDownloadApp.buildStructEncoded(user, productInfo, adConf)
        console.log(`fo 0`, structEncoded.data.length, Buffer.from(structEncoded.data).toString('hex'))
        jce.decode(structEncoded.data)
        let activeReqParam = [
            [structEncoded]
        ]
        console.log('activeReqParam', activeReqParam)
        return {
            activeAppReq: jce.encode(activeReqParam)
        }
    },
    // TODO 不使用
    submitActiveAppReq: async (axios, options) => {
        // const { productInfo, ecs_token } = options
        let rsaKey = dailyDownloadApp.decryptSK()
        let adConf = {
            guid: '03021321010411160500055376653281'
        }
        // let account = {
        //     yhChannel: "GGPD",
        //     accountChannel: "517050707",
        //     accountUserName: "517050707",
        //     accountPassword: "123456",
        //     accountToken: "4640b530b3f7481bb5821c6871854ce5",
        // }
        // let user = {
        //     accountId: `${options.user}`,
        //     loginKey: `${ecs_token}|085|AC20200624091508|f65cd1e62af1407f88b069c0ffd4e1d8|${productInfo.coin_unkown3}|10.0.2.15|${account.yhChannel}|${account.accountChannel}|${account.accountUserName}|${account.accountPassword}|${account.accountToken}|xxx`
        // }
        let { activeAppReq } = dailyDownloadApp.buildActiveAppReqReq({}, {}, adConf)
        console.log(jce.decode(activeAppReq))
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 4003,
            fm: 136,
            fo: undefined,
            ft: 0,
            fp: 4294967296
        }, activeAppReq, rsaKey)
        let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
        let reqShark = dailyDownloadApp.buildReqSharkParam(134, bj, reqSashimi)

        let fo = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
        console.log(tt)
    },
    buildSubmitTaskReq: (user, productInfo, adConf) => {
        let { userinfoStructEncoded } = dailyDownloadApp.buildUserInfoStruct(user, productInfo, adConf)
        console.log('userinfoStructEncoded', Buffer.from(userinfoStructEncoded.data).toString('hex'))
        let tasksReqStruct = {
            S: 0, // v JceStruct
            Z: 1 // array[taskid]
        }
        let tasksReqParam = {
            S: userinfoStructEncoded,
            Z: dailyDownloadApp.buildTaskOrderData(productInfo) // order_data
        }
        console.log('tasksReqParam', tasksReqParam)

        return {
            tasksReq: jce.encode(tasksReqParam, tasksReqStruct)
        }
    },
    submitTaskReq: async (axios, options) => {
        const { productInfo, ecs_token, activity } = options
        let rsaKey = dailyDownloadApp.decryptSK()
        let adConf = {
            guid: '03021321010411160500055376653281'
        }
        let account = {
            yhChannel: "GGPD",
            accountChannel: "517050707",
            accountUserName: "517050707",
            accountPassword: "123456",
            accountToken: "4640b530b3f7481bb5821c6871854ce5",
        }
        let user = {
            accountId: `${options.user}`,
            loginKey: `${ecs_token}|085|${activity.activityId}|${activity.taskId}|${productInfo.coin_unkown3}|10.0.2.15|${account.yhChannel}|${account.accountChannel}|${account.accountUserName}|${account.accountPassword}|${account.accountToken}|${activity.unk}`
        }
        let { tasksReq } = dailyDownloadApp.buildSubmitTaskReq(user, productInfo, adConf)
        let reqSashimi = dailyDownloadApp.buildReqSashimi({
            dO: 5112,
            fm: 22,
            fo: undefined,
            ft: 0,
            fp: 4294967296
        }, tasksReq, rsaKey)
        let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
        let reqShark = dailyDownloadApp.buildReqSharkParam(158, bj, reqSashimi)
        // let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
        let result = await dailyDownloadApp.doPost(axios, reqShark)
        let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
        let t = jce.decode(Buffer.from(tt))
        let d = jce.decode(t['1'][0])
        console.info('下载任务ID已请求领取结束', d['0'])
    },
    cmd4003: () => {
        // cmdid 4003
        let rsaKey = dailyDownloadApp.decryptSK()
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/3.bin')) // 6.bin
        let fo = dailyDownloadApp.decodeClientData(buf, rsaKey)
        console.log('fo.length', fo.length)
        fo.map((i, k) => {
            console.log(`fo ${k}`, i.length, Buffer.from(i).toString('hex'))
            let s = jce.decode(i)
            console.log(s)
            console.log(jce.decode(s['0']))
            s['0'].map(j => {
                let s1 = jce.decode(j)
                console.log(s1)
                console.log(`structEncoded1 b`, s1['1'].length, Buffer.from(s1['1']).toString('hex'))
                let s2 = jce.decode(s1['1'])
                console.log(s2)
                console.log('BackendExtendInfo', s2['15']['BackendExtendInfo'].length, Buffer.from(s2['15']['BackendExtendInfo']).toString('base64'))
                console.log('structEncoded2 h', s2['7'].length, Buffer.from(s2['7']).toString('hex'))
                let s3 = jce.decode(s2['7'])
                console.log('s3', s3)
                console.log('structEncoded3 a', s3['0'].length, Buffer.from(s3['0']).toString('hex'))
                console.log('structEncoded3 b', s3['1'].length, Buffer.from(s3['1']).toString('hex'))
                console.log('structEncoded3 c', s3['2'].length, Buffer.from(s3['2']).toString('hex'))
                let s4 = jce.decode(s3['0'])
                console.log('structEncoded3 a d', s4)
                let s5 = jce.decode(s3['1'])
                console.log('structEncoded3 b d', s5)
                console.log('kkkk 0', s5['3'].length, Buffer.from(s5['3']).toString('base64'))
                let s51 = jce.decode(s5['3'])
                console.log(s51)
                let s6 = jce.decode(s3['2'])
                console.log('structEncoded3 c d', s6)
            })
        })

    },
    cmd4004: () => {
        let rsaKey = dailyDownloadApp.decryptSK()
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/5.bin'))
        let fo = dailyDownloadApp.decodeClientData(buf, rsaKey)
        console.log('fo.length', fo.length)
        fo.map(i => {
            let s = jce.decode(i)
            console.log(s)
            s['0'].map(j => {
                console.log(Buffer.from(j).toString())
            })
        })
    },
    cmd5112: () => {
        let rsaKey = dailyDownloadApp.decryptSK()
        //submitBatchTaskReq
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/c-2-2.bin'))
        let fo = dailyDownloadApp.decodeClientData(buf, rsaKey)
        console.log('fo.length', fo.length)
        fo.map(i => {
            let s = jce.decode(i)
            console.log(s)
            let s1 = jce.decode(s['0'])
            console.log(s1)
            let s2 = jce.decode(s1['0'])
            console.log(s2)
            s['1'].map(j => {
                let s1 = jce.decode(j)
                console.log(s1)
            })
        })
    },
    cmd5110_103: () => {
        // 103
        let rsaKey = dailyDownloadApp.decryptSK()
        let buf = fs.readFileSync(path.join(__dirname, 'downapp/13.bin'))
        let fo = dailyDownloadApp.decodeClientData(buf, rsaKey)
        console.log('fo.length', fo.length)
        fo.map(i => {
            let s = jce.decode(i)
            console.log(s)
            let s1 = jce.decode(s['0'])
            console.log(s1)
            let s2 = jce.decode(s1['0'])
            console.log(s2)
            s['1'].map(j => {
                let s1 = jce.decode(j)
                console.log(s1)
            })
        })

        // let buf = fs.readFileSync(path.join(__dirname, 'downapp/13-r.bin'))
        // let fo = dailyDownloadApp.decodeServerData(buf, rsaKey)
        // console.log('fo.length', fo.length)
        // let s = jce.decode(fo)
        // console.log(s)
        // s['1'].map(j => {
        //     let s = jce.decode(j)
        //     console.log(s)
        //     s['1'].map(k => {
        //         let s1 = jce.decode(k)
        //         console.log(s1)
        //         let s2 = jce.decode(s1['4'])
        //         console.log(s2)
        //         let s3 = jce.decode(s1['8'])
        //         console.log(s3)
        //     })
        // })
    },
    /**
     *  5次app任务
     * @param {*} axios 
     * @param {*} options 
     */
    doFiveTask: async (axios, options) => {
        const { ecs_token } = options
        console.log('开始 5次app任务')
        let productInfos = await dailyDownloadApp.getTasksReq(axios, {
            ...options,
            ecs_token,
            platId: 103
        })  // cmdid 5110
        let activity = {
            activityId: 'AC20200730144559',
            taskId: '1905b05581004ecf984150f95bd25e4e',
            unk: '946'
        }
        for (let productInfo of productInfos) {
            console.log('productInfo', productInfo)
            await dailyDownloadApp.submitTaskReq(axios, {
                ...options,
                ecs_token,
                activity,
                productInfo: {
                    coin_productId: 8127,
                    coin_version: 1,
                    coin_unkown1: productInfo['0'],
                    coin_task_id: productInfo['1'],
                    coin_unkown2: productInfo['2'],
                    coin_unkown3: productInfo['3'],
                }
            }) // cmdid 5112
            await new Promise((resolve, reject) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000))
        }

        console.reward('integral', 50)
    },
    /**
     *  3次app任务
     * @param {*} axios 
     * @param {*} options 
     */
    doThreeTask: async (axios, options) => {
        const { ecs_token } = options
        console.log('开始 3次app任务')
        let productInfos = await dailyDownloadApp.getTasksReq(axios, {
            ...options,
            ecs_token,
            platId: 812759
        })  // cmdid 5110
        let activity = {
            activityId: 'AC20200624091508',
            taskId: 'f65cd1e62af1407f88b069c0ffd4e1d8',
            unk: 'xxx'
        }
        for (let productInfo of productInfos) {
            console.log('productInfo', productInfo)
            await dailyDownloadApp.submitTaskReq(axios, {
                ...options,
                ecs_token,
                activity,
                productInfo: {
                    coin_productId: 8127,
                    coin_version: 1,
                    coin_unkown1: productInfo['0'],
                    coin_task_id: productInfo['1'],
                    coin_unkown2: productInfo['2'],
                    coin_unkown3: productInfo['3'],
                }
            }) // cmdid 5112
            await new Promise((resolve, reject) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000))
        }

        console.reward('integral', 30)
    },
    doTask: async (axios, options) => {
        let { jar } = await require('./dailysignin').getIntegral(axios, options)
        let cookiesJson = jar.toJSON()
        let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
        ecs_token = ecs_token.value
        if (!ecs_token) {
            throw new Error('ecs_token缺失')
        }
        await dailyDownloadApp.updateRsaKey(axios) // cmdid 152

        // 3次下载
        await require('./dailyDownloadApp').doThreeTask(axios, {
            ...options,
            ecs_token
        })

        // 5次下载
        await require('./dailyDownloadApp').doFiveTask(axios, {
            ...options,
            ecs_token
        })

    }
}

// 防火墙启用 【禁用IP段183.0.0.0/8 163.0.0.0/8] 的出站规则 可将下载任务的tcp请求强制到http请求模式
// 提交任务的Content-length在500多字节

module.exports = dailyDownloadApp