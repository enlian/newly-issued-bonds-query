<template>
    <div id="app" :style="{height: clientHeight+'px'}">
        <p class="header">新债中签查询</p>
        <el-button size="small" type="text" icon="el-icon-refresh" @click="refresh" class="refresh">刷新</el-button>

        <el-table
                v-loading="loading"
                :data="data"
                stripe>
            <el-table-column
                    label='名字'
                    prop="name"
                    width="82">
                <template slot-scope="scope">
                    <div>{{scope.row.name}}</div>
                </template>
            </el-table-column>
            <el-table-column
                    label="起始配号"
                    prop="inputValue"
                    width="145">
                <template slot-scope="scope">
                    <el-input :clearable=true
                              minlength='4'
                              maxlength="14"
                              :readonly='scope.row.values.length===0'
                              v-model="scope.row.inputValue" :placeholder='scope.row.values.length===0?"暂不可查":"输入配号"'
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
                    {{scope.row.successRate>0?(scope.row.successRate*1000>100?(scope.row.successRate*1000).toFixed(0)+'%':(scope.row.successRate*1000).toFixed(2)+'%'):'无'}}
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
<!--            <el-button size="mini" type="success" @click="qunVisible = true">打新债及定投交流群</el-button>-->
            <el-button size="mini" type="success" @click="dialogVisible = true">薅羊毛</el-button>
            <el-button size="mini" type="success" @click="kaihuVisible = true">万1开户</el-button>
        </el-row>

<!--        <el-row style="float:left;padding-left:15px;margin-top: 10px">-->
<!--            <el-button size="mini" type="primary" @click="rewardVisible = true">打赏作者</el-button>-->
<!--        </el-row>-->

        <p class="title" v-if="!data && !loading">今日暂无新债公布中签配号 <br/>请晚点再来试下~</p>

        <p class="footer">本站数据仅供个人参考，最终结果请以券商为准
<!--            <br/>股票万1基金万0.5免5开户 微信：15919286693-->
        </p>

        <el-dialog
                custom-class="tiYan"
                :width=modalWidth
                center
                top="10%"
                title="" :visible.sync="dialogVisible">
<!--            <p>支付宝基金体验金，7天大概赚10块</p>-->
<!--            <img src="/static/money.jpg" class="code"/>-->
<!--            <br>-->
<!--            <br>-->
<!--            <p>余额宝体验金，你懂的</p>-->
            <img src="/static/code.jpg" class="code"/>
        </el-dialog>

        <el-dialog
                :width=modalWidth
                center
                top="10%"
                title="" :visible.sync="qunVisible">
            <img src="/static/qun.jpg" class="code"/>
        </el-dialog>

        <el-dialog
                :width=kaihuModalWidth
                center
                top="15%"
                title="万1开户" :visible.sync="kaihuVisible">
            <p>海通证券，AA评级，国内顶级券商</p>
            <p>股票万1含规费，基金万0.5</p>
            <p>深可转债万0.4，沪可转债万0.02，逆回购1折</p>
            <p style="color: red">调佣要求：未满3户，且营业部为广东珠海（前提）<br/>单笔买入股票或场内基金1000元以上（买入后自动调佣）</p>
            <p style="color: red">注意：不符合要求的将按照开户申请页面写明的佣金生效</p>
            <img src="/static/wan1.jpg" class="code"/>
        </el-dialog>

        <el-dialog
                custom-class="daShang"
                :width=modalWidth
                center
                top="10%"
                title="打赏作者" :visible.sync="rewardVisible">
            <p>如果这个小工具能对您有帮助，欢迎收藏并推荐给朋友使用。</p>
            <p>我们会继续完善功能，优化体验，谢谢您的打赏！</p>

            <span style="display: block">微信:</span>
            <img src="/static/wx.jpg" class="code" style="width: 200px;height: 200px;"/>
            <br>
            <br>
            <span style="display: block">支付宝:</span>
            <img src="/static/zfb.jpg" class="code" style="width: 205px;height: 205px;"/>

        </el-dialog>

    </div>
</template>

<script>
    import moment from 'moment'
    import _ from 'lodash';
    const crypto = require('crypto');
    import sign from './sign'

    const key = Buffer.from('i4jWS3k4DG02osk3', 'utf8');
    const iv = Buffer.from('SF4eFK7YunE3wV6J', 'utf8');

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
                rewardVisible: false,
                kaihuVisible: false,
                qunVisible: false,
                clientHeight:document.documentElement.clientHeight,
                modalWidth: document.documentElement.clientWidth > 900 ? '30%' : '90%',
                kaihuModalWidth: document.documentElement.clientWidth > 900 ? '55%' : '95%'
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
                    type: 'success',
                    duration:500
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
                    this.dealData(sign.deSign(res.bodyText, key,iv))
                })

                // this.dealData(aesDecrypt(zqData,key))
            },
            dealData(response) {
                response = JSON.parse(response);
                this.data = response;
                this.loading = false;
            },
            check(index, init = 0){
                const count = 1000;
                const filter = this.data[index].values;
                var lucky_number = [];

                init = parseInt(init);

                for(var my = init; my < init+count; my++){

                    for(var indexFilter = 0; indexFilter < filter.length; indexFilter++){
                        if (my.toString().endsWith(filter[indexFilter]) ){
                            lucky_number.push(my);
                            break;
                        }

                    }
                }
                //console.debug(filter)
                //console.debug(lucky_number)
                var result = "共中{0}签。".replace("{0}", lucky_number.length);
                if(lucky_number.length > 0){
                    result = "恭喜您中签了！" + result + "中签号码：";
                    result = result + lucky_number.join(', ');

                    this.$set(this.data, index, {...this.data[index], active: true});
                    this.$message({
                        message: result,
                        type: 'success'
                    });
                }else{
                    this.$set(this.data, index, {...this.data[index], active: false});
                }
            },
        }
    }
</script>

<style>
    body {
        /*background: #909399;*/
        overflow: hidden;
        padding: 0;
        max-width: 375px;
        margin: 0 auto;
        background: #606266;
    }

    #app {
        width: 100%;
        font-family: Helvetica, sans-serif;
        text-align: center;
        background: #fff;
        position: relative;
        /*padding-top: 1.5em;*/
    }

    .header {
        margin: 0;
        padding-top: 20px;
        padding-bottom: 15px;
        color: #909399;
        font-size: 1em;
        border-bottom: 1px solid #EBEEF5;
    }

    .refresh{
        position: absolute;
        top:15px;
        right: 15px;
        color: #909399!important;
    }

    .footer {
        /*width: 100%;*/
        text-align: center;
        position: absolute;
        bottom: 1em;
        color: #ccc;
        font-size: 0.7em;
        left: 0;
        right: 0;
    }

    .el-table_1_column_1 .cell {
        padding-left: 15px !important;
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

    .tiYan .el-dialog__headerbtn {
        top:6px!important;
        right: 10px!important;
    }

    .daShang .el-dialog__body {
        padding-top: 0 !important;
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
        padding-bottom: 15px;
    }
</style>
