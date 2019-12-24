const schedule = require('node-schedule');
const main = require('./main');

const rule = new schedule.RecurrenceRule();
rule.minute = [0, 15, 45];

const task = ()=>{
    schedule.scheduleJob(rule,()=>{
        console.log('-----------定时爬虫任务:' + new Date());
        main.run();
    });
}

task();