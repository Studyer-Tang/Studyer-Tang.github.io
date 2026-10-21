export type ResearchText = { zh: string; en: string }

export type ResearchDirection = {
  id: string
  title: ResearchText
  description: ResearchText
}

export const researchIntro: ResearchText = {
  zh: '我主要关注统计与机器学习在金融时间序列中的应用，尤其是高频股票数据。感兴趣的问题从成交、报价与流动性出发，延伸到时间序列的表示、生成，以及模型的统计性质。',
  en: 'My main interest is statistics and machine learning for financial time series, especially high-frequency equity data. Trades, quotes and liquidity lead me to questions about time-series representations, generative models and their statistical properties.',
}

export const researchDirections: ResearchDirection[] = [
  {
    id: 'market-microstructure',
    title: { zh: '高频数据与市场微观结构', en: 'High-frequency data and market microstructure' },
    description: {
      zh: '高频数据记录了成交、报价与订单流的细节。我关心日内周期、交易活动的聚集和流动性变化，以及它们与市场机制、短期价格变化的关系。微观结构模型、点过程与谱分析，是理解这些现象的几种途径。',
      en: 'High-frequency data record the details of trades, quotes and order flow. I am interested in intraday periodicity, clustered trading activity and changes in liquidity, and how these relate to market mechanisms and short-term price movements. Microstructure models, point processes and spectral analysis offer ways to study these patterns.',
    },
  },
  {
    id: 'representation-generation',
    title: { zh: '金融时间序列的表示与生成', en: 'Representation and generation of financial time series' },
    description: {
      zh: '多只资产的收益常有共同变化，而一段价格路径又包含单个时点看不到的信息。我对因子结构、路径表示和生成模型感兴趣，尤其想理解扩散模型等深度学习方法能保留哪些分布特征，又会丢失什么。',
      en: 'Asset returns often share common variation, while a price path contains information absent from a single observation. I am interested in factor structure, path representations and generative models, particularly which distributional features deep learning methods such as diffusion models preserve and which they miss.',
    },
  },
  {
    id: 'statistical-learning',
    title: { zh: '统计学习与模型解释', en: 'Statistical learning and model interpretation' },
    description: {
      zh: '除了预测误差，我也在意一个模型到底学到了什么：它依赖哪些信息，特征间的相关性会怎样影响选择与解释，换一段样本后结论是否仍然稳定。稀疏学习、路径签名的统计性质与样本外检验，都是我想继续深入的问题。',
      en: 'Beyond prediction error, I care about what a model has learned: which information it uses, how correlations between features affect selection and interpretation, and whether its conclusions hold in another sample. Sparse learning, the statistical properties of path signatures and out-of-sample evaluation are questions I would like to understand further.',
    },
  },
]
