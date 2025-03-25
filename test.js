const express = require("express"); // 引入express模块
const app = express(); // 创建express实例
const { Lose, Collection, User, Admin } = require("./db"); // 引入数据模型
const multer = require("multer"); // 引入multer模块
const { v4 } = require("uuid"); // 引入uuid模块
const { default: axios } = require("axios");
const e = require("express");

app.use(express.urlencoded({ extended: true })); // 解析post请求参数
app.use(express.json()); // 解析json数据
app.use(express.static(__dirname)); // 设置静态资源目录
app.all("*", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 允许所有跨域请求
  res.setHeader("Access-Control-Allow-Headers", "*"); // 允许所有请求头
  next(); // 继续执行后续代码
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// 配置文件存储路径和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 指定文件存储路径
    cb(null, "./file"); // 保存在当前目录下的file文件夹中
  },
  filename(req, file, cb) {
    // 指定文件名
    let type = file.originalname.replace(/.+\./, "."); // 获取文件后缀名
    cb(null, `${v4()}${type}`); // 生成文件名
  },
});

// 实现物品的发布功能
app.post("/publish", async (req, res) => {
  try {
    const {
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
    } = req.body; 
    
    // 准备文本和图片数据
    const textContent = `${name} ${desc}`; // 合并名称和描述作为文本输入
    
    // 处理图片 - 从本地文件读取并转为Base64
    let imageDataList = [];
    if (imgList && imgList.length > 0) {
      const fs = require('fs');
      const path = require('path');
      
      for (const imageUrl of imgList) {
        try {
          // 从URL中提取文件名
          const filename = imageUrl.split('/').pop();
          // 构建本地文件路径
          const filePath = path.join(__dirname, 'file', filename);
          
          // 读取文件并转为Base64
          if (fs.existsSync(filePath)) {
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = imageBuffer.toString('base64');
            imageDataList.push(base64Image);
          }
        } catch (err) {
          console.error('处理图片时出错:', err);
        }
      }
    }
    
    // 调用Python服务获取特征向量
    const response = await axios.post('http://localhost:5000/extract_features', {
      text: textContent,
      imageData: imageDataList // 发送Base64编码的图片而非URL
    });
    
    // 获取特征向量
    const { text_feature_vector, image_feature_vector } = response.data;
    
    // 创建新记录，包含特征向量
    await Lose.create({
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
      textFeatureVector: text_feature_vector,
      imageFeatureVector: image_feature_vector
    });
    
    res.send("success");
  } catch (error) {
    res.send("fail");
    console.log(error);
  }
});

// 上传图片
const upload = multer({ storage: storage }); // 创建multer对象
app.post("/uploadImg", upload.array("file", 6), (req, res) => {
  res.send(req.files); // 返回文件名
});

// 获取首页的数据
app.get("/getLose", async (req, res) => {
  const { type } = req.query;
  const result = await Lose.find({ type }).sort({ time: -1 });// 按时间倒序排序
  res.send(result);
});

// 收藏物品
app.post("/toCollection", async (req, res) => {
  try {
    const { id, openid } = req.body;
    
    // 检查是否已经收藏
    const existingCollection = await Collection.findOne({ id, openid });
    if (existingCollection) {
      return res.send("already_collected");
    }
    
    // 只保存必要的字段
    await Collection.create({
      id,
      openid
    });
    
    res.send("success");
  } catch (error) {
    console.error("收藏失败:", error);
    res.send("error");
  }
});

// 实现登录操作，获取openid
app.get("/login", async (req, res) => {
  const { code } = req.query;
  try {
    const {
      data: { openid },
    } = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wxdf8879f706020150&secret=f1dd8833bbce2df2170efdfef57f4f2c&js_code=${code}&grant_type=authorization_code`
    );
    res.send(openid);
  } catch (error) {
    console.log(error);
    res.send("error");
  }
});

// 查询当前物品是否被收藏
app.post("/isCollection", async (req, res) => {
  const { id, openid } = req.body;
  const result = await Collection.find({ id, openid });
  res.send(result);
});

// 取消收藏
app.post("/cancelCollection", async (req, res) => {
  try {
    const { id, openid } = req.body;
    await Collection.findOneAndDelete({ id, openid });
    
    res.send("success");
  } catch (error) {
    res.send("error");
    console.log(error);
  }
});

// 获取收藏的数据
app.get("/getCollection", async (req, res) => {
  try {
    const { openid, type } = req.query;
    
    // 先获取收藏记录
    const collections = await Collection.find({ openid });
    
    // 获取所有收藏物品的ID
    const itemIds = collections.map(collection => collection.id);
    
    // 根据ID和type查询物品详情
    const items = await Lose.find({ 
      _id: { $in: itemIds },
      type: type 
    });
    
    res.send(items);
  } catch (error) {
    console.error("获取收藏列表失败:", error);
    res.send([]);
  }
});

// 获取我的发布
app.get("/getMyPublish", async (req, res) => {
  const { openid, type } = req.query;
  const result = await Lose.find({ openid, type });
  res.send(result);
});

// 通过二级分类查数据
app.post("/getClassify2", async (req, res) => {
  const { type, classify2 } = req.body;
  const result = await Lose.find({ type, classify2 });
  res.send(result);
});

// 模糊查询物品名字
app.get("/searchLose", async (req, res) => {
  const { name } = req.query;
  const _name = new RegExp(name, "i"); // 不区分大小写，模糊查询
  const result = await Lose.find({ name: _name });
  res.send(result);
});

// 通过搜索历史查询物品
app.post("/searchHistory", async (req, res) => {
  const { name, type } = req.body;
  const _name = new RegExp(name, "i"); // 不区分大小写，模糊查询
  const result = await Lose.find({ name: _name, type });
  res.send(result);
});

// 注册
app.post("/register", async (req, res) => {
  const { username, password, openid, create_time } = req.body;
  const result = await User.find({ username });
  if (result.length !== 0) {
    res.send("registered");
  } else {
    await User.create({ username, password, openid, create_time });
    res.send("success");
  }
});

// 独立的登录系统
app.post("/tologin", async (req, res) => {
  const { username, password } = req.body;
  const result = await User.findOne({ username, password });
  if (result.length !== 0) {
    if (result.password === password) {
      res.send("success");
    } else {
      res.send("pwdError");
    }
  } else {
    res.send("error");
  }
});

// 小程序端删除寻主/寻物数据
app.post("/delLose", async (req, res) => {
  const { _id } = req.body;
  try {
    await Lose.findOneAndDelete({ _id });
    await Collection.deleteMany({ id: _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});
//获取物品详情信息
app.post("/getLoseDetail", async (req, res) => {
  const { _id } = req.body;
  try {
    const result = await Lose.findById({ _id });
    res.send(result);
  } catch (error) {
    res.send("error");
  }
});

//小程序修改发布的寻主/寻物信息
app.post("/editLose", async (req, res) => {
  const {
    _id,
    type,
    classify1,
    classify2,
    name,
    date,
    region,
    phone,
    desc,
    time,
    imgList,
  } = req.body;
  try {
    // 准备文本和图片数据
    const textContent = `${name} ${desc}`; // 合并名称和描述作为文本输入
    // 调用Python服务获取特征向量
    const response = await axios.post('http://localhost:5000/extract_features', {
      text: textContent,
      images: imgList
    });
    
    // 获取特征向量
    const { text_feature_vector, image_feature_vector } = response.data;
    
    await Lose.findOneAndUpdate(
      { _id },
      {
        type,
        classify1,
        classify2,
        name,
        date,
        region,
        phone,
        desc,
        time,
        imgList,
        textFeatureVector: text_feature_vector,
        imageFeatureVector: image_feature_vector
      }
    );
    res.send("success");
  } catch (error) {
    res.send("error");
    console.log(error);
  }
});

//多模态搜索功能
app.post("/multimodalSearch", async (req, res) => {
  try {
    const { 
      text, 
      images, 
      textWeight = 0.5, 
      imageWeight = 0.5,
      similarityThreshold = 0.7,  // 设置阈值相似度为0.7
      keywordMatchBonus = 0.2     // 关键词匹配的加分权重
    } = req.body;
    
    // 记录详细的搜索请求日志
    console.log('多模态搜索请求:', { 
      text, 
      imagesCount: images ? images.length : 0,
      textWeight,
      imageWeight,
      similarityThreshold,
      keywordMatchBonus
    });
    
    // 确保至少有文本或图片
    if ((!text || text.trim() === '') && (!images || images.length === 0)) {
      return res.status(400).send({
        success: false,
        message: '请提供文本或图片进行搜索'
      });
    }
    
    // 存储关键词匹配的物品ID
    const keywordMatchedIds = new Map(); // 使用Map存储ID和匹配分数
    
    // 先进行关键词匹配，但不直接返回结果
    if (text && text.trim() !== '') {
      console.log('进行关键词匹配:', text.trim());
      
      // 拆分关键词为单独的词，提高匹配率
      const keywords = text.trim().split(/\s+/);
      const keywordQueries = keywords.map(keyword => {
        const regex = new RegExp(keyword, 'i');
        return {
          $or: [
            { name: regex },
            { desc: regex },
            { region: regex } // 增加对地区的匹配
          ]
        };
      });
      
      // 组合查询条件
      const keywordQuery = keywords.length === 1 ? keywordQueries[0] : { $or: keywordQueries };
      
      // 执行关键词搜索
      const keywordResults = await Lose.find(keywordQuery);
      
      console.log(`关键词匹配结果数量: ${keywordResults.length}`);
      
      // 计算每个结果的匹配分数
      keywordResults.forEach(item => {
        const itemText = `${item.name} ${item.desc} ${item.region}`.toLowerCase();
        let matchCount = 0;
        
        // 计算匹配的关键词数量
        keywords.forEach(keyword => {
          if (itemText.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        });
        
        // 计算匹配分数 (0-1之间)
        const matchScore = matchCount / Math.max(1, keywords.length);
        
        // 存储每个ID的匹配分数
        keywordMatchedIds.set(item._id.toString(), matchScore);
      });
    }
    
    // 准备图片数据
    let imageDataList = [];
    if (images && images.length > 0) {
      const fs = require('fs');
      const path = require('path');
      
      for (const imageUrl of images) {
        try {
          const filename = imageUrl.split('/').pop();
          const filePath = path.join(__dirname, 'file', filename);
          
          if (fs.existsSync(filePath)) {
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = imageBuffer.toString('base64');
            imageDataList.push(base64Image);
          }
        } catch (err) {
          console.error('处理图片时出错:', err);
        }
      }
    }
    
    // 调用Python服务获取特征向量
    console.log('调用Python服务获取特征向量');
    const response = await axios.post('http://localhost:5000/extract_features', {
      text: text || '',
      imageData: imageDataList
    });
    
    // 获取特征向量
    const { text_feature_vector, image_feature_vector } = response.data;
    
    // 输出特征向量信息
    console.log('特征向量信息:', { 
      hasTextVector: Array.isArray(text_feature_vector),
      hasImageVector: Array.isArray(image_feature_vector),
      textVectorLength: text_feature_vector ? text_feature_vector.length : 0,
      imageVectorLength: image_feature_vector ? image_feature_vector.length : 0
    });
    
    // 检查特征向量是否有效
    const hasValidTextVector = text_feature_vector && text_feature_vector.length > 0;
    const hasValidImageVector = image_feature_vector && image_feature_vector.length > 0;
    
    if (!hasValidTextVector && !hasValidImageVector) {
      console.error('Python服务未返回有效特征向量');
      
      // 如果向量搜索失败，但有关键词匹配结果，则使用关键词匹配结果
      if (keywordMatchedIds.size > 0) {
        // 获取匹配的物品
        const matchedItems = await Lose.find({
          _id: { $in: Array.from(keywordMatchedIds.keys()) }
        });
        
        // 按匹配分数排序
        const sortedResults = matchedItems
          .map(item => ({
            item,
            matchScore: keywordMatchedIds.get(item._id.toString())
          }))
          .sort((a, b) => b.matchScore - a.matchScore)
          .map(result => ({
            ...result.item.toObject(),
            matchType: '关键词匹配',
            keywordMatchScore: result.matchScore,
            searchType: '文本搜索'
          }));
        
        return res.send({
          success: true,
          message: '使用关键词匹配模式（特征向量不可用）',
          data: sortedResults
        });
      }
      
      // 如果没有任何匹配结果，进行备用模糊搜索
      if (text && text.trim() !== '') {
        const fallbackRegex = new RegExp(text.trim(), 'i');
        const fallbackResults = await Lose.find({
          $or: [
            { name: fallbackRegex },
            { desc: fallbackRegex }
          ]
        }).limit(10);
        
        if (fallbackResults.length > 0) {
          return res.send({ 
            success: true,
            message: '使用简单模糊匹配（特征向量不可用）',
            data: fallbackResults.map(item => ({
              ...item.toObject(),
              matchType: '备用模糊匹配',
              searchType: '文本搜索'
            }))
          });
        }
      }
      
      return res.status(500).send({
        success: false,
        message: '无法生成搜索特征，请稍后重试'
      });
    }
    
    // 评估查询质量并调整权重
    let textQueryQuality = 0;
    let imageQueryQuality = 0;

    if (hasValidTextVector) {
      textQueryQuality = evaluateTextQueryQuality(text, text_feature_vector);
      console.log(`文本查询质量评分: ${textQueryQuality.toFixed(2)}`);
    }

    if (hasValidImageVector) {
      imageQueryQuality = evaluateImageQueryQuality(imageDataList, image_feature_vector);
      console.log(`图像查询质量评分: ${imageQueryQuality.toFixed(2)}`);
    }

    // 动态设置搜索模式和权重 - 考虑查询质量
    let searchMode = 'mixed';
    let finalTextWeight = normalizeWeight(textWeight, 0.5);
    let finalImageWeight = normalizeWeight(imageWeight, 0.5);

    if (!hasValidTextVector) {
      searchMode = 'image_only';
      finalTextWeight = 0;
      finalImageWeight = 1;
    } else if (!hasValidImageVector) {
      searchMode = 'text_only';
      finalTextWeight = 1;
      finalImageWeight = 0;
    } else {
      // 在混合模式下基于查询质量调整初始权重
      const qualityAdjustFactor = 0.2;
      const textQualityBoost = (textQueryQuality - 0.7) * qualityAdjustFactor;
      const imageQualityBoost = (imageQueryQuality - 0.7) * qualityAdjustFactor;
      
      finalTextWeight = Math.max(0.2, Math.min(0.8, finalTextWeight + textQualityBoost));
      finalImageWeight = Math.max(0.2, Math.min(0.8, finalImageWeight + imageQualityBoost));
      
      // 重新归一化权重
      const totalWeight = finalTextWeight + finalImageWeight;
      finalTextWeight = finalTextWeight / totalWeight;
      finalImageWeight = finalImageWeight / totalWeight;
    }
    
    console.log('搜索模式:', searchMode, { 
      finalTextWeight, 
      finalImageWeight, 
      textQueryQuality, 
      imageQueryQuality 
    });
    
    // 查询数据库中有特征向量的物品
    const allItems = await Lose.find({});
    const validItems = allItems.filter(item => {
      if (searchMode === 'text_only') {
        return item.textFeatureVector && Array.isArray(item.textFeatureVector) && item.textFeatureVector.length > 0;
      } else if (searchMode === 'image_only') {
        return item.imageFeatureVector && Array.isArray(item.imageFeatureVector) && item.imageFeatureVector.length > 0;
      } else {
        return (item.textFeatureVector && Array.isArray(item.textFeatureVector) && item.textFeatureVector.length > 0) &&
               (item.imageFeatureVector && Array.isArray(item.imageFeatureVector) && item.imageFeatureVector.length > 0);
      }
    });
    
    console.log(`数据库中物品总数: ${allItems.length}, 有效物品数: ${validItems.length}`);
    
    // 计算相似度并记录计算过程
    const resultsWithDetails = [];
    
    for (const item of validItems) {
      // 初始化相似度
      let textSim = 0;
      let imageSim = 0;
      let textSimValid = false;
      let imageSimValid = false;
      
      // 只在需要时计算文本相似度
      if (searchMode !== 'image_only' && hasValidTextVector && item.textFeatureVector) {
        try {
          textSim = calculateCosineSimilarity(text_feature_vector, item.textFeatureVector);
          textSimValid = true;
        } catch (err) {
          console.error(`计算文本相似度出错 (物品ID: ${item._id}):`, err.message);
        }
      }
      
      // 只在需要时计算图像相似度
      if (searchMode !== 'text_only' && hasValidImageVector && item.imageFeatureVector) {
        try {
          imageSim = calculateCosineSimilarity(image_feature_vector, item.imageFeatureVector);
          imageSimValid = true;
        } catch (err) {
          console.error(`计算图像相似度出错 (物品ID: ${item._id}):`, err.message);
        }
      }
      
      // 计算综合相似度 - 使用加入查询质量的动态权重融合
      let combinedSimilarity = 0;
      let usedWeights = { 
        textWeight: finalTextWeight, 
        imageWeight: finalImageWeight,
        textQuality: textQueryQuality,
        imageQuality: imageQueryQuality
      };
      
      if (textSimValid && imageSimValid) {
        // 应用动态权重融合，加入查询质量评估
        usedWeights = calculateAdaptiveWeights(
          textSim, 
          imageSim, 
          finalTextWeight, 
          finalImageWeight, 
          textQueryQuality, 
          imageQueryQuality
        );
        combinedSimilarity = (usedWeights.textWeight * textSim) + (usedWeights.imageWeight * imageSim);
      } else if (textSimValid) {
        combinedSimilarity = textSim;
      } else if (imageSimValid) {
        combinedSimilarity = imageSim;
      }
      
      // 查看该物品是否在关键词匹配中，并添加加分
      const itemId = item._id.toString();
      const keywordMatchScore = keywordMatchedIds.get(itemId) || 0;
      
      // 最终分数 = 向量相似度 + 关键词匹配分数 * 加分权重
      const finalScore = combinedSimilarity + (keywordMatchScore * keywordMatchBonus);
      
      // 记录详细信息
      if (finalScore > 0) {
        resultsWithDetails.push({
          item,
          similarity: combinedSimilarity,
          textSimilarity: textSim,
          imageSimilarity: imageSim,
          keywordMatchScore,
          finalScore,
          name: item.name,
          desc: item.desc,
          usedWeights  // 存储用于生成结果的实际权重
        });
      }
    }
    
    // 输出较高相似度的项目，同时显示使用的权重和关键词匹配信息
    resultsWithDetails
      .filter(result => result.finalScore > 0.1)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5)
      .forEach(result => {
        console.log(
          `物品 "${result.name}" 最终分数: ${result.finalScore.toFixed(4)} ` +
          `(向量相似度: ${result.similarity.toFixed(4)}, 关键词匹配: ${result.keywordMatchScore.toFixed(2)}) ` +
          `[文本: ${result.textSimilarity.toFixed(4)}(权重:${result.usedWeights.textWeight.toFixed(2)}), ` +
          `图像: ${result.imageSimilarity.toFixed(4)}(权重:${result.usedWeights.imageWeight.toFixed(2)})]`
        );
      });
    
    // 过滤、排序、限制结果数量 - 使用最终分数排序
    const results = resultsWithDetails
      .filter(result => result.similarity >= similarityThreshold * 0.9 || result.keywordMatchScore > 0.5)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10);
    
    console.log(`过滤后的结果数量: ${results.length}`);
    
    // 如果没有超过阈值的结果，但有一些分数不为零的结果，返回分数最高的几个
    if (results.length === 0 && resultsWithDetails.length > 0) {
      const backupResults = resultsWithDetails
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 5);
      
      if (backupResults.length > 0 && backupResults[0].finalScore > 0.1) {
        return res.send({
          success: true,
          message: '未找到高度相似的物品，但这些可能与您的搜索相关',
          searchMode,
          thresholdRelaxed: true,
          data: backupResults.map(result => ({
            ...result.item.toObject(),
            similarity: parseFloat(result.similarity.toFixed(4)),
            textSimilarity: parseFloat(result.textSimilarity.toFixed(4)),
            imageSimilarity: parseFloat(result.imageSimilarity.toFixed(4)),
            keywordMatchScore: parseFloat(result.keywordMatchScore.toFixed(4)),
            finalScore: parseFloat(result.finalScore.toFixed(4)),
            searchType: searchMode === 'text_only' ? '文本搜索' : 
                      searchMode === 'image_only' ? '图像搜索' : '混合搜索'
          }))
        });
      }
    }
    
    if (results.length === 0) {
      return res.send({
        success: true,
        message: '未找到匹配的物品，请尝试使用其他关键词或上传图片搜索',
        data: []
      });
    }
    
    // 返回结果
    res.send({
      success: true,
      searchMode,
      queryQuality: {
        text: textQueryQuality,
        image: imageQueryQuality
      },
      data: results.map(result => ({
        ...result.item.toObject(),
        similarity: parseFloat(result.similarity.toFixed(4)),
        textSimilarity: parseFloat(result.textSimilarity.toFixed(4)),
        imageSimilarity: parseFloat(result.imageSimilarity.toFixed(4)),
        keywordMatchScore: parseFloat(result.keywordMatchScore.toFixed(4)),
        finalScore: parseFloat(result.finalScore.toFixed(4)),
        weights: {
          text: parseFloat(result.usedWeights.textWeight.toFixed(2)),
          image: parseFloat(result.usedWeights.imageWeight.toFixed(2))
        },
        searchType: searchMode === 'text_only' ? '文本搜索' : 
                  searchMode === 'image_only' ? '图像搜索' : '混合搜索'
      }))
    });
  } catch (error) {
    console.error('多模态搜索错误:', error);
    res.status(500).send({
      success: false,
      message: '搜索处理失败',
      error: error.message
    });
  }
});

// 归一化权重，确保有默认值
function normalizeWeight(value, defaultValue) {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(0, Math.min(1, value)); // 限制在0-1之间
}

// 改进的余弦相似度计算
function calculateCosineSimilarity(vectorA, vectorB) {
  // 严格检查输入参数
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    console.warn('相似度计算失败: 输入不是数组', {
      isArrayA: Array.isArray(vectorA),
      isArrayB: Array.isArray(vectorB)
    });
    return 0;
  }
  
  if (vectorA.length !== vectorB.length) {
    console.warn(`相似度计算失败: 向量维度不匹配 (${vectorA.length} vs ${vectorB.length})`);
    return 0;
  }
  
  if (vectorA.length === 0) {
    console.warn('相似度计算失败: 空向量');
    return 0;
  }
  
  // 检查是否包含非数值元素
  const hasInvalidValues = (vector) => {
    return vector.some(val => typeof val !== 'number' || isNaN(val));
  };
  
  if (hasInvalidValues(vectorA) || hasInvalidValues(vectorB)) {
    console.warn('相似度计算失败: 向量包含非数值元素');
    return 0;
  }
  
  // 计算点积
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }
  
  // 计算向量模长
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));
  
  // 避免除以零
  if (magnitudeA < 0.000001 || magnitudeB < 0.000001) {
    console.warn('相似度计算失败: 向量模长接近零', { magnitudeA, magnitudeB });
    return 0;
  }
  
  // 计算并返回余弦相似度
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  
  // 确保结果在[-1,1]范围内
  if (similarity < -1 || similarity > 1) {
    console.warn(`计算得到的相似度超出范围: ${similarity}`);
    return Math.max(-1, Math.min(1, similarity));
  }
  
  return similarity;
}

// 评估文本查询质量
function evaluateTextQueryQuality(text, vector) {
  if (!text || !vector || vector.length === 0) {
    return 0;
  }
  
  // 基本质量分数
  let qualityScore = 0.7;
  
  // 1. 评估文本长度
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) {
    // 单词太少，质量较低
    qualityScore -= 0.2;
  } else if (words.length >= 5) {
    // 词语较多，可能有更多信息
    qualityScore += 0.1;
  }
  
  // 2. 评估文本特异性
  const specificWords = ["型号", "牌子", "品牌", "特征", "颜色", "编号", "序列号", "标记", "独特", "特殊"];
  const hasSpecificInfo = specificWords.some(word => text.includes(word));
  if (hasSpecificInfo) {
    qualityScore += 0.1;
  }
  
  // 3. 评估向量的有效性
  // 检查向量是否包含足够的非零元素
  const nonZeroCount = vector.filter(val => Math.abs(val) > 0.01).length;
  const nonZeroRatio = nonZeroCount / vector.length;
  
  if (nonZeroRatio < 0.1) {
    // 向量中非零元素太少，可能是低质量嵌入
    qualityScore -= 0.15;
  }
  
  // 4. 检查向量模长的合理性
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude < 0.5 || magnitude > 1.5) {
    // 模长异常，可能是低质量嵌入
    qualityScore -= 0.1;
  }
  
  // 确保分数在有效范围内
  return Math.max(0.3, Math.min(1.0, qualityScore));
}

// 评估图像查询质量
function evaluateImageQueryQuality(imageData, vector) {
  if (!imageData || !vector || vector.length === 0) {
    return 0;
  }
  
  // 基本质量分数
  let qualityScore = 0.7;
  
  // 1. 如果有多张图片，质量可能更好
  if (Array.isArray(imageData) && imageData.length > 1) {
    qualityScore += 0.1 * Math.min(imageData.length - 1, 3) / 3; // 最多加0.1
  }
  
  // 2. 评估向量的有效性
  // 检查向量是否包含足够的非零元素
  const nonZeroCount = vector.filter(val => Math.abs(val) > 0.01).length;
  const nonZeroRatio = nonZeroCount / vector.length;
  
  if (nonZeroRatio < 0.1) {
    // 向量中非零元素太少，可能是低质量嵌入
    qualityScore -= 0.15;
  }
  
  // 3. 检查向量的范数是否在合理范围内
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude < 0.5 || magnitude > 1.5) {
    // 模长异常，可能是低质量嵌入
    qualityScore -= 0.1;
  }
  
  // 4. 检查向量元素的分布是否均匀
  const meanValue = vector.reduce((sum, val) => sum + val, 0) / vector.length;
  const variance = vector.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / vector.length;
  
  // 极低的方差可能表示图像质量差或信息量少
  if (variance < 0.01) {
    qualityScore -= 0.1;
  }
  
  // 确保分数在有效范围内
  return Math.max(0.3, Math.min(1.0, qualityScore));
}

// 修改动态权重计算函数，加入质量评估参数
function calculateAdaptiveWeights(textSimilarity, imageSimilarity, baseTextWeight, baseImageWeight, textQuality = 0.7, imageQuality = 0.7) {
  // 1. 考虑相似度的强度和可信度
  const textStrength = Math.pow(textSimilarity, 1.5);
  const imageStrength = Math.pow(imageSimilarity, 1.5);
  
  // 2. 应用查询质量因子
  // 查询质量越高，该模态的权重就越大
  const qualityFactor = 0.2; // 查询质量对权重的影响程度
  let textWeightInitial = baseTextWeight * (1 + (textQuality - 0.7) * qualityFactor);
  let imageWeightInitial = baseImageWeight * (1 + (imageQuality - 0.7) * qualityFactor);
  
  // 3. 计算相似度差异系数
  const diff = Math.abs(textSimilarity - imageSimilarity);
  const dominanceFactor = Math.min(diff * 2, 0.5);
  
  // 4. 根据哪个模态更强调整权重
  if (imageSimilarity > textSimilarity) {
    // 图像相似度更高，提升图像权重
    imageWeightInitial += dominanceFactor;
    textWeightInitial -= dominanceFactor;
  } else if (textSimilarity > imageSimilarity) {
    // 文本相似度更高，提升文本权重
    textWeightInitial += dominanceFactor;
    imageWeightInitial -= dominanceFactor;
  }
  
  // 5. 特殊情况处理 - 当某一模态相似度极高且查询质量也高时，给予更多信任
  const highThreshold = 0.85;
  if (imageSimilarity > highThreshold && imageQuality > 0.6) {
    // 图像几乎完全匹配且质量好，额外增加图像权重
    const boost = Math.min((imageSimilarity - highThreshold) * 3 * imageQuality, 0.25);
    imageWeightInitial += boost;
    textWeightInitial -= boost;
  }
  if (textSimilarity > highThreshold && textQuality > 0.6) {
    // 文本几乎完全匹配且质量好，额外增加文本权重
    const boost = Math.min((textSimilarity - highThreshold) * 3 * textQuality, 0.25);
    textWeightInitial += boost;
    imageWeightInitial -= boost;
  }
  
  // 6. 确保权重在合理范围内
  textWeightInitial = Math.max(0.2, Math.min(0.8, textWeightInitial));
  imageWeightInitial = Math.max(0.2, Math.min(0.8, imageWeightInitial));
  
  // 7. 归一化权重
  const sum = textWeightInitial + imageWeightInitial;
  const textWeight = textWeightInitial / sum;
  const imageWeight = imageWeightInitial / sum;
  
  // 返回计算后的权重
  return {
    textWeight,
    imageWeight,
    textStrength,
    imageStrength,
    dominanceFactor,
    textQuality,
    imageQuality
  };
}

//// 后台管理系统
// 管理员登录
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await Admin.findOne({ username, password });
  if (result && result.password === password) {
    res.send(result);
  } else {
    res.send("error");
  }
});

// 寻主/寻物数据
app.post("/admin/getLose", async (req, res) => {
  const { type, page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const name = new RegExp(searchVal, "i");
      const result = await Lose.find({ type, name })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Lose.find({ type, name }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await Lose.find({ type })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Lose.find({ type }).countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

// 删除寻主/寻物数据
app.post("/admin/delLose", async (req, res) => {
  const { _id } = req.body;
  try {
    await Lose.findOneAndDelete({ _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

// 后台管理系统用户数据
app.post("/admin/getUser", async (req, res) => {
  const { page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const username = new RegExp(searchVal, "i");
      const result = await User.find({ username })
        .skip((page - 1) * size)
        .limit(size);
      const total = await User.find({
        username: new RegExp(searchVal, "i"),
      }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await User.find()
        .skip((page - 1) * size)
        .limit(size);
      const total = await User.find().countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

// 后台管理系统删除用户
app.post("/admin/delUser", async (req, res) => {
  const { _id } = req.body;
  try {
    await User.findOneAndDelete({ _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//获取后台管理系统管理员信息
app.post("/admin/getAdmin", async (req, res) => {
  const { page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const username = new RegExp(searchVal, "i");
      const result = await Admin.find({ username })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Admin.find({
        username: new RegExp(searchVal, "i"),
      }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await Admin.find()
        .skip((page - 1) * size)
        .limit(size);
      const total = await Admin.find().countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

//后台管理系统超级管理员删除管理员
app.post("/admin/delAdmin", async (req, res) => {
  const { _id, username } = req.body;
  try {
    // 先查询当前管理员的信息
    const currentAdmin = await Admin.findOne({ username });
    // 检查当前管理员权限
    if (currentAdmin.role !== 0) {
      return res.send("noPower"); // 无权限操作
    }
    // 获取当前管理员的_id
    const currentAdminId = currentAdmin._id.toString();
    // 检查是否删除自己（比较两个_id是否一致）
    if (currentAdminId === _id) {
      return res.send("cannotDeleteSelf"); // 阻止自我删除
    }
    // 执行删除目标管理员
    await Admin.findByIdAndDelete(_id);
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//新增管理员/修改管理员
app.post("/admin/AddEditAdmin", async (req, res) => {
  const { username, password, role, nickname, _id } = req.body;
  try {
    if (_id) {
      // 执行修改管理员
      await Admin.findByIdAndUpdate(_id, {
        username,
        password,
        role,
        nickname,
      });
    } else {
      // 执行新增管理员
      // 先查询当前用户名是否已存在
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.send("exist"); // 用户名已存在
      }
      // 执行新增管理员
      await Admin.create({
        username,
        password,
        role,
        nickname,
        create_time: Date.now(),
      });
    }
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//查询当前管理员权限
app.post("/admin/getAdminRole", async (req, res) => {
  const { username } = req.body;
  try {
    const { role } = await Admin.findOne({ username });
    if (role == 0) {
      res.send(true);
    } else {
      res.send(false);
    }
  } catch (error) {
    res.send("error");
  }
});

