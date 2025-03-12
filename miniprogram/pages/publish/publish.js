import { ajax } from "../../utils/index";
/*
type:失物招领类型 0-寻主 1-寻物
classify1:一级分类
classify2:二级分类
name:物品名称
date：丢失/拾取物品时间
region：丢失/拾取地点
phone:联系方式
desc:物品描述
imgList：上传的图片
time：发布时间
*/
Page({
  /**
   * 页面的初始数据
   */
  data: {
    //展示的两列数据源，第一列表示的是一级分类，第二列当前展示的二级分类
    multiArray: [
      [
        "卡片、证件类",
        "生活用品",
        "数码产品",
        "美妆护肤类",
        "衣服物品类",
        "饰品",
        "文娱",
        "其它",
      ],
      ["身份证", "校园卡", "学生证", "水卡", "公交卡", "银行卡", "其它"],
    ],
    // 第二列的储备数据源，通过multiArray的第一列索引值，找到对应的数据源
    // 例如，multiArray[0][0] = '卡片、证件类'，那么multiArray[1] = ['身份证', '校园卡', '学生证', '水卡', '公交卡', '银行卡', '其它']
    // 所以，multiArray[0][0] = '卡片、证件类'，multiArray[1][0] = '身份证'
    pickerList: [
      ["身份证", "校园卡", "学生证", "水卡", "公交卡", "银行卡", "其它"],
      ["水杯", "雨伞", "小风扇", "钥匙/钥匙扣", "其它"],
      [
        "手机",
        "相机",
        "U盘/硬盘",
        "充电宝",
        "平板电脑",
        "鼠标",
        "充电线",
        "耳机",
        "手写笔",
        "支架",
        "音箱",
        "MP3",
        "其它",
      ],
      ["口红", "粉底", "眉笔", "腮红", "眼影", "防晒", "喷雾", "香水", "其它"],
      ["男装", "女装", "男鞋", "女鞋", "包包", "其它"],
      ["手表", "项链", "手链", "戒指", "耳饰", "眼镜", "帽子", "发饰", "其它"],
      [
        "教材",
        "笔记",
        "文具",
        "球/球拍",
        "护具",
        "跳绳",
        "自行车",
        "棋牌",
        "其它",
      ],
      ["药品", "零食", "周边", "其它"],
    ],
    multiIndex: [0, 0],
    select: false,
    name: "",
    date: "",
    region: "",
    phone: "",
    desc: "",
    imgList: [],
    type: "",
    id: "",
  },
  async toPublish() {
    const {
      type,
      multiArray,
      multiIndex,
      name,
      date,
      region,
      phone,
      desc,
      imgList,
      select,
      id,
    } = this.data;
    if (id) {
      //修改失物招领信息
      if (!type ||!select ||!name ||!date ||!region ||!phone) {
        wx.showToast({
          title: "未填写必选项",
          icon: "none",
        });
        return;
      }
      const params = {
        type: Number(type),
        classify1: multiArray[0][multiIndex[0]],
        classify2: multiArray[1][multiIndex[1]],
        name,
        date,
        region,
        phone,
        desc,
        imgList,
        time: new Date().getTime(),
        openid: wx.getStorageSync("openid"),
        _id: id,
      };
      const result = await ajax("/editLose", "POST", params);
      const { data } = result;
      console.log(data)
      if (data === "success") {
        wx.switchTab({
          url: "../index/index",
          success: () => {
            wx.showToast({
              title: "修改成功",
              icon: "none",
            });
          },
        }); 
      }else{
        wx.showToast({
          title: "修改失败",
          icon: "none",
        }); 
      }
    } else {
      //发布失物招领信息
      if (!type || !select || !name || !date || !region || !phone) {
        wx.showToast({
          title: "未填写必选项",
          icon: "none",
        });
        return;
      }
      const params = {
        type: Number(type),
        classify1: multiArray[0][multiIndex[0]],
        classify2: multiArray[1][multiIndex[1]],
        name,
        date,
        region,
        phone,
        desc,
        imgList,
        time: new Date().getTime(),
        openid: wx.getStorageSync("openid"),
      };
      const result = await ajax("/publish", "POST", params);
      const { data } = result;
      if (data === "success") {
        wx.switchTab({
          url: "../index/index",
          success: () => {
            wx.showToast({
              title: "发布成功",
              icon: "none",
            });
          },
        });
      } else {
        wx.showToast({
          title: "发布失败",
          icon: "none",
        });
      }
    }
  },

  backPage() {
    this.setData({
      name: "",
      date: "",
      region: "",
      phone: "",
      desc: "",
    });
  },

  selectTap(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      type: id,
    });
  },
  uploadImage(e) {
    const { imgList } = this.data;
    // 如果已经选择了 6 张图片，提示用户
    if (imgList.length >= 6) {
      wx.showToast({
        title: "最多只能选择 6 张图片",
        icon: "none",
      });
      return;
    }
    wx.chooseMedia({
      count: 6 - imgList.length, // 最多选择 6 张图片
      mediaType: ["image"], // 只允许选择图片
      sourceType: ["album", "camera"], // 允许从相册或相机选择
      success: (res) => {
        const { tempFiles } = res; // 获取用户选中的图片文件
        tempFiles.forEach((item, index) => {
          wx.uploadFile({
            //上传至后端
            url: "http://localhost:3000/uploadImg", // 替换为你的服务器地址
            filePath: item.tempFilePath,
            name: "file",
            success: (res) => {
              const { data } = res;
              let { path } = JSON.parse(data)[0];
              //微信小程序问题：file\6eec4f91-0647-47a9-8eed-a7d54cf81c3f.jpg
              //无法识别图片路径中的\,将path字符串分离重组
              let path1 = path.split("\\");
              let _path = `http://localhost:3000/${path1[0]}/${path1[1]}`;
              imgList.unshift(_path);
              this.setData({
                imgList,
              });
            },
            fail: (err) => {
              console.error("上传失败", err);
            },
          });
        });
      },
      fail: (err) => {
        console.error("选择图片失败:", err);
        wx.showToast({
          title: "选择图片失败",
          icon: "none",
        });
      },
    });
  },
  delImage(e) {
    let { index } = e.currentTarget.dataset;
    let { imgList } = this.data;
    imgList.splice(index, 1);
    this.setData({
      imgList,
    });
  },

  delDesc(e) {
    this.setData({
      desc: "",
    });
  },

  getName(e) {
    this.setData({
      name: e.detail.value,
    });
  },
  getDate(e) {
    this.setData({
      date: e.detail.value,
    });
  },
  getRegion(e) {
    this.setData({
      region: e.detail.value,
    });
  },
  getPhone(e) {
    this.setData({
      phone: e.detail.value,
    });
  },
  getDesc(e) {
    this.setData({
      desc: e.detail.value.trim(),
    });
  },

  // 当用户点击确定按钮，用于获取用户最终选择的值
  bindMultiPickerChange(e) {
    this.setData({
      select: true,
    });
  },

  // 当用户滑动某一列，改变该列的选择时触发。用于动态更新其他列的数据
  bindMultiPickerColumnChange(e) {
    let { column, value } = e.detail;
    let data = this.data;
    let { multiArray, pickerList } = this.data;
    if (column === 0) {
      //滑动的为第一列时
      //替换展示资源
      multiArray[1] = pickerList[value];
    }
    //修改multiArray，实时渲染页面
    data.multiArray = multiArray;
    data.multiIndex[column] = value;
    this.setData(data);
  },

  closeSelect() {
    this.setData({
      select: false,
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const { id } = options;
    const { multiArray, pickerList } = this.data;
    if (id) {
      const params = {
        _id: id,
      };
      const { data } = await ajax("/getLoseDetail", "POST", params);
      const {
        type,
        classify1,
        classify2,
        name,
        date,
        region,
        phone,
        desc,
        imgList,
      } = data;
      //根据classify1在multiArray[0]中找到对应的索引值
      const index1 = multiArray[0].findIndex((item) => item === classify1);
      //根据已经确定的一级分类的index1，在pickerList中找到对应的二级分类的数据源，然后在该数据源中找到对应的二级分类的索引值
      const index2 = pickerList[index1].findIndex((item) => item === classify2);
      this.setData({
        type: String(type),
        multiArray: [multiArray[0], pickerList[index1]],
        multiIndex: [index1, index2],
        name,
        date,
        region,
        phone,
        desc,
        imgList,
        select: true,
        id,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
