import { ajax } from '../../utils/index';
// 页面逻辑
Page({
  /**
   * 页面初始数据（相当于组件的状态）
   */
  data: {
    // 收藏图标数组：[未收藏图标, 已收藏图标]
    collectionIcon: ['../../images/collection1.png', '../../images/collection2.png'],
    // 当前展示的物品详细信息
    info: {},
    from:''
  },

  /**
   * 处理收藏/取消收藏操作（核心功能）
   */
  async toCollection() {
    const { info, collectionIcon,from } = this.data;

    // 通过图标状态判断当前是否已收藏
    if (collectionIcon[0] === '../../images/collection1.png') {
      // 收藏操作：组装需要保存的数据 
      const params = {
        ...info,             
        id: info._id,//物品唯一标识
        openid: wx.getStorageSync('openid') // 用户身份标识
      };
      // 发送收藏请求
      const result = await ajax('/toCollection', 'POST', params);
      if (result.data === 'success') {
        // 收藏成功提示
        wx.showToast({ title: '收藏成功', icon: 'success' });  
        // 切换图标顺序：把已收藏图标放到数组第一个位置
        let last = collectionIcon.pop();
        collectionIcon.unshift(last);
        this.setData({ collectionIcon });
      }
    } else {
      // 取消收藏操作：组装请求参数
      console.log(from)
      const params = {
        id:from ==='collection'?info.id:info._id,//物品唯一标识
        openid: wx.getStorageSync('openid')
      };
      // 发送取消收藏请求
      const result = await ajax('/cancelCollection', 'POST', params);
      if (result.data === 'success') {
        // 取消收藏提示
        wx.showToast({ title: '取消收藏', icon: 'success' });
        
        // 切换图标顺序：把未收藏图标放回第一个位置
        let last = collectionIcon.pop();
        collectionIcon.unshift(last);
        this.setData({ collectionIcon });
      }
    }
  },

  /**
   * 显示联系方式弹窗
   */
  getPhone() {
    const { info:{phone} } = this.data;
    wx.showModal({
      title: '联系方式',
      content: phone,   // 脱敏显示
      confirmText: '复制',
      complete: (res) => {
        if (res.confirm) {
          // 实际复制完整号码（这里演示用固定值）
          wx.setClipboardData({
            data: phone,
            success: () => {
              wx.showToast({ title: '内容已复制', icon: 'none' })
            } 
          });
        }
      }
    });
  },

  /**
   * 页面加载时执行（重要初始化操作）
   */
  async onLoad(options) {
    // 接收页面跳转时传递的物品信息
    const{info,from} = options;
    this.setData({ 
      info: JSON.parse(info),
      from
    
    });

    // 检查当前用户是否已收藏该物品
    const params = {
      id:from ==='collection'?JSON.parse(info).id:JSON.parse(info)._id,//物品唯一标识,
      openid: wx.getStorageSync('openid')
    };
    const result = await ajax('/isCollection', 'POST', params);
    
    // 如果已收藏，切换图标状态
    if (result.data.length > 0) {
      const icons = this.data.collectionIcon;
      icons.unshift(icons.pop()); // 交换图标顺序
      this.setData({ collectionIcon: icons });
    }
  },

  // 以下为小程序生命周期函数（根据需求添加具体逻辑）
  
  /**
   * 页面初次渲染完成（适合操作DOM）
   */
  onReady() {},

  /**
   * 页面显示时触发（适合刷新数据）
   */
  onShow() {},

  /**
   * 页面隐藏时触发（适合保存临时状态）
   */
  onHide() {},

  /**
   * 页面卸载时触发（适合清理资源）
   */
  onUnload() {},

  /**
   * 下拉刷新功能（需要手动停止刷新动画）
   */
  onPullDownRefresh() {
    wx.stopPullDownRefresh(); // 示例停止刷新
  },

  /**
   * 上拉触底加载更多（适合分页场景）
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});