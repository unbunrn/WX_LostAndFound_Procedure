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
    const { info, collectionIcon, from } = this.data;
    
    // 获取openid，检查登录状态
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      wx.showToast({ 
        title: '请先登录', 
        icon: 'none' 
      });
      return;
    }

    // 通过图标状态判断当前是否已收藏
    const isCurrentlyCollected = collectionIcon[0] === '../../images/collection2.png';
    
    // 统一处理ID - 无论从哪里进入，统一使用物品的_id
    // 如果是从收藏页进入，则直接使用物品的_id；如果是普通进入，则使用info._id
    const itemId = info._id || info.id;
    
    if (!isCurrentlyCollected) {
      // 收藏操作：组装需要保存的数据 - 只需要保存必要的字段
      const params = {
        id: itemId,
        openid: openid
      };

      // 发送收藏请求
      try {
        const result = await ajax('/toCollection', 'POST', params);
        if (result.data === 'success' || result.data === 'already_collected') {
          // 收藏成功提示
          wx.showToast({ title: '收藏成功', icon: 'success' });  
          // 切换图标顺序：把已收藏图标放到数组第一个位置
          this.setData({ 
            collectionIcon: ['../../images/collection2.png', '../../images/collection1.png'],
            'info.isCollected': true
          });
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } else {
      // 取消收藏操作：组装请求参数
      const params = {
        id: itemId,
        openid: openid
      };
      
      // 发送取消收藏请求
      try {
        const result = await ajax('/cancelCollection', 'POST', params);
        if (result.data === 'success') {
          // 取消收藏提示
          wx.showToast({ title: '取消收藏', icon: 'success' });
          
          // 切换图标
          this.setData({ 
            collectionIcon: ['../../images/collection1.png', '../../images/collection2.png'],
            'info.isCollected': false
          });
          
          // 如果是从收藏页进入，可以返回上一页
          if (from === 'collection') {
            setTimeout(() => {
              wx.navigateBack();
            }, 500);
          }
        }
      } catch (error) {
        console.error('取消收藏操作失败:', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
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
    const parsedInfo = JSON.parse(info);
    
    this.setData({ 
      info: parsedInfo,
      from
    });

    // 如果从收藏页面点进来，物品已经带有isCollected标记，直接设置收藏状态
    if (parsedInfo.isCollected) {
      this.setData({ 
        collectionIcon: ['../../images/collection2.png', '../../images/collection1.png']
      });
      return;
    }

    // 否则检查当前用户是否已收藏该物品
    try {
      const openid = wx.getStorageSync('openid');
      if (!openid) return;
      
      // 统一使用物品的_id
      const itemId = parsedInfo._id || parsedInfo.id;
      
      const params = {
        id: itemId,
        openid: openid
      };
      
      const result = await ajax('/isCollection', 'POST', params);
      
      // 如果已收藏，直接设置收藏图标
      if (result.data && result.data.length > 0) {
        this.setData({
          collectionIcon: ['../../images/collection2.png', '../../images/collection1.png'],
          'info.isCollected': true
        });
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
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