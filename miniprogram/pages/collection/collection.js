// pages/collection/collection.js
import {ajax} from '../../utils/index';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList:['寻主','寻物'],
    select:0,
    list:[]
  },
  toDetail(e){
    const{info} = e.currentTarget.dataset;
    // 添加isCollected标记，因为从收藏页面进入的一定是已收藏状态
    info.isCollected = true;
    wx.navigateTo({
      url: `../infoDetail/infoDetail?info=${JSON.stringify(info)}&from=collection`,
    })
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
    try {
      const { select } = this.data;
      const openid = wx.getStorageSync('openid');
      
      // 检查登录状态
      if (!openid) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      const params = {
        openid,
        type: select
      };
      
      const result = await ajax('/getCollection', 'GET', params);
      
      if (!result || !result.data) {
        throw new Error('获取收藏数据失败');
      }
      
      this.setData({
        list: result.data,
        login: true
      });
    } catch (error) {
      console.error('加载收藏数据失败:', error);
      wx.showToast({
        title: '加载收藏失败',
        icon: 'none'
      });
      this.setData({
        list: [],
        login: false
      });
    }
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
        select: 3,
      });
    }
    // 每次显示页面时重新加载数据
    this.onLoad();
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