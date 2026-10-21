export type ResearchText = { zh: string; en: string }

export type ResearchDirection = {
  id: string
  title: ResearchText
  question: ResearchText
  methods: ResearchText
  experiment: ResearchText
  evaluation: ResearchText
  boundary: ResearchText
}

export const researchIntro: ResearchText = {
  zh: '这些是我关注的问题与拟探索的方向。我希望从小规模、可复现的实验开始，检验方法的假设与边界。',
  en: 'These are questions I am interested in and directions I plan to explore. I hope to start with small, reproducible experiments that test the assumptions and limits of each method.',
}

export const researchDirections: ResearchDirection[] = [
  {
    id: 'market-microstructure',
    title: { zh: '日内微观结构', en: 'Intraday market microstructure' },
    question: {
      zh: '交易周期与事件聚集如何影响短期预测？',
      en: 'How do trading periodicity and clustered events affect short-horizon prediction?',
    },
    methods: {
      zh: '我想结合谱分析与点过程，区分日内季节性和自激性。',
      en: 'I plan to combine spectral analysis and point processes to distinguish intraday seasonality from self-excitation.',
    },
    experiment: {
      zh: '先模拟季节性到达流，检查周期识别与自激估计的偏差。',
      en: 'First, simulate seasonal event arrivals and check bias in periodicity detection and self-excitation estimates.',
    },
    evaluation: {
      zh: '拟按完整交易日划分训练与检验，以无自激模拟为对照，报告周期误报率、分枝比偏差和时间变换残差诊断。',
      en: 'I plan to split training and evaluation by complete trading days, use simulations without self-excitation as controls, and report false periodicity detections, branching-ratio bias and time-rescaled residual diagnostics.',
    },
    boundary: {
      zh: '先限单资产模拟与小规模公开数据；交易时段、时间戳精度和撮合规则可能混淆周期与自激效应，需分别检查。',
      en: 'I will initially use single-asset simulations and small public datasets. Trading sessions, timestamp precision and matching rules may confound periodicity with self-excitation and need separate checks.',
    },
  },
  {
    id: 'generative-factor-models',
    title: { zh: '生成式金融因子', en: 'Generative financial factor models' },
    question: {
      zh: '低维结构能否改善小样本收益生成？',
      en: 'Can low-dimensional structure improve return generation when data are scarce?',
    },
    methods: {
      zh: '拟比较线性因子基线与轻量扩散模型，关注分布而非只看均值。',
      en: 'I plan to compare linear factor baselines with small diffusion models, evaluating distributions beyond their means.',
    },
    experiment: {
      zh: '先在十资产合成数据上比较协方差和尾部分位数。',
      en: 'First, use synthetic ten-asset data to compare covariance recovery and tail quantiles.',
    },
    evaluation: {
      zh: '拟沿时间划分训练、验证与测试，固定调参预算，比较协方差误差、尾部分位误差及运行耗时，并跨种子复核。',
      en: 'I plan to use chronological training, validation and test splits with a fixed tuning budget, compare covariance and tail-quantile errors and runtime, and repeat across random seeds.',
    },
    boundary: {
      zh: '先限十资产、低维因子与小型网络，使用普通电脑；合成数据中的分布拟合不代表真实市场泛化或盈利能力。',
      en: 'I will start with ten assets, low-dimensional factors and small networks on an ordinary computer. Distributional fit on synthetic data does not establish generalization to real markets or profitability.',
    },
  },
  {
    id: 'interpretable-geometric-learning',
    title: { zh: '可解释与几何学习', en: 'Interpretable and geometric learning' },
    question: {
      zh: '预测准确时，路径特征是否仍可解释且稳定？',
      en: 'When predictions are accurate, are the path features still interpretable and stable?',
    },
    methods: {
      zh: '拟比较滞后特征与低阶路径签名，结合稀疏回归。',
      en: 'I plan to compare lagged features with low-order path signatures using sparse regression.',
    },
    experiment: {
      zh: '先在布朗与均值回复路径的函数回归中，检查样本外误差与特征选择稳定性。',
      en: 'First, regress functions of simulated Brownian and mean-reverting paths, checking held-out errors and feature-selection stability.',
    },
    evaluation: {
      zh: '拟按独立模拟路径切分，仅在训练集内用相同预算调参；比较测试均方误差，跨种子检查特征入选与系数稳定性。',
      en: 'I plan to split independent simulated paths, tune only within the training set under equal budgets, and compare test mean squared error, feature selection and coefficient stability across random seeds.',
    },
    boundary: {
      zh: '先限低维路径与二阶截断；特征数量随维数和阶数增长，稳定入选也不等于因果解释或识别出真实市场机制。',
      en: 'I will initially restrict the study to low-dimensional paths and second-order truncation. Feature counts grow with dimension and order; stable selection does not establish causality or identify actual market mechanisms.',
    },
  },
  {
    id: 'dependence-sustainable-investing',
    title: { zh: '依赖风险与可持续投资', en: 'Dependence risk and sustainable investing' },
    question: {
      zh: '尾部依赖如何改变可持续约束下的组合风险？',
      en: 'How does tail dependence change portfolio risk under sustainability constraints?',
    },
    methods: {
      zh: '拟探索 Copula、排序统计与压力测试。',
      en: 'I plan to explore copulas, order statistics and stress testing.',
    },
    experiment: {
      zh: '先在双资产合成数据中改变尾部依赖，比较可持续约束前后的尾部损失。',
      en: 'First, vary tail dependence in synthetic two-asset data and compare tail losses with and without a sustainability constraint.',
    },
    evaluation: {
      zh: '拟固定边际分布与尾部分位，改变依赖结构和约束强度；比较尾部平均损失、组合均值及权重变化的敏感性。',
      en: 'I plan to hold marginal distributions and the tail-quantile level fixed, vary dependence and constraint strength, and compare sensitivity in expected shortfall, portfolio means and weights.',
    },
    boundary: {
      zh: '先用双资产合成数据与假设性可持续评分；评级误差和约束设定影响结论，不能据此识别真实社会影响。',
      en: 'I will start with synthetic two-asset data and hypothetical sustainability scores. Rating errors and constraint choices affect the conclusions, and this exercise cannot identify real social impact.',
    },
  },
]
