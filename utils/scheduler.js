const os = require('os')
const path = require('path')
const fs = require('fs-extra')
var moment = require('moment');
moment.locale('zh-cn');
const { getCookies, saveCookies, delCookiesFile } = require('./util')
const { TryNextEvent, CompleteEvent } = require('./EnumError')
const _request = require('./request')
var crypto = require('crypto');
const { default: PQueue } = require('p-queue');

String.prototype.replaceWithMask = function (start, end) {
    return this.substr(0, start) + '******' + this.substr(-end, end)
}

const randomDate = (options) => {
    let startDate = moment();
    let endDate = moment().endOf('days').subtract(2, 'hours');

    let defaltMinStartDate = moment().startOf('days').add('4', 'hours')
    if (startDate.isBefore(defaltMinStartDate, 'minutes')) {
        startDate = defaltMinStartDate
    }

    if (options && typeof options.startHours === 'number') {
        startDate = moment().startOf('days').add(options.startHours, 'hours')
    }
    if (options && typeof options.endHours === 'number') {
        endDate = moment().startOf('days').add(options.endHours, 'hours')
    }

    return new Date(+startDate.toDate() + Math.random() * (endDate.toDate() - startDate.toDate()));
};
let tasks = {}
let scheduler = {
    taskFile: path.join(os.homedir(), '.AutoSignMachine', 'taskFile.json'),
    today: '',
    isRunning: false,
    isTryRun: false,
    taskJson: undefined,
    queues: [],
    will_tasks: [],
    selectedTasks: [],
    taskKey: 'default',
    clean: async () => {
        scheduler.today = '';
        scheduler.isRunning = false;
        scheduler.isTryRun = false;
        scheduler.taskJson = undefined;
        scheduler.queues = [];
        scheduler.will_tasks = [];
        scheduler.selectedTasks = [];
        scheduler.taskKey = 'default';
    },
    updateTaskFile: (task, newTask) => {
        let taskJson = fs.readFileSync(process.env.taskfile).toString('utf-8')
        taskJson = JSON.parse(taskJson)
        let taskindex = taskJson.queues.findIndex(q => q.taskName === task.taskName)
        if (taskindex !== -1) {
            taskJson.queues[taskindex] = {
                ...taskJson.queues[taskindex],
                ...newTask
            }
        }
        scheduler.taskJson = taskJson
        fs.writeFileSync(scheduler.taskFile, JSON.stringify(scheduler.taskJson))
    },
    buildQueues: async (taskNames, queues) => {
        for (let taskName of taskNames) {
            let options = tasks[taskName].options || {}
            let willTime = moment(randomDate(options));
            let waitTime = options.dev ? 0 : Math.floor(Math.random() * (options.waitTime || 60))
            if (options) {
                if (options.isCircle || options.dev) {
                    willTime = moment().startOf('days');
                }
                if (typeof options.startTime === 'number') {
                    willTime = moment().startOf('days').add(options.startTime, 'seconds');
                }
                if (options.ignoreRelay) {
                    waitTime = 0;
                }
            }
            if (scheduler.isTryRun) {
                console.info('tryRun模式忽略执行延迟')
                willTime = moment().startOf('days');
                waitTime = 0;
            }
            queues.push({
                taskName: taskName,
                taskState: 0,
                willTime: willTime.format('YYYY-MM-DD 00:00:00'),
                waitTime: waitTime
            })
        }
        return queues
    },
    getSomeNewTaskNames: (existsTasks, newAllTaskNames) => {
        let existsTaskNames = existsTasks.map(t => t.taskName)
        let notExistsTaskNames = newAllTaskNames.filter(n => existsTaskNames.indexOf(n) === -1)
        return notExistsTaskNames
    },
    initTasksQueue: async () => {
        const today = moment().format('YYYYMMDD')
        if (!fs.existsSync(scheduler.taskFile)) {
            console.info('任务配置文件不存在，创建配置中')
            let queues = await scheduler.buildQueues(Object.keys(tasks), [])
            fs.ensureFileSync(scheduler.taskFile)
            fs.writeFileSync(scheduler.taskFile, JSON.stringify({
                today,
                queues
            }))
        } else {
            let taskJson = fs.readFileSync(scheduler.taskFile).toString('utf-8')
            taskJson = JSON.parse(taskJson)
            if (taskJson.today !== today) {
                console.info('日期已变更，重新生成任务配置')
                let queues = await scheduler.buildQueues(Object.keys(tasks), [])
                fs.writeFileSync(scheduler.taskFile, JSON.stringify({
                    ...taskJson,
                    rewards: {},
                    today,
                    queues
                }))
            } else if (taskJson.queues.length < Object.keys(tasks).length) {
                console.info('数量已变更，追加新的任务配置')
                let queues = await scheduler.buildQueues(
                    scheduler.getSomeNewTaskNames(
                        taskJson.queues,
                        Object.keys(tasks)
                    ),
                    taskJson.queues || []
                )
                fs.writeFileSync(scheduler.taskFile, JSON.stringify({
                    ...taskJson,
                    today,
                    queues
                }))
            }
        }
        scheduler.today = today
    },
    genFileName(command) {
        if (process.env.asm_func === 'true') {
            // 暂不支持持久化配置，使用一次性执行机制，函数超时时间受functions.timeout影响
            scheduler.isTryRun = true
        }
        let dir = process.env.asm_save_data_dir
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir)
        }
        scheduler.taskFile = path.join(dir, `taskFile_${command}_${scheduler.taskKey}.json`)
        process.env['taskfile'] = scheduler.taskFile
        scheduler.today = moment().format('YYYYMMDD')
        let maskFile = path.join(dir, `taskFile_${command}_${scheduler.taskKey.replaceWithMask(2, 3)}.json`)
        console.info('获得配置文件', maskFile, '当前日期', scheduler.today)
    },
    loadTasksQueue: async (selectedTasks) => {
        let queues = []
        let will_tasks = []
        let taskJson = {}
        if (fs.existsSync(scheduler.taskFile)) {
            taskJson = fs.readFileSync(scheduler.taskFile).toString('utf-8')
            taskJson = JSON.parse(taskJson)
            if (taskJson.today === scheduler.today) {
                if (scheduler.isTryRun) {
                    queues = taskJson.queues
                } else {
                    queues = taskJson.queues.filter(t =>
                        // 未处于运行状态
                        (!t.isRunning) ||
                        // 处于运行状态且超过了运行截止时间
                        (t.isRunning && t.runStopTime && moment(t.runStopTime).isBefore(moment(), 'minutes'))
                    )
                    if (taskJson.queues.length !== queues.length) {
                        console.info('跳过以下正在执行的任务', taskJson.queues.filter(t =>
                            // 处于运行状态未设置截止时间
                            (t.isRunning && !t.runStopTime) ||
                            // 处于运行状态且还未到运行截止时间
                            (t.isRunning && t.runStopTime && moment(t.runStopTime).isAfter(moment(), 'minutes'))
                        ).map(t => t.taskName).join(','))
                    }
                }
            } else {
                console.info('日期配置已失效')
            }
            if (scheduler.isTryRun) {
                fs.unlinkSync(scheduler.taskFile)
            }
        } else {
            console.info('配置文件不存在')
        }

        if (Object.prototype.toString.call(selectedTasks) == '[object String]') {
            selectedTasks = selectedTasks.split(',').filter(q => q)
        } else {
            selectedTasks = []
        }

        if (scheduler.isTryRun) {
            will_tasks = queues.filter(task => (!selectedTasks.length || selectedTasks.length && selectedTasks.indexOf(task.taskName) !== -1))
        } else {
            will_tasks = queues.filter(task =>
                task.taskName in tasks &&
                task.taskState === 0 &&
                moment(task.willTime).isBefore(moment(), 'seconds') &&
                (!selectedTasks.length || selectedTasks.length && selectedTasks.indexOf(task.taskName) !== -1)
            )
        }

        scheduler.taskJson = taskJson
        scheduler.queues = queues
        scheduler.will_tasks = will_tasks
        scheduler.selectedTasks = selectedTasks
        console.info('计算可执行任务', '总任务数', queues.length, '已完成任务数', queues.filter(t => t.taskState === 1).length, '错误任务数', queues.filter(t => t.taskState === 2).length, '指定任务数', selectedTasks.length, '预计可执行任务数', will_tasks.length)
        return {
            taskJson,
            queues,
            will_tasks
        }
    },
    regTask: async (taskName, callback, options) => {
        tasks[taskName] = {
            callback,
            options
        }
    },
    hasWillTask: async (command, params) => {
        const { taskKey, tryrun, tasks: selectedTasks } = params
        scheduler.clean()
        scheduler.isTryRun = tryrun
        scheduler.taskKey = taskKey || 'default'
        if (scheduler.isTryRun) {
            console.info('!!!当前运行在TryRun模式，仅建议在测试时运行!!!')
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        process.env['taskKey'] = [command, scheduler.taskKey].join('_')
        process.env['command'] = command
        console.info('将使用', scheduler.taskKey.replaceWithMask(2, 3), '作为账户识别码')
        await scheduler.genFileName(command)
        await scheduler.initTasksQueue()
        let { will_tasks } = await scheduler.loadTasksQueue(selectedTasks)
        scheduler.isRunning = true
        return will_tasks.length
    },
    execTask: async (command) => {
        console.info('开始执行任务')
        if (!scheduler.isRunning) {
            await scheduler.genFileName(command)
            await scheduler.initTasksQueue()
        }

        let { taskJson, queues, will_tasks, selectedTasks } = scheduler

        if (selectedTasks.length) {
            console.info('将只执行选择的任务', selectedTasks.join(','))
        }

        if (will_tasks.length) {
            if (scheduler.isTryRun) {
                await delCookiesFile([command, scheduler.taskKey].join('_'))
            }

            // 初始化处理
            let init_funcs = {}
            let init_funcs_result = {}
            for (let task of will_tasks) {
                process.env['current_task'] = task.taskName
                let ttt = tasks[task.taskName] || {}
                let tttOptions = ttt.options || {}

                let savedCookies = await getCookies([command, scheduler.taskKey].join('_')) || tttOptions.cookies
                let request = _request(savedCookies)

                if (tttOptions.init) {
                    if (Object.prototype.toString.call(tttOptions.init) === '[object AsyncFunction]') {
                        let hash = crypto.createHash('md5').update(tttOptions.init.toString()).digest('hex')
                        if (!(hash in init_funcs)) {
                            init_funcs_result[task.taskName + '_init'] = await tttOptions['init'](request, savedCookies)
                            init_funcs[hash] = task.taskName + '_init'
                        } else {
                            init_funcs_result[task.taskName + '_init'] = init_funcs_result[init_funcs[hash]]
                        }
                    } else {
                        console.info('not apply')
                    }
                } else {
                    init_funcs_result[task.taskName + '_init'] = { request }
                }
            }

            // 任务执行
            // 多个任务同时执行会导致日志记录类型错误，所以仅在tryRun模式开启多个任务并发执行
            let concurrency = scheduler.isTryRun ? 10 : 10
            let queue = new PQueue({ concurrency });
            console.info('调度任务中', '并发数', concurrency)
            for (let task of will_tasks) {
                scheduler.updateTaskFile(task, {
                    // 限制执行时长2hours，runStopTime用于防止因意外原因导致isRunning=true的任务被中断，而未改变状态使得无法再次执行的问题
                    runStopTime: moment().add(2, 'hours').format('YYYY-MM-DD HH:mm:ss'),
                    isRunning: true
                })
                queue.add(async () => {
                    process.env['current_task'] = task.taskName
                    var st = new Date().getTime();
                    try {
                        if (task.waitTime) {
                            console.info('延迟执行', task.taskName, task.waitTime, 'seconds')
                            await new Promise((resolve, reject) => setTimeout(resolve, task.waitTime * 100))
                        }

                        let ttt = tasks[task.taskName]
                        if (Object.prototype.toString.call(ttt.callback) === '[object AsyncFunction]') {
                            await ttt.callback.apply(this, Object.values(init_funcs_result[task.taskName + '_init']))
                        } else {
                            console.info('任务执行内容空')
                        }

                        let isupdate = false
                        let newTask = {}
                        if (ttt.options) {
                            if (!ttt.options.isCircle) {
                                newTask.taskState = 1
                                isupdate = true
                            }
                            if (ttt.options.isCircle && ttt.options.intervalTime) {
                                newTask.willTime = moment().add(ttt.options.intervalTime, 'seconds').format('YYYY-MM-DD HH:mm:ss')
                                isupdate = true
                            }
                        } else {
                            newTask.taskState = 1
                            isupdate = true
                        }

                        if (isupdate) {
                            scheduler.updateTaskFile(task, newTask)
                        }
                    } catch (err) {
                        if (err instanceof TryNextEvent) {
                            console.info(err.message)
                        } else if (err instanceof CompleteEvent) {
                            console.info(err.message)
                            let newTask = {
                                failNum: 0,
                                taskState: 1
                            }
                            scheduler.updateTaskFile(task, newTask)
                        } else {
                            console.info('任务错误：', err)
                            if (task.failNum > 5) {
                                console.error('任务错误次数过多，停止该任务后续执行')
                                let newTask = {
                                    taskState: 2,
                                    taskRemark: '错误过多停止'
                                }
                                console.notify('任务错误次数过多，停止该任务后续执行')
                                scheduler.updateTaskFile(task, newTask)
                            } else {
                                let newTask = {
                                    failNum: task.failNum ? (parseInt(task.failNum) + 1) : 1
                                }
                                scheduler.updateTaskFile(task, newTask)
                            }
                        }
                    }
                    finally {
                        var time = new Date().getTime() - st;
                        console.info(task.taskName, '执行用时', Math.floor(time / 1000), '秒')
                        scheduler.updateTaskFile(task, {
                            isRunning: false,
                            time
                        })
                    }
                    delete process.env.current_task
                })
            }
            await queue.onIdle()
            await console.sendLog()
        } else {
            console.info('暂无需要执行的任务')
        }
    }
}
module.exports = {
    scheduler
}
