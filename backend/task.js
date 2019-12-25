const schedule = require('node-schedule');
const main = require('./main');

const rule = new schedule.RecurrenceRule();
rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const task = ()=>{
    schedule.scheduleJob(rule,()=>{
        console.log('-----------Task start:' + new Date());
        main.run();
    });
}

task();