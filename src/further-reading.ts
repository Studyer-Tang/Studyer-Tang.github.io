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

export const classics: Book[] = [
  {
    title: { en: 'Introduction to Mathematical Philosophy', zh: '数理哲学导论' },
    credit: 'Bertrand Russell · 1919',
    description: {
      en: 'Number, order and infinity through Russell’s logicist perspective. A classic in mathematical philosophy, not a substitute for a modern foundations course.',
      zh: '从罗素的逻辑主义视角讨论数、序与无穷。适合关注数学基础与概念来由的读者，但不能替代现代数学基础课程。',
    },
  },
  {
    title: { en: 'The Problems of Philosophy', zh: '哲学问题' },
    credit: 'Bertrand Russell · 1912 · Philosophy / 哲学',
    description: {
      en: 'A short exploration of appearance, reality and the limits of knowledge. A philosophical companion to mathematical reading, rather than a mathematics textbook.',
      zh: '围绕现象、实在与知识的限度展开的短篇幅哲学著作。作为数学阅读之外的思想补充，不归作数学教材。',
    },
  },
  {
    title: { en: 'Introduction to Analysis of the Infinite', zh: '无穷分析引论' },
    credit: 'Leonhard Euler · Introductio in analysin infinitorum · 1748',
    description: {
      en: 'Euler’s treatment of functions, infinite series, exponential and trigonometric expressions. Read for the development of analysis; eighteenth-century arguments and convergence assumptions need modern scrutiny.',
      zh: '从函数、无穷级数到指数与三角表达式，体会欧拉发展分析学的思路。原著中的论证与收敛条件须结合现代分析知识审视。',
    },
  },
  {
    title: { en: 'Elements of Algebra', zh: '代数基础 · Elements of Algebra' },
    credit: 'Leonhard Euler · Vollständige Anleitung zur Algebra · 1770',
    description: {
      en: 'A classical account of arithmetic, algebraic operations and equations. Valuable for its exposition and historical perspective; not a modern abstract algebra textbook.',
      zh: '由算术与代数运算推进到方程，适合欣赏欧拉的讲解方式与历史思路；并非现代抽象代数教材。',
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
    title: { en: 'Crime and Punishment', zh: '罪与罚' },
    credit: 'Fyodor Dostoevsky · 1866 · Fiction / 小说',
    description: {
      en: 'A psychological novel about moral rationalization, guilt and responsibility. Its tension comes as much from inner argument as from the crime itself.',
      zh: '围绕道德辩解、罪疚与责任展开的心理小说。吸引力不仅在案件，更在人物不断自我辩驳的思想冲突。',
    },
  },
  {
    title: { en: 'The Name of the Rose', zh: '玫瑰的名字' },
    credit: 'Umberto Eco · 1980 · Fiction / 小说',
    description: {
      en: 'A medieval murder mystery involving interpretation, books and intellectual authority. A rich historical novel, but not a source of historical evidence.',
      zh: '将中世纪修道院谜案、文本解释与知识权威交织在一起，兼顾文学与推理趣味。属于历史背景小说，而非史料。',
    },
  },
]
