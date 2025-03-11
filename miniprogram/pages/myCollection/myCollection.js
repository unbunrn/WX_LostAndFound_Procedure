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
    const { select } = this.data;
    const openid = wx.getStorageSync('openid');
    const params = {
      openid,
      type:select
    };
    const result = await ajax('/getCollection','GET',params);
    this.setData({
      list:result.data
    })

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
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