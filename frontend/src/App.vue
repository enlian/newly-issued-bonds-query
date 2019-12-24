<template>
    <div id="app">
        <!--         <p class="title">输入配号查询是否中签，默认1000个配号</p>-->
        <el-table
                v-loading="loading"
                :data="data"
                stripe
                style="padding-left: 10px;padding-right: 10px">
            <el-table-column
                    label='名字'
                    prop="name"
                    width="78"
            >
            </el-table-column>
            <el-table-column
                    label="起始配号"
                    prop="inputValue"
                    width="140"
            >
                <template slot-scope="scope">
                    <el-input :clearable=true
                              minlength='4'
                              maxlength="14"
                              :readonly='scope.row.values.length===0'
                              v-model="scope.row.inputValue" :placeholder='"输入配号"'
                              @input="onClear(scope.$index)"
                              @clear="onClear(scope.$index)"
                    ></el-input>
                </template>
            </el-table-column>
            <el-table-column
                    label="中签率"
                    prop="successRate"
                    width="68"
            >
                <template slot-scope="scope">
                    {{scope.row.successRate>0?(scope.row.successRate*1000).toFixed(2)+'%':'没出'}}
                </template>
            </el-table-column>
            <el-table-column
                    label="操作">
                <template slot-scope="scope">
                    <el-button
                            size="small"
                            :disabled='scope.row.values.length===0'
                            :type="scope.row.active?'danger':(scope.row.active===false&&scope.row.inputValue?'warning':
                            (scope.row.values.length===0?'info':'primary'))"
                            @click="check(scope.$index,scope.row.inputValue)">
                        {{scope.row.active?'中签':(scope.row.active===false&&scope.row.inputValue?'没中':'查询')}}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <P class="desc">PS：默认顶格申购，配号数1000个</P>


        <el-row style="float:left;padding-left:15px">
            <el-button size="small" type="primary" @click="refresh">刷新页面</el-button>
            <el-button size="small" type="primary" @click="rewardVisible = true">打赏作者</el-button>
            <el-button size="small" type="danger" @click="dialogVisible = true">扫码领取体验金</el-button>
        </el-row>

        <p class="title" v-if="!data && !loading">今日暂无新债公布中签配号 <br/>请晚点再来试下~</p>

        <p class="footer">本站数据仅供个人参考，最终结果请以券商为准<br/>合作联系：651754835@qq.com</p>

        <el-dialog
                custom-class="tiYan"
                width="90%"
                center
                top="5%"
                title="" :visible.sync="dialogVisible">
            <img src="/static/code.jpeg" class="code"/>
        </el-dialog>

        <el-dialog
                custom-class="daShang"
                width="90%"
                center
                top="5%"
                title="打赏作者" :visible.sync="rewardVisible">
            <p>如果这个小工具能对您有帮助，欢迎收藏并推荐给朋友使用。</p>
            <p>我们会继续完善功能，优化体验，谢谢您的打赏！</p>

            <span style="display: block">微信:</span>
            <img src="/static/wx.JPG" class="code" style="width: 200px;height: 200px;"/>
            <br>
            <br>
            <span style="display: block">支付宝:</span>
            <img src="/static/zfb.jpeg" class="code" style="width: 205px;height: 205px;"/>

        </el-dialog>

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
    function isContinuationInteger(arr) {
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
                list: null,
                dialogVisible: false,
                rewardVisible:false
            }
        },
        mounted() {
            // this.getData();
            this.getLocalData();
        },
        methods: {
            refresh() {
                // this.loading = true;
                this.getLocalData()
                this.$message({
                    message: '刷新成功，已获取最新数据',
                    type: 'success'
                });
            },
            onClear(index) {
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
                    this.dealData(aesDecrypt(res.bodyText, key))
                })

                // this.dealData(aesDecrypt(zqData,key))
            },
            dealData(response) {
                response = JSON.parse(response);
                this.data = response;
                this.loading = false;
            },
            check(index, value = '0') {
                let num = 0;

                if (value.length < 4 || isContinuationInteger(value)) {
                    //一定没中签
                    this.$set(this.data, index, {...this.data[index], active: false});
                    return;
                }

                value = value.toString();
                let data = this.data[index].values;
                let luckIndex = 0;

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
                    luckIndex=index;
                    if (newI > (newValue - 1) && newI < (newValue + 1000)) {
                        // this.$set(this.data, index, {...this.data[index], active: data[i]});
                        num++;
                        luckIndex=index;
                        // break;
                    } else {
                        // this.$set(this.data, index, {...this.data[index], active: false});
                    }
                }
                if(num>0){
                    this.$set(this.data, luckIndex, {...this.data[luckIndex], active: true});
                    this.$message({
                        message: `恭喜！${this.data[index].name}中${num}签`,
                        type: 'success'
                    });
                }else{
                    this.$set(this.data, luckIndex, {...this.data[luckIndex], active: false});
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

    .code {
        width: 100%;
    }

    .tiYan .el-dialog__body {
        padding: 15px !important;
    }

    .tiYan .el-dialog__header {
        padding-top: 6px !important;
    }

    .tiYan .el-dialog__headerbtn{
        top:6px!important;
        right: 10px!important;
    }

    .daShang .el-dialog__body{
        padding-top: 0!important;
    }

    #app {
        font-family: Helvetica, sans-serif;
        text-align: center;
        padding-top: 1.5em;
    }

    .el-input__inner {
        padding-right: 0 !important;
        padding-left: 5px !important;
    }

    .title {
        color: #606266;
        font-size: 1em;
        margin-bottom: 1em;
        line-height: 2em;
        text-align: left;
        padding-left: 1em;
        padding-top: 1em;
    }

    .desc {
        color: #ccc;
        font-size: 0.8em;
        text-align: left;
        padding-left: 15px;
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
