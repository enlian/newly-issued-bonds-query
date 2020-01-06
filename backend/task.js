const schedule = require('node-schedule');
const main = require('./main1');

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,1,2,3,4];
rule.hour=[0,6,15,16,17,18,19,20];
rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const task = ()=>{
    schedule.scheduleJob(rule,()=>{
        console.log('-----------Task start:' + new Date());
        main.run();
    });
}

task();