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

                const list = _.filter(res.list, (i) => {
                    const date = i.sub_date;
                    return date === day1 || date === day2 || date === day3
                });
                const promiseArray = [];
                _.map(list, (i) => {
                    promiseArray.push(getNums(token, i.bond_code,i.success_rate));
                });

                Promise.all(promiseArray).then(function (results) {
                    results = _.compact(results);
                    results && writeFile(results);
                });
            }
        })

    });
}


function writeFile(data) {
    console.log(data);
    const valueLength = _.filter(data,(i)=>{
        return i && i.values && i.values.length>0;
    }).length;

    const isWin = process.platform.toLowerCase().match('win');

    console.log(`拿到数据${valueLength}/${data.length}`);
    data = aesEncrypt(JSON.stringify(data), key);
    // data = `var zqData = "${data}";`;

    fs.writeFile('../../etf-dist/static/data.txt', data, function (err) {
        if (err) {
            console.log(err);
            return false;
        }
        console.log('写入完成: etf-dist/static/data');
    });

    fs.writeFile('../frontend/static/data.txt', data, function (err) {
        if (err) {
            console.log(err);
            return false;
        }
        console.log('写入完成: frontend/static/data');
    });

    rumCommand(isWin?'C:/Program Files/Git/git-bash.exe':'sh', ['../../etf-dist/run.sh'], '../../etf-dist/static/' ,function( result ) { // 清理缓存
        console.log('shell脚本开始----------------',result);
    })
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

//拿中签数据
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