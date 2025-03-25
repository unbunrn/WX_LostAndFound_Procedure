import {ajax, formatTime} from '../../utils/index'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabList: ['寻主', '寻物'],
    list: [],
    select: 0,
    searchText: '',
    searchImages: [],
    results: null,
    defaultImage: '/images/common/default_img.png'  // 使用小程序内置的默认图片
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const {index} = e.currentTarget.dataset;
    const {searchImages} = this.data;
    
    wx.previewImage({
      current: searchImages[index],
      urls: searchImages
    });
  },

  /**
   * 处理图片加载错误
   */
  handleImageError(e) {
    const {type, index} = e.currentTarget.dataset;
    const {defaultImage} = this.data;
    
    if (type === 'search') {
      // 处理搜索图片预览的错误
      const {searchImages} = this.data;
      if (searchImages[index]) {
        // 更新数组中指定位置的元素
        this.setData({
          [`searchImages[${index}]`]: defaultImage
        });
      }
    } else if (type === 'result') {
      // 处理结果列表中的图片错误
      console.log('结果图片加载失败，索引:', index);
      // 注意：ViewCard组件需要处理内部图片加载错误
    }
  },

  /**
   * 跳转到详情页
   */
  toDetail(e) {
    const {info} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../infoDetail/infoDetail?LoseId=${info.id}&info=${JSON.stringify(info)}`,
    });
  },

  /**
   * 切换选项卡
   */
  getTab(e) {
    this.setData({
      select: e.detail,
    });
    this.filterResults();
  },

  /**
   * 根据选项卡筛选结果
   */
  filterResults() {
    const {results, select} = this.data;
    
    if (!results || !results.length) {
      this.setData({
        list: []
      });
      return;
    }
    
    try {
      // 根据选项卡筛选结果
      const filteredList = results.filter(item => {
        // 尝试将type转换为数字，因为后端返回的可能是字符串
        const itemType = Number(item.type);
        return !isNaN(itemType) && itemType === select;
      });
      
      this.setData({
        list: filteredList
      });
    } catch (error) {
      console.error('筛选结果时出错:', error);
      this.setData({
        list: []
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    try {
      // 获取传递过来的搜索结果数据
      let results = [];
      
      if (options.results) {
        // 从URL参数中读取搜索结果
        try {
          results = JSON.parse(decodeURIComponent(options.results) || '[]');
        } catch (parseError) {
          console.error('解析搜索结果JSON失败', parseError);
          results = [];
          
          wx.showToast({
            title: '结果格式错误',
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        // 没有传入结果数据
        wx.showToast({
          title: '未接收到搜索结果',
          icon: 'none',
          duration: 2000
        });
      }
      
      // 检查结果是否为空
      if (!results || !Array.isArray(results) || results.length === 0) {
        this.setData({
          results: [],
          searchText: options.searchText || '',
          searchImages: options.searchImages ? JSON.parse(decodeURIComponent(options.searchImages || '[]')) : []
        });
        this.filterResults();
        return;
      }
      
      // 对结果进行预处理和格式化
      results = results.map(item => {
        // 确保item是对象类型
        if (typeof item === 'object' && item !== null) {
          // 确保必要的字段存在，如果不存在则设置默认值
          item.id = item.id || item._id || `id-${Math.random().toString(36).substr(2, 9)}`;
          item.name = item.name || '未命名物品';
          item.date = item.date || formatTime(Date.now());
          item.desc = item.desc || '';
          
          // 处理图片列表，确保是数组
          if (!Array.isArray(item.imgList) || item.imgList.length === 0) {
            item.imgList = [this.data.defaultImage];
          }
          
          // 格式化时间
          if (item.time) {
            item.time = formatTime(item.time);
          } else {
            item.time = formatTime(Date.now());
          }
          
          // 添加相似度显示格式
          if (typeof item.similarity === 'number') {
            item.similarityText = `相似度: ${(item.similarity * 100).toFixed(2)}%`;
          } else {
            item.similarityText = '';
          }
        }
        return item;
      });
      
      this.setData({
        results,
        searchText: options.searchText || '',
        searchImages: options.searchImages ? JSON.parse(decodeURIComponent(options.searchImages || '[]')) : []
      });
      
      // 根据当前选项卡筛选结果
      this.filterResults();
    } catch (error) {
      console.error('加载搜索结果失败', error);
      wx.showToast({
        title: '加载结果失败',
        icon: 'none'
      });
      
      this.setData({
        results: [],
        list: []
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
    // 下拉刷新时重新加载数据
    this.filterResults();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里添加加载更多结果的逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '多模态搜索结果',
      path: '/pages/search/search'
    };
  },

  /**
   * 返回搜索页面
   */
  backToSearch() {
    wx.navigateBack({
      delta: 1
    });
  },
}) 