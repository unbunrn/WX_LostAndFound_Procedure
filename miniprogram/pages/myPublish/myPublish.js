// pages/collection/collection.js
import {ajax,formatTime} from '../../utils/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList:['寻主','寻物'],
    list:[],
    select:0
  },

  toDetail(e){
    const{info} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../infoDetail/infoDetail?LoseId=${info.id}&info=${JSON.stringify(info)}`,
    })
  },
  getEdit(e){
    const id = e.detail;
    wx.navigateTo({
      url: `../publish/publish?id=${id}`,
    })
  },
  async getDelete(e){
    const _id = e.detail;
    const params = {
      _id
    }
    const result = await ajax("/delLose","POST",params);
    const{data} = result;
    if(data=="success"){
      wx.showToast({
        title: '删除成功',
        icon: 'success', 
      })
    }else{
      wx.showToast({
        title: '删除失败',
        icon:'error', 
      })
    }
    this.onLoad();
  },

  getTab(e){
    this.setData({
      select:e.detail,
    })
    this.onLoad();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const params = {
      openid:wx.getStorageSync('openid'),
      type:this.data.select
      
    };
    const result = await ajax('/getMyPublish','GET',params);
    const {data} = result;
    this.setData({       
      list:data.map(item => {  // 对data数组进行遍历转换
        item.time = formatTime(item.time);  // 修改每个item的time属性
        return item;     // 返回修改后的item
      })
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

    if(typeof this.getTabBar === 'function' && this.getTabBar()){
      this.getTabBar().setData({
        select :3,
      })
    }
  
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