//格式化时间戳
export const formatTime = (time) => {
  const _time = new Date(time);
  const y = _time.getFullYear();
  const m = _time.getMonth() + 1;
  const d = _time.getDate();
  return `${y}-${m}-${d}`;
};


//封装wx.request
export const ajax = (url, method, data) => {
  const baseUrl = 'http://localhost:3000';
  return new Promise((resolve, reject) => {
    const requestTask = wx.request({
      url: baseUrl + url,
      method: method ? method : 'GET',
      data,
      timeout: 10000, // 设置10秒超时
      success: (res) => {
        // 检查HTTP状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          // 处理HTTP错误
          const error = new Error(`请求失败: HTTP状态码 ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.response = res;
          reject(error);
        }
      },
      fail: (error) => {
        // 处理网络错误或超时
        if (error.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络连接'));
        } else if (error.errMsg.includes('fail')) {
          reject(new Error('网络连接失败，请检查网络'));
        } else {
          reject(error);
        }
      }
    });
    
    // 返回请求任务，允许调用方中断请求
    return requestTask;
  });
}