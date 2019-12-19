import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import axios from 'axios'
import VueResource from 'vue-resource'

Vue.prototype.$axios = axios
axios.defaults.baseURL = '/api'  //关键代码

Vue.use(VueResource)
Vue.use(ElementUI)

new Vue({
    el: '#app',
    render: h => h(App)
})
