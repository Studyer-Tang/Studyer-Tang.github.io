type Book = {
  title: { en: string; zh: string }
  credit: string
  description: { en: string; zh: string }
  url?: string
}

export const textbooks: Book[] = [
  {
    title: { en: 'Understanding Analysis', zh: '理解分析 · Understanding Analysis' },
    credit: 'Stephen Abbott · Springer · 2nd ed., 2015',
    url: 'https://link.springer.com/book/10.1007/978-1-4939-2712-8',
    description: {
      en: 'Undergraduate real analysis: sequences, continuity and differentiation, with careful motivation. A useful bridge from calculus to proof-based analysis.',
      zh: '本科实分析教材，以数列、连续性与微分为主线，兼顾动机与严谨证明。适合从微积分过渡到证明型分析课程。',
    },
  },
  {
    title: { en: 'Measure, Integration & Real Analysis', zh: '测度、积分与实分析' },
    credit: 'Sheldon Axler · Springer · 2020',
    url: 'https://link.springer.com/book/10.1007/978-3-030-33143-6',
    description: {
      en: 'A graduate text on measure, integration and functional-analytic ideas. Assumes undergraduate analysis; the publisher provides open access.',
      zh: '研究生层次教材，系统讲解测度、积分及相关泛函分析思想。需要本科分析基础；出版社提供开放获取版本。',
    },
  },
  {
    title: { en: 'The Elements of Statistical Learning', zh: '统计学习基础 · The Elements of Statistical Learning' },
    credit: 'Trevor Hastie, Robert Tibshirani & Jerome Friedman · Springer · 2nd ed., 2009',
    url: 'https://hastie.su.domains/ElemStatLearn/',
    description: {
      en: 'A standard advanced reference on statistical learning, from linear methods to trees and boosting. Requires probability, statistics and linear algebra; more demanding than ISL. The authors provide a free PDF.',
      zh: '统计学习进阶常用参考书，从线性方法到树模型与提升方法。需要概率统计与线性代数基础，难度高于《统计学习导论》；作者提供免费 PDF。',
    },
  },
]

export const narratives: Book[] = [
  {
    title: { en: 'Ficciones', zh: '虚构集 · Ficciones' },
    credit: 'Jorge Luis Borges · 1944 · Fiction / 小说',
    description: {
      en: 'Short fiction about labyrinths, infinity and knowledge. A literary companion to an interest in logic, not a mathematical exposition.',
      zh: '以迷宫、无限与知识为主题的短篇小说集。适合喜欢逻辑与思想实验的读者，但它是文学想象，不是数学论述。',
    },
  },
  {
    title: { en: 'The Return of Martin Guerre', zh: '马丁·盖尔归来 · The Return of Martin Guerre' },
    credit: 'Natalie Zemon Davis · Harvard University Press · 1983 · History / 历史',
    description: {
      en: 'A microhistory of identity and imposture in sixteenth-century France. Read for the interplay of archival evidence and historical reconstruction, while keeping inference distinct from documented fact.',
      zh: '围绕十六世纪法国身份冒认案展开的微观史。兼具叙事吸引力与史料分析，阅读时可留意档案事实和历史推断之间的边界。',
    },
  },
  {
    title: { en: 'Flatland: A Romance of Many Dimensions', zh: '平面国 · Flatland' },
    credit: 'Edwin A. Abbott · 1884 · Mathematical fiction / 数学小说',
    url: 'https://www.gutenberg.org/ebooks/201',
    description: {
      en: 'A geometric satire that uses a two-dimensional world to explore dimension and social hierarchy. The linked English text is available through Project Gutenberg; check local copyright rules.',
      zh: '以二维世界探讨维度、认知局限与社会等级的几何讽喻小说。链接为 Project Gutenberg 英文原文，使用时请留意所在地版权规则。',
    },
  },
  {
    title: { en: 'Uncle Petros and Goldbach’s Conjecture', zh: '佩特罗斯叔叔与哥德巴赫猜想' },
    credit: 'Apostolos Doxiadis · English edition, 2000 · Mathematical fiction / 数学小说',
    description: {
      en: 'A novel about mathematical ambition, obsession and the cost of pursuing a proof. Its central story is fictional; it does not establish Goldbach’s conjecture.',
      zh: '围绕数学抱负、执着与证明追求的代价展开的小说。人物故事是虚构的，也没有给出哥德巴赫猜想的证明。',
    },
  },
]
