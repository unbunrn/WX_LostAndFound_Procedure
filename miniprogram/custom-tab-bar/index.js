Component({
  data : {
    select :0,
    list :[
      {
        iconPath: "/images/index.png",
        pagePath: "/pages/index/index",
        selectedIconPath: "/images/index_s.png",
        text: "首页",
        type: 0,
      },
      {
        iconPath: "/images/classify.png",
        pagePath: "/pages/classify/classify",
        selectedIconPath: "/images/classify_s.png",
        text: "分类",
        type: 0,
      },
      {
        type: 1,
        pagePath: "/pages/publish/publish",
        
      }
      ,
      {
        iconPath: "/images/collection.png",
        pagePath: "/pages/collection/collection",
        selectedIconPath: "/images/collection_s.png",
        text: "收藏",
        type: 0,
      },
      {
        iconPath: "/images/me.png",
        pagePath: "/pages/me/me",
        selectedIconPath: "/images/me_s.png",
        text: "我的",
        type: 0,
      }
    ]
  },
  
  methods:{
    selectPage(e){
      const{index ,page ,type }  = e.currentTarget.dataset;
      if(index!==this.data.select&& type ===0){
        wx.switchTab({
          url: page
        })  
      }else{
        if(!wx.getStorageSync('login')){
          wx.showToast({
            title: '请您先登录',
            icon:'none'
          })
          return
        }
        wx.navigateTo({
          url: page,
        })
      }
    }
  }
})