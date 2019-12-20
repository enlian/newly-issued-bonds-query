let copydir = require('copy-dir');

copydir.sync(process.cwd() + '/static', process.cwd() + '/dist/static', {
    utimes: true,
    mode: true,
    cover: true
}, function (err) {
    if (err) throw err
    console.log('文件拷贝完成')
})