import {ajax,formatTime} from '../../utils/index'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList:['寻主','寻物'],
    list:[],
    select:0,
    text:''
  },

  toDetail(e){
    const{info} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../infoDetail/infoDetail?LoseId=${info.id}&info=${JSON.stringify(info)}`,
    })
  },

  getTab(e){
    const{text} = this.data;
    this.setData({
      select:e.detail,
    })
    this.onLoad({text});
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const {select} = this.data;
    const{text}  =options;
    this.setData({
      text
    })
    const params = {
      type:select,       
      classify2:text
    }
    const result = await ajax('/getClassify2','POST',params);
    this.setData({       
      list:result.data.map(item => {  // 对data数组进行遍历转换
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