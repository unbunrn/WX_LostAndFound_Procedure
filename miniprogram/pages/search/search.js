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
    search_res:[],//模糊搜索结果
    multimodalText: '', // 多模态搜索文本
    multimodalImages: [], // 多模态搜索图片列表
    lastSearchTime: 0, // 上次搜索时间戳
    loadingState: false, // 图片加载状态
    tempFilesCount: 0 // 新上传的图片数量
  },

  // 监听多模态搜索文本输入
  getMultimodalText(e) {
    this.setData({
      multimodalText: e.detail.value
    });
  },

  // 处理搜索框中的回车确认事件
  confirmSearch(e) {
    // 获取关键词，可能来自输入框或点击"查看全部"按钮
    let keyword = '';
    if (e.detail && e.detail.value) {
      // 从输入框回车事件获取关键词
      keyword = e.detail.value.trim();
    } else if (e.currentTarget && e.currentTarget.dataset) {
      // 从"查看全部"按钮获取关键词
      keyword = e.currentTarget.dataset.keyword.trim();
    }

    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    // 保存到搜索历史
    const searchLog = wx.getStorageSync('searchLog') || [];
    if (!searchLog.includes(keyword)) {
      searchLog.unshift(keyword);
      // 限制历史记录数量，最多保存20条
      if (searchLog.length > 20) {
        searchLog = searchLog.slice(0, 20);
      }
      wx.setStorageSync('searchLog', searchLog);
      this.setData({
        searchLog
      });
    }

    // 跳转到搜索历史页面展示结果
    wx.navigateTo({
      url: `../searchHistory/searchHistory?name=${keyword}`
    });
  },

  // 上传多模态搜索图片
  uploadMultimodalImage() {
    const { multimodalImages } = this.data;
    if (multimodalImages.length >= 6) {
      wx.showToast({
        title: '最多上传6张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: 6 - multimodalImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 将新选择的图片添加到现有图片列表中
        const newImages = [...multimodalImages, ...res.tempFilePaths];
        this.setData({
          multimodalImages: newImages
        });
      }
    });
  },

  // 删除多模态搜索图片
  deleteMultimodalImage(e) {
    const { index } = e.currentTarget.dataset;
    const { multimodalImages } = this.data;
    multimodalImages.splice(index, 1);
    this.setData({
      multimodalImages
    });
  },

  // 清空多模态搜索内容
  clearMultimodalSearch() {
    this.setData({
      multimodalText: '',
      multimodalImages: []
    });
  },

  // 开始多模态搜索
  async startMultimodalSearch() {
    const { multimodalText, multimodalImages, lastSearchTime } = this.data;
    
    // 防止短时间内重复搜索
    const currentTime = Date.now();
    if (currentTime - lastSearchTime < 3000) { // 3秒内不允许重复搜索
      wx.showToast({
        title: '请勿频繁搜索',
        icon: 'none'
      });
      return;
    }
    
    // 更新最后搜索时间
    this.setData({
      lastSearchTime: currentTime
    });
    
    // 检查搜索条件
    if (!multimodalText && multimodalImages.length === 0) {
      wx.showToast({
        title: '请输入文字或上传图片',
        icon: 'none'
      });
      return;
    }
    
    let imageUrls = [];
    
    try {
      // 如果有图片，先上传所有图片
      if (multimodalImages.length > 0) {
        try {
          // 显示上传中的加载状态
          wx.showLoading({
            title: '上传图片中...',
            mask: true
          });
          
          // 创建上传任务的Promise数组
          const uploadPromises = multimodalImages.map(image => this.uploadFile(image));
          // 等待所有图片上传完成
          const uploadResults = await Promise.all(uploadPromises);
          // 收集上传后的图片URL
          imageUrls = uploadResults.map(result => result.url);
          
          // 隐藏上传中的加载状态
          wx.hideLoading();
        } catch (uploadError) {
          console.error('图片上传失败', uploadError);
          wx.hideLoading(); // 确保上传失败时也隐藏loading
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
          return; // 上传失败就退出函数，避免继续执行
        }
      }
      
      // 显示搜索中的加载状态
      wx.showLoading({
        title: '搜索中...',
        mask: true
      });
      
      // 准备搜索参数
      const params = {
        text: multimodalText || '',
        images: imageUrls,
        textWeight: 0.5,
        imageWeight: 0.5
      };
      
      console.log('多模态搜索参数:', params);
      
      try {
        // 发送多模态搜索请求
        const result = await ajax('/multimodalSearch', 'POST', params);
        
        // 检查搜索结果
        if (!result || !result.data) {
          throw new Error('搜索结果为空');
        }
        
        // 检查是否有success字段
        if (result.data.success === false) {
          // 显示后端返回的错误信息
          wx.showToast({
            title: result.data.message || '搜索失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        // 获取数据，兼容两种数据结构
        let searchResults = result.data.data || result.data;
        
        // 检查结果是否为空
        if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
          wx.showToast({
            title: '未找到匹配的结果',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        // 准备跳转参数
        const resultsParam = JSON.stringify(searchResults);
        
        // 直接跳转到结果页面，不使用缓存
        wx.navigateTo({
          url: `../multimodalResults/multimodalResults?results=${encodeURIComponent(resultsParam)}&searchText=${multimodalText}&searchImages=${encodeURIComponent(JSON.stringify(imageUrls))}`
        });
      } catch (error) {
        console.error('多模态搜索请求失败:', error);
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage = '搜索失败，请稍后重试';
        
        if (error.message && error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络';
        } else if (error.message && error.message.includes('超时')) {
          errorMessage = '搜索请求超时，请稍后重试';
        } else if (error.message) {
          errorMessage = error.message.length > 20 ? error.message.substring(0, 20) + '...' : error.message;
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        });
      }
      
    } catch (error) {
      console.error('多模态搜索过程出错', error);
      wx.showToast({
        title: '搜索出错，请重试',
        icon: 'none'
      });
    } finally {
      // 确保无论如何都会隐藏loading
      wx.hideLoading();
    }
  },

  // 上传文件的辅助函数
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      const uploadTask = wx.uploadFile({
        url: "http://localhost:3000/uploadImg", // 与publish.js中使用相同的上传地址
        filePath: filePath,
        name: "file",
        timeout: 15000, // 15秒超时时间
        formData: {
          // 可以添加额外的表单数据
          type: 'search_image'
        },
        success: function(res) {
          try {
            // 检查服务器返回的状态码
            if (res.statusCode !== 200) {
              throw new Error(`服务器返回错误: ${res.statusCode}`);
            }
            
            const { data } = res;
            // 尝试解析返回的JSON数据
            let parsedData;
            try {
              parsedData = JSON.parse(data);
            } catch (e) {
              throw new Error('无法解析服务器响应: ' + e.message);
            }
            
            if (!parsedData || !parsedData.length || !parsedData[0].path) {
              throw new Error('服务器返回数据格式错误');
            }
            
            let { path } = parsedData[0];
            // 处理路径分隔符问题
            let path1 = path.split("\\");
            let _path = `http://localhost:3000/${path1[0]}/${path1[1]}`;
            
            resolve({
              url: _path,
              status: 'success'
            });
          } catch (e) {
            reject(new Error('解析响应失败: ' + e.message));
          }
        },
        fail: function(err) {
          // 处理不同类型的错误
          let errorMessage = '上传图片失败';
          
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              errorMessage = '上传超时，请检查网络连接';
            } else if (err.errMsg.includes('fail')) {
              errorMessage = '网络连接失败，请检查网络';
            } else {
              errorMessage = err.errMsg;
            }
          }
          
          console.error(errorMessage, err);
          reject(new Error(errorMessage));
        }
      });
      
      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        // 可以在这里处理上传进度
        // console.log('上传进度', res.progress);
      });
    });
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
      
      if (e.detail.value) {
        try {
          const params = {
            name: e.detail.value
          };
          const result = await ajax('/searchLose', 'GET', params);
          this.setData({
            search_res: result.data
          });
          
          // 保存到搜索历史
          if (e.detail.value) {
            // 获取缓存中的搜索记录
            let searchLog = wx.getStorageSync('searchLog') || [];
            // 如果用户多次输入相同内容，在添加新记录时检查是否已存在：
            if (!searchLog.includes(e.detail.value)) {
              searchLog.unshift(e.detail.value);
              // 限制历史记录数量，最多保存20条
              if (searchLog.length > 20) {
                searchLog = searchLog.slice(0, 20);
              }
            }
            // 将更新后的搜索记录存储到缓存
            wx.setStorageSync('searchLog', searchLog);
            // 更新页面数据，动态展示搜索记录
            this.setData({
              searchLog
            });
          }
        } catch (error) {
          console.error('实时搜索失败', error);
        }
      } else {
        this.setData({
          search_res: []
        });
      }
    }, 500); // 延迟 0.5 秒执行，提高响应速度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const searchLog = wx.getStorageSync('searchLog') || [];
    this.setData({
      searchLog
    });
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
    // 每次显示页面时刷新历史记录
    const searchLog = wx.getStorageSync('searchLog') || [];
    this.setData({
      searchLog
    });
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
    // 清除定时器，防止内存泄漏
    if (t) {
      clearTimeout(t);
      t = null;
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时可以重新执行上次常规搜索
    if (this.data.search) {
      this.getSearch({
        detail: { value: this.data.search }
      });
    }
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里添加加载更多搜索结果的逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '搜索发现',
      path: '/pages/search/search'
    }
  },

  // 选择多模态搜索的图片
  chooseMultimodalImages() {
    const { multimodalImages } = this.data;
    
    // 限制最多选择3张图片
    const maxImageCount = 3;
    if (multimodalImages.length >= maxImageCount) {
      wx.showToast({
        title: `最多只能选择${maxImageCount}张图片`,
        icon: 'none'
      });
      return;
    }
    
    wx.chooseMedia({
      count: maxImageCount - multimodalImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const { tempFiles } = res;
        const newImages = tempFiles.map(item => item.tempFilePath);
        
        this.setData({
          multimodalImages: [...multimodalImages, ...newImages],
          loadingState: true,
          tempFilesCount: tempFiles.length
        });
        
        // 短暂延迟后移除加载状态
        setTimeout(() => {
          this.setData({
            loadingState: false
          });
        }, 500);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除已选择的多模态搜索图片
  deleteMultimodalImage(e) {
    const { index } = e.currentTarget.dataset;
    const { multimodalImages } = this.data;
    
    multimodalImages.splice(index, 1);
    
    this.setData({
      multimodalImages
    });
  },
})