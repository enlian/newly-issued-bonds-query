<template>
    <div id="app">
        <!-- <p class="title">输入配号查询是否中签</p>-->
        <el-form :inline="true" v-if="!loading && data">
            <div v-for="(item, index) in data">
                <el-form-item :label='item.name'>
                    <el-input :clearable=true
                              minlength='4'
                              maxlength="14"
                              v-model="item.inputValue" :placeholder='"请输入"+item.name+"配号"'
                              @input="onClear(index)"
                              @clear="onClear(index)"
                    ></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button :type="item.active?'danger':(item.active===false&&item.inputValue?'warning':'primary')"
                               @click="check(index,item.inputValue)">
                        {{item.active?'中签':(item.active===false&&item.inputValue?'没中':'查询')}}
                    </el-button>
                </el-form-item>
            </div>
        </el-form>

        <p class="title" v-if="!data && !loading">今日暂无新债公布中签配号 <br/>请晚点再来试下~</p>

        <p class="footer">本站数据仅供个人参考，最终结果请以券商为准<br/>合作联系：651754835@qq.com</p>
    </div>
</template>

<script>
    import moment from 'moment'
    import _ from 'lodash';
    const crypto = require('crypto');

    const key = 'j38dsg`hsj9-201!ush`jd832u_j04384rh`sk2937h!ns8';

    //解密
    function aesDecrypt(encrypted, key) {
        const decipher = crypto.createDecipher('aes192', key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    //简单数字测试
    function isContinuationInteger(arr){
        arr = arr.split('');
        if (!(arr instanceof Array) || arr.length <= 1) return false;
        for (var i = 1, len = arr.length; i < len; i++) {
            if (((+arr[i - 1] + 1) % 10) !== +arr[i]) return false;
        }
        return true;
    }

    export default {
        data() {
            return {
                data: null,
                loading: true,
                list:null,
            }
        },
        mounted() {
            // this.getData();
            this.getLocalData();
        },
        methods: {
            onClear(index){
                this.$set(this.data, index, {...this.data[index], active: null});
            },
            getData() {
                let _d = moment().format('YYYYMMDD');
                let _t = new Date().getTime();

                this.$axios
                    .get(`/data_${_d}.txt?t=${_t}`)
                    .then(response => {
                        this.dealData(response.data)
                    }).catch(() => {
                    this.getLocalData();
                }).finally(() => {
                    this.loading = false;
                })
            },
            getLocalData() {
                let _t = new Date().getTime();

                this.$http.get(`./static/data.txt?t=${_t}`).then(res => {
                    this.dealData(aesDecrypt(res.bodyText,key))
                })

                // this.dealData(aesDecrypt(zqData,key))
            },
            dealData(response) {
                response = JSON.parse(response);
                this.data = response;
                this.loading = false;
            },
            check(index, value = '0') {
                if(value.length<4||isContinuationInteger(value)){
                    //一定没中签
                    this.$set(this.data, index, {...this.data[index], active: false});
                    return;
                }

                value = value.toString();
                let data = this.data[index].values;

                for (let i = 0; i < data.length; i++) {
                    let newValue = value;
                    let newI = data[i];

                    if (newValue.length > newI.length) {
                        newValue = newValue.substr(newValue.length - newI.length);
                    } else if (newI.length > newValue.length) {
                        newI = newI.substr(newI.length - newValue.length);
                    }

                    newValue = parseInt(newValue);
                    newI = parseInt(newI);
                    if (newI > (newValue - 1) && newI < (newValue + 1000)) {
                        this.$set(this.data, index, {...this.data[index], active: data[i]});
                        break;
                    } else {
                        this.$set(this.data, index, {...this.data[index], active: false});
                    }
                }
            }
        }
    }
</script>

<style>
    body {
        /*background: #909399;*/
        overflow: hidden;
        margin: 0;
        padding: 0;
    }

    #app {
        font-family: Helvetica, sans-serif;
        text-align: center;
        padding-top: 2.4em;
    }

    .el-input__inner{
        padding-right: 0!important;
    }

    .title {
        color: #606266;
        font-size: 1.1em;
        margin-bottom: 1.1em;
        line-height: 2em;
    }

    .footer {
        width: 100%;
        text-align: center;
        position: absolute;
        bottom: 1em;
        color: #ccc;
        font-size: 0.7em;
    }
</style>
