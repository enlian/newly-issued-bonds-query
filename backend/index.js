/**
 * 获取依赖
 * @type {*}
 */
const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const crypto = require('crypto');

const key = 'j38dsg`hsj9-201!ush`jd832u_j04384rh`sk2937h!ns8';

//加密
function aesEncrypt(data, key) {
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

//拿中签数据
function getNums(token, code) {
    return new Promise(function (resolve, reject) {
        return superagent.get(`http://dcfm.eastmoney.com/em_mutisvcexpandinterface/api/js/get?type=KZZ_ZQH&token=${token}&filter=(BONDCODE=%27${code}%27)`)
            .end(function (err, res) {
                if (res && res.text) {
                    res = res.text;
                }
                res = JSON.parse(res);
                let nums = [];

                _.map(res, (i) => {
                    nums = nums.concat(i.LUCKNUM.split(','))
                });
                res = {
                    name: res[0].SNAME,
                    values: nums
                };

                resolve(res);
            })
    });
}

/**
 * 定义请求地址
 * @type {*}
 */
const reptileUrl = "http://data.eastmoney.com/kzz/detail/128087.html";

/**
 * 处理空格和回车
 * @param text
 * @returns {string}
 */
function replaceText(text) {
    return text.replace(/\n/g, "").replace(/\s/g, "");
}

/**
 * 核心业务
 * 发请求，解析数据，生成数据
 */
superagent.get(reptileUrl).end(function (err, res) {
    // 抛错拦截
    if (err) {
        console.log(err)
        return false;
    }
    // 解析数据
    let $ = cheerio.load(res.text);
    /**
     * 存放数据容器
     * @type {Array}
     */
    let data = replaceText(res.text);
    // 获取数据
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

            const list = _.filter(res.list, (i)=>{
                const date = i.sub_date;
                return date===day1||date===day2||date===day3
            });
            const promiseArray = [];
            _.map(list, (i) => {
                promiseArray.push(getNums(token, i.bond_code));
            });

            Promise.all(promiseArray).then(function (results) {
                writeFile(results);
            });


        }
    })

});


function writeFile(data) {
    console.log(data);
    data = `var zqData = "${aesEncrypt(JSON.stringify(data),key)}"`;

    fs.writeFile( '../frontend/dist/static/data.js', data, function (err) {
        if (err) {
            console.log(err);
            return false;
        }
        console.log('写入完成');
    });
}