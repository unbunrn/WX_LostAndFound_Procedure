const mongoose = require("mongoose");

// 连接数据库
mongoose
  .connect("mongodb://localhost:27017/loseMg")
  .then(() => console.log("数据库连接成功"))
  .catch((err) => console.log(err, "数据库连接失败"));

// 丢失物品表
const LoseMgSchema = new mongoose.Schema({
  openid: {
    type: String,
  },
  type: {
    type: Number,
  },
  classify1: {
    type: String,
  },
  classify2: {
    type: String,
  },
  name: {
    type: String,
  },
  date: {
    type: String,
  },
  region: {
    type: String,
  },
  phone: {
    type: String,
  },
  desc: {
    type: String,
  },
  time: {
    type: Number,
  },
  imgList: {
    type: Array,
  },
  textFeatureVector: Array,  // 文本特征向量
  imageFeatureVector: Array  // 图像特征向量
});

// 收藏物品表
const CollectionMgSchema = new mongoose.Schema({
  //收藏的物品的id
  id: {
    type: mongoose.Schema.Types.ObjectId,// 关联的表的id
    ref: "Lose",
  },
  // 收藏者的openid
  openid: {
    type: String,
  },
});

// 用户账号密码
const UserMgSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  openid: {
    type: String,
  },
  create_time: {
    type: Number, 
  }
});

// 管理员账号
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  create_time: {
    type: Number,
  },
  // 0:超级管理员 1:管理员
  role: {
    type: Number,
  },
  nickname: {
    type: String,
  },
});

// 创建模型对象
const Lose = mongoose.model("Lose", LoseMgSchema);
const Collection = mongoose.model("Collection", CollectionMgSchema);
const User = mongoose.model("User", UserMgSchema);
const Admin = mongoose.model("Admin", AdminSchema);

// for(let i=0;i<10;i++){
//   Lose.create({
//    openid:"od1X06_nURFtbUSqAS49ktJz5cog" ,
//    type:0,
//    classify1:"数码产品",
//    classify2:"手机",
//    name:"手机",
//    date:"2021-01-01",
//    region:"北京市",
//    phone:"12345678901",
//    desc:"测试假数据，测试假数据，测试假数据，测试假数据",
//    time:1740979475429,
//    imgList:["http://localhost:3000/file/aa5b9c34-1ac0-44ea-b6b9-6799c75729c8.jpg"],
//   })
// }

  // Admin.create({
  //   username: "1",
  //   password: "16",
  //   create_time: 1740979475429, 
  //   role: 0,
  //   nickname: "test",
  // })

module.exports = {
  Lose,
  Collection,
  User,
  Admin,
}; // 导出模型对象