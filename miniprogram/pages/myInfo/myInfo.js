// pages/myInfo/myInfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl:'',
    nickName:'',
    edit: false,
    //输入框中的
    phone:'',
    //缓冲中的
    _phone:''
  },
  getPhone(e){
    const{value} = e.detail;
    this.setData({
      phone:value
    })
  },
  delPhone(e){
    this.setData({
      phone:''
    })
  },

  toEdit(){
    this.setData({
      edit : !this.data.edit,
      phone : this.data._phone
    })
  },

  saveChange(){
    // const regex = /^1[3-9]\d{9}$/; 
    // if(!regex.test(this.data.phone)){
    //   wx.showToast({
    //     icon:'none',
    //     title: '手机号格式不对!',
    //   })
    //   return;
    // }
    let userInfo = wx.getStorageSync('userInfo');
    userInfo = {
      ...userInfo,
      phone:this.data.phone
    }
    wx.setStorageSync('userInfo', userInfo)
    this.setData({
      edit:false,
      _phone:this.data.phone
    })
  },

  /**
   * 生命周期函数--监听页面加载 
   */
  onLoad(options) {
    const {avatarUrl,nickName,phone} = wx.getStorageSync('userInfo');
    this.setData({
      avatarUrl,
      nickName,
      _phone:phone,
      phone
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