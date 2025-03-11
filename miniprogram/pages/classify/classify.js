// 一级分类 ['卡片、证件类', '生活用品', '数码产品', '美妆护肤类', '衣服物品类', '饰品', '文娱', '其它'],
// 二级分类 [
//             ['身份证', '校园卡', '学生证', '水卡', '公交卡', '银行卡', '其它'],
//             ['水杯', '雨伞', '小风扇', '钥匙/钥匙扣', '其它'],
//             ['手机', '相机', 'U盘/硬盘', '充电宝', '平板电脑', '鼠标', '充电线', '耳机', '手写笔', '支架', '音箱', 'MP3', '其它'],
//             ['口红', '粉底', '眉笔', '腮红', '眼影', '防晒', '喷雾', '香水', '其它'],
//             ['男装', '女装', '男鞋', '女鞋', '包包', '其它'],
//             ['手表', '项链', '手链', '戒指', '耳饰', '眼镜', '帽子', '发饰', '其它'],
//             ['教材', '笔记', '文具', '球/球拍', '护具', '跳绳', '自行车', '棋牌', '其它'],
//             ['药品', '零食', '周边', '其它']
//         ],
Page({

  /**
   * 页面的初始数据
   */
  data: {
    asideBar:["卡片证件类","生活用品","数码产品","美妆护肤类","衣服物品类","饰品","文娱","其他"],
    rightList:[
      // 卡片证件类
      [
        { url: "../../images/id_card.png", text: "身份证" },
        { url: "../../images/bank_card.png", text: "银行卡" },
        { url: "../../images/campus_card.png", text: "校园卡" },
        { url: "../../images/student_card.png", text: "学生证" },
        { url: "../../images/water_card.png", text: "水卡" },
        { url: "../../images/transit_card.png", text: "公交卡" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 生活用品
      [
        { url: "../../images/cup.png", text: "水杯" },
        { url: "../../images/umbrella.png", text: "雨伞" },
        { url: "../../images/fan.png", text: "小风扇" },
        { url: "../../images/key_keychain.png", text: "钥匙/钥匙扣" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 数码产品
      [
        { url: "../../images/smartphone.png", text: "手机" },
        { url: "../../images/camera.png", text: "相机" },
        { url: "../../images/usb_hdd.png", text: "U盘/硬盘" },
        { url: "../../images/power_bank.png", text: "充电宝" },
        { url: "../../images/tablet.png", text: "平板电脑" },
        { url: "../../images/mouse.png", text: "鼠标" },
        { url: "../../images/charging_cable.png", text: "充电线" },
        { url: "../../images/earphones.png", text: "耳机" },
        { url: "../../images/stylus.png", text: "手写笔" },
        { url: "../../images/phone_stand.png", text: "支架" },
        { url: "../../images/speaker.png", text: "音箱" },
        { url: "../../images/mp3_player.png", text: "MP3" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 美妆护肤类
      [
        { url: "../../images/lipstick.png", text: "口红" },
        { url: "../../images/foundation.png", text: "粉底" },
        { url: "../../images/eyebrow_pencil.png", text: "眉笔" },
        { url: "../../images/blush.png", text: "腮红" },
        { url: "../../images/eyeshadow.png", text: "眼影" },
        { url: "../../images/sunscreen.png", text: "防晒" },
        { url: "../../images/facial_spray.png", text: "喷雾" },
        { url: "../../images/perfume.png", text: "香水" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 衣服物品类
      [
        { url: "../../images/mens_clothing.png", text: "男装" },
        { url: "../../images/womens_clothing.png", text: "女装" },
        { url: "../../images/mens_shoes.png", text: "男鞋" },
        { url: "../../images/womens_shoes.png", text: "女鞋" },
        { url: "../../images/handbag.png", text: "包包" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 饰品
      [
        { url: "../../images/wristwatch.png", text: "手表" },
        { url: "../../images/necklace.png", text: "项链" },
        { url: "../../images/bracelet.png", text: "手链" },
        { url: "../../images/ring.png", text: "戒指" },
        { url: "../../images/earrings.png", text: "耳饰" },
        { url: "../../images/glasses.png", text: "眼镜" },
        { url: "../../images/hat.png", text: "帽子" },
        { url: "../../images/hair_accessory.png", text: "发饰" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 文娱
      [
        { url: "../../images/textbook.png", text: "教材" },
        { url: "../../images/notebook.png", text: "笔记" },
        { url: "../../images/stationery.png", text: "文具" },
        { url: "../../images/ball_racket.png", text: "球/球拍" },
        { url: "../../images/knee_pad.png", text: "护具" },
        { url: "../../images/jump_rope.png", text: "跳绳" },
        { url: "../../images/bicycle.png", text: "自行车" },
        { url: "../../images/chess.png", text: "棋牌" },
        { url: "../../images/others.png", text: "其它" }
      ],
      // 其他
      [
        { url: "../../images/medicine.png", text: "药品" },
        { url: "../../images/snacks.png", text: "零食" },
        { url: "../../images/merchandise.png", text: "周边" },
        { url: "../../images/others.png", text: "其它" }
      ]
  
    ],
    select:0,
  },
  toSearch(){
    wx.navigateTo({
      url: '../search/search',
    })
  },

  toClassify(e){
    const {text} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../classifyList/classifyList?text=${text}`,
    })

  },

  select_left(e){
    const{index} = e.currentTarget.dataset;
    this.setData({
      select : index
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if(typeof this.getTabBar === 'function'&&this.getTabBar()){
      this.getTabBar().setData({
        select :1
      })
    }
  
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