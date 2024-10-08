const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const crypto = require('crypto');
const sign = require('./sign');

var spawn = require('child_process').spawn;

//密钥
const key = Buffer.from('i4jWS3k4DG02osk3', 'utf8');
const iv = Buffer.from('SF4eFK7YunE3wV6J', 'utf8');

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
                let day0 = moment(new Date()).add(0, 'days').format('YYYY-MM-DD');
                let day1 = moment(new Date()).add(-1, 'days').format('YYYY-MM-DD');
                let day2 = moment(new Date()).add(-2, 'days').format('YYYY-MM-DD');
                let day3 = moment(new Date()).add(-3, 'days').format('YYYY-MM-DD');
                // let day4 = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');

                // let todayRate = [];

                const list = _.filter(res.list, (i) => {
                    const date = i.sub_date;
                    // if(day4 === i.sign_date){
                    //     todayRate.push({name:i.name,successRate:i.success_rate})
                    // }
                    return date === day0 || date === day1 || date === day2 || date === day3
                });
                // const promiseArray = [getNums1(todayRate&&todayRate.length>0?todayRate:null)];
                const promiseArray = [];
                _.map(list, (i) => {
                    promiseArray.push(getNums(token, i.bond_code,i.success_rate));
                });

                Promise.all(promiseArray).then(function (results) {

                    let res = [];

                    _.map(results,(i)=>{
                        if(i && i.length>0){
                            _.map(i,(j)=>{
                                i.name && res.push(j)
                            })
                        }else if(i.name){
                            res.push(i)
                        }
                    })

                    res = _.compact(res);
                    res = _.uniqBy(res, 'name');

                    // console.log(results);
                    results && writeFile(res);
                });
            }
        })

    });
}


function writeFile(data) {
    // data = [ { name: '乐普转债', values: [], successRate: '0.0264' },
    //     { name: '希望转债', values: [], successRate: '0.0492694631' },
    //     { name: '百川转债', values: [], successRate: '0.0198' },
    //     { name: '璞泰转债',
    //         values:
    //             [ '009067694',
    //                 '209067694',
    //                 '351036455',
    //                 '409067694',
    //                 '427628805',
    //                 '609067694',
    //                 '809067694',
    //                 '927628805',
    //                 '13171559',
    //                 '38171559',
    //                 '63171559',
    //                 '88171559',
    //                 '0205192',
    //                 '1455192',
    //                 '2705192',
    //                 '3955192',
    //                 '5205192',
    //                 '6455192',
    //                 '7705192',
    //                 '8955192',
    //                 '097622',
    //                 '222622',
    //                 '347622',
    //                 '472622',
    //                 '597622',
    //                 '722622',
    //                 '847622',
    //                 '972622',
    //                 '16556',
    //                 '32568',
    //                 '36556',
    //                 '56556',
    //                 '76556',
    //                 '82568',
    //                 '96556' ],
    //         successRate: '0.00788472' } ]

    console.log(data);
    const valueLength = _.filter(data,(i)=>{
        return i && i.values && i.values.length>0;
    }).length;

    const isWin = process.platform!=='darwin';

    console.log(`---------Data: ${valueLength}/${data.length}---------`);
    data = sign.genSign(JSON.stringify(data), key,iv);
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
                rumCommand(isWin?'C:/Program Files/Git/git-bash.exe':'sh', ['../../etf-dist/run.sh'], '../../etf-dist/static/' ,function( result ) {
                    // 清理缓存
                    console.log(result)
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

//从easyder拿中签数据
function getNums1(oriArray = [{name:'',successRate:0}]) {
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
                    let res1 = [];

                    $('#code-arr p').map(function(i, el){
                        let text = $(this).text();
                        text = replaceText(text);

                        let arr=text.split(":");

                        if(arr&&arr[1]&&arr[1].length>0){
                            let item = _.find(oriArray,function (i) {
                                return i.name.match(arr[0])
                            });

                            let successRate = item.successRate;

                            res1.push({
                                name: arr[0]+'转债',
                                values: arr[1].split(","),
                                successRate:successRate
                            });
                        }

                    });

                    resolve(res1);

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