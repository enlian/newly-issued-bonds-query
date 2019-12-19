<template>
    <div id="app">
        <!-- <p class="title">输入配号查询是否中签</p>-->
        <el-form :inline="true" v-if="!loading && data">
            <div v-for="(item, index) in data">
                <el-form-item :label='item.name'>
                    <el-input :clearable=true
                              minlength='4'
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

        <p class="footer">Code By 稳，只为让你更早知道真相<br/>仅供个人使用，请勿用于商业用途</p>
    </div>
</template>

<script>
    import moment from 'moment'
    import data from './../static/data'
    import _ from 'lodash';

    export default {
        data() {
            return {
                data: null,
                loading: true,
                list:null
            }
        },
        mounted() {
            // this.getData();
            this.getLocalData();
            // this.getListNum();
        },
        methods: {
            //获取昨天打的债券列表
            getList(){
                let _t = new Date().getTime();

                this.$axios
                    .get(`http://data.10jqka.com.cn/ipo/kzz/?t=${_t}`)
                    .then(res => {
                        if(_.get(res,'data.status_code')===0){
                            let yesterday = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
                            const list = _.find(res.data.list,['sub_date',yesterday]);
                            console.log(list)
                            this.list = list;
                        }
                    }).catch(() => {
                }).finally(() => {
                })
            },
            //获取昨天打的债券中签号
            getListNum(){
                this.$axios
                    .get(`http://dcfm.eastmoney.com/em_mutisvcexpandinterface/api/js/get?type=KZZ_ZQH&token=70f12f2f4f091e459a279469fe49eca5&filter=(BONDCODE=%27128086%27)`)
                    .then(res => {

                    }).catch(() => {
                }).finally(() => {
                })
            },
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
                // let _t = new Date().getTime();
                //
                // this.$http.get(`/static/data.txt?t=${_t}`).then(res => {
                //     this.dealData(res.bodyText)
                // })
                this.dealData(data)
            },
            dealData(response) {
                // response = response.replace(/\s*/g, "");
                // response = eval('(' + response + ')');
                let data = [];
                Object.keys(response).forEach((key) => {
                    data.push({
                        name: key,
                        values: response[key]
                    })
                });
                this.data = data;
                this.loading = false;
            },
            check(index, value = '0') {
                value = value.toString();
                let data = this.data[index].values;
                data = data.split(",");
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
    }

    #app {
        font-family: Helvetica, sans-serif;
        text-align: center;
        padding-top: 2em;
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
        font-size: 0.8em;
    }
</style>
