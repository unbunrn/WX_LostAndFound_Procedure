// pages/search/search.js
// 1.*页面加载时（onLoad）从缓存中获取搜索日志（`searchLog`）将获取到的日志赋值给页面数据，以便展示。
// 2. 页面内，使用 `wx:for` 指令在页面中动态渲染 `searchLog` 数据。
// 3. 搜索框延迟响应时：将本次搜索内容添加到缓存中 `searchLog` 数据的头部。更新页面内的数据，以实现动态展示效果。
import {ajax,formatTime} from '../../utils/index';
let t = null;//用于存储定时器
Page({
  /**
   * 页面的初始数据
   */
  data: {
    search:'',//延迟响应_最近搜索用
    _search:'',//及时响应_搜索框删除用
    searchLog:[],//搜索历史
    search_res:[]//模糊搜索结果
  },

  toSearchHistory(e){
    const{name} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../searchHistory/searchHistory?name=${name}`,
    })                         
  },

  toDetail(e){
    const{info} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../infoDetail/infoDetail?info=${JSON.stringify(info)}`,
    })
  },

  delSearch(){
    this.setData({
      search:'',
      _search:''
    })
  },
  delLog(){
    this.setData({//删除视图内
      searchLog:[]
    })
    wx.removeStorageSync('searchLog')//删除缓存中
  },
  
  getSearch(e) {
    // 实时更新输入框内容
    this.setData({
      _search: e.detail.value
    });
    // 防抖处理
    if (t) clearTimeout(t); // 如果已有定时器，清除它
    t = setTimeout(async() => { // 设置新的定时器
      this.setData({
        search: e.detail.value // 更新搜索内容
      });
      // 获取缓存中的搜索记录
      let searchLog = wx.getStorageSync('searchLog');
      if (searchLog) { // 如果有缓存
        // 如果用户多次输入相同内容，在添加新记录时检查是否已存在：
        if (!searchLog.includes(e.detail.value)) {
          searchLog.unshift(e.detail.value);
        }
      } else { // 如果没有缓存
        searchLog = [e.detail.value]; // 初始化新数组
      }
      // 将更新后的搜索记录存储到缓存
      wx.setStorageSync('searchLog', searchLog);
      // 更新页面数据，动态展示搜索记录
      this.setData({
        searchLog
      });

      const params = {
        name:e.detail.value
      };
      const result = await ajax('/searchLose','GET',params);
      this.setData({
        search_res:result.data
      })
    }, 1000); // 延迟 1 秒执行


  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const searchLog =wx.getStorageSync('searchLog')
    this.setData({
      searchLog
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})