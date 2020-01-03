const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const crypto = require('crypto');
var spawn = require('child_process').spawn;

//密钥
const key = 'j38dsg`hsj9-201!ush`jd832u_j04384rh`sk2937h!ns8';
const reptileUrl = "http://data.eastmoney.com/kzz/";

//主流程
exports.run = function () {
    superagent.get(reptileUrl).end(function (err, res) {
        // 抛错拦截
        if (err) {
            console.log(err)
            return false;
        }
        // 解析数据
        // let $ = cheerio.load(res.text);
        let data = replaceText(res.text);
        // 拿token
        let tokenIndex = data.indexOf("&token=");
        let token = data.substr(tokenIndex + 7, 32);

        let _t = new Date().getTime();
        //拿昨天新债列表
        superagent.get(`http://data.10jqka.com.cn/ipo/kzz/?t=${_t}`).end(function (err, res) {
            res = JSON.parse(res.text);

            if (_.get(res, 'status_code') === 0) {
                let day1 = moment(new Date()).add(-1, 'days').format('YYYY-MM-DD');
                let day2 = moment(new Date()).add(-2, 'days').format('YYYY-MM-DD');
                let day3 = moment(new Date()).add(-3, 'days').format('YYYY-MM-DD');

                let todayRate = [];
                const list = _.filter(res.list, (i) => {
                    const date = i.sub_date;
                    if(day1 === i.sub_date){
                        todayRate.push({name:i.name,successRate:i.success_rate})
                    }
                    return date === day1 || date === day2 || date === day3
                });
                const promiseArray = [getNums1(todayRate)];
                _.map(list, (i) => {
                    promiseArray.push(getNums(token, i.bond_code,i.success_rate));
                });

                Promise.all(promiseArray).then(function (results) {
                    results = _.compact(results);
                    results = _.uniqBy(results, 'name');
                    results && writeFile(results);
                });
            }
        })

    });
}


function writeFile(data) {
    console.log(JSON.stringify(data));
    const valueLength = _.filter(data,(i)=>{
        return i && i.values && i.values.length>0;
    }).length;

    const isWin = process.platform!=='darwin';

    console.log(`---------Data: ${valueLength}/${data.length}---------`);
    data = aesEncrypt(JSON.stringify(data), key);
    // data = `var zqData = "${data}";`;

    fs.readFile('../../etf-dist/static/data.txt', 'utf8',(err, readData) => {
        if(readData===data && !err){
            console.log('---------Process ends, file unchanged---------');
            return;
        }else{

            fs.writeFile('../../etf-dist/static/data.txt', data, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }
                console.log('Write done！: etf-dist/static/data');
                rumCommand(isWin?'C:/Program Files/Git/git-bash.exe':'sh', ['../../etf-dist/run.sh'], '../../etf-dist/static/' ,function( result ) { // 清理缓存
                })
            });

            fs.writeFile('../frontend/static/data.txt', data, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }
                console.log('Write done！: frontend/static/data');
            });


        }
    });
}

function rumCommand( cmd, args, cwd, callback ) {
    var child = spawn( cmd, args, {cwd: cwd} )
    var response = ''
    child.stdout.on('data', function( buffer ){ response += buffer.toString(); })
    child.stdout.on('end', function(){ callback( response ) })
}

//加密
function aesEncrypt(data, key) {
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

//从easyder拿中签数据
function getNums1(successRate) {
    return new Promise(function (resolve, reject) {
        const url = 'http://60.frp.easyder.com/';
        return superagent.get(url)
            .timeout({
                response: 5000,  // Wait 5 seconds for the server to start sending,
                deadline: 10000, // but allow 1 minute for the file to finish loading.
            })
            .end(function (err, res) {
                if (res && res.ok && res.status === 200) {
                    res = res.text;

                    let $ = cheerio.load(res,{decodeEntities: false});
                    let text = $('#code-arr p').text();
                    text = replaceText(text);
                    if(!text){
                        reject(null);
                    }
                    let arr=text.split(":");

                    if(arr&&arr[1]&&arr[1].length>0){
                        let item = _.find(successRate,function (i) {
                            return i.name.match(arr[0])
                        });
                        let successRate = item.successRate;

                        res = {
                            name: arr[0]+'转债',
                            values: arr[1].split(","),
                            successRate:successRate
                        };
                        resolve(res);
                    }else{
                        console.log('easyder没数据');
                        reject(null);
                    }

                } else {
                    console.error('网页挂了或超时', err);
                    reject(null);
                }
            })
    }).catch((e) => {
        console.log('结束easyder抓取', e)
    });
}


//从东财拿中签数据
function getNums(token, code,successRate) {
    return new Promise(function (resolve, reject) {
        const url = `http://dcfm.eastmoney.com/em_mutisvcexpandinterface/api/js/get?type=KZZ_ZQH&token=${token}&filter=(BONDCODE=%27${code}%27)`;
        return superagent.get(url)
            .timeout({
                response: 5000,  // Wait 5 seconds for the server to start sending,
                deadline: 10000, // but allow 1 minute for the file to finish loading.
            })
            .end(function (err, res) {
                if (res && res.ok && res.status === 200) {
                    res = res.text;

                    res = JSON.parse(res);

                    let nums = [];

                    _.map(res, (i) => {
                        nums = nums.concat(i.LUCKNUM.split(','))
                        nums = _.compact(nums)
                    });
                    res = {
                        name: res[0].SNAME,
                        values: nums,
                        successRate:successRate
                    };
                    setTimeout(() => {
                        resolve(res);
                    }, 3000)
                } else {
                    console.error('网页挂了或超时', err);
                    reject(null);
                }
            })
    }).catch((e) => {
        console.log('程序出错', e)
    });
}


//处理空格和回车
function replaceText(text) {
    return text.replace(/\n/g, "").replace(/\s/g, "");
}