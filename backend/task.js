const schedule = require('node-schedule');
const main = require('./main');

const  task = ()=>{
    schedule .scheduleJob('30 * * * * *',()=>{
        console.log('-----------定时爬虫任务:' + new Date());
        main.run();
    });
}

task();