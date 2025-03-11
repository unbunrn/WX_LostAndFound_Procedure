//格式化时间戳
export const formatTime = (time) => {
  const _time = new Date(time);
  const y = _time.getFullYear();
  const m = _time.getMonth() + 1;
  const d = _time.getDate();
  return `${y}-${m}-${d}`;
};


//封装wx.request
export const ajax = (url, method ,data) => {
  const baseUrl = 'http://localhost:3000';
  return new Promise((resolve,reject) => {
    wx.request({
      url: baseUrl + url,
      method: method?method:'GET',
      data,
      success: (res) => {
        resolve(res);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}