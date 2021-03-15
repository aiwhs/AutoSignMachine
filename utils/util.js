const os = require('os')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
    async delCookiesFile(key) {
        let dir = process.env.asm_save_data_dir
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir)
        }
        let cookieFile = path.join(dir, 'cookieFile_' + key + '.txt')
        if (fs.existsSync(cookieFile)) {
            fs.unlinkSync(cookieFile)
        }
    },
    getCookies: (key) => {
        let dir = process.env.asm_save_data_dir
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir)
        }
        let cookieFile = path.join(dir, 'cookieFile_' + key + '.txt')
        if (fs.existsSync(cookieFile)) {
            let cookies = fs.readFileSync(cookieFile).toString('utf-8')
            return cookies
        }
        return ''
    },
    saveCookies: (key, cookies, cookiesJar) => {
        let dir = process.env.asm_save_data_dir
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir)
        }
        let cookieFile = path.join(dir, 'cookieFile_' + key + '.txt')
        let allcookies = {}
        if (cookies) {
            cookies.split('; ').map(c => {
                let item = c.split('=')
                allcookies[item[0]] = item[1] || ''
            })
        }
        if (cookiesJar) {
            cookiesJar.toJSON().cookies.map(c => {
                allcookies[c.key] = c.value || ''
            })
        }
        let cc = []
        for (let key in allcookies) {
            cc.push({
                key: key,
                value: allcookies[key] || ''
            })
        }
        fs.ensureFileSync(cookieFile)
        fs.writeFileSync(cookieFile, cc.map(c => c.key + '=' + c.value).join('; ')
        )
    },
    buildArgs: (argv) => {
        var accounts = []
        var arg_group = {}
        for (let arg_k in argv) {
            let arg = argv[arg_k]
            if (arg_k.indexOf('-') !== -1) {
                let arg_k_split = arg_k.split('-')
                let t = arg_k_split.pop()
                let isN = (typeof t === 'number' || /^\d+$/.test(t))
                if (!(t in arg_group) && isN) {
                    arg_group[t] = {}
                }
                if (isN) {
                    arg_group[t][arg_k_split.join('-')] = arg
                } else {
                    arg_group['0'][arg_k] = arg
                }
            } else {
                if (!('0' in arg_group)) {
                    arg_group['0'] = {}
                }
                arg_group['0'][arg_k] = arg
            }
        }
        if ('accountSn' in argv && argv.accountSn) {
            let accountSns = (argv.accountSn + '').split(',')
            for (let sn of accountSns) {
                if (('user-' + sn) in argv) {
                    let account = {
                        ...((sn in arg_group) ? arg_group[sn] : {}),
                        tasks: argv['tasks-' + sn] || argv['tasks'] || ''
                    }
                    if (('tryrun-' + sn) in argv) {
                        account['tryrun'] = true
                    }
                    accounts.push(account)
                }
            }
        } else {
            accounts.push({
                ...arg_group['0'],
                tasks: argv['tasks'] || ''
            })
        }
        return accounts
    }
}