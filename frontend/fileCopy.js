let copydir = require('copy-dir');

copydir.sync(process.cwd() + '/static', '../../etf-dist/static', {
    utimes: true,
    mode: true,
    cover: true
}, function (err) {
    if (err) throw err
    console.log('文件拷贝完成')
})