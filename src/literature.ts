export type Reading = (typeof import('./reading').reading)[number]

// Suggested reading, with links to the original texts rather than completion claims.
export const literature: Reading[] = [
  {
    title: { zh: '史记', en: 'Records of the Grand Historian' },
    credit: '司马迁 · 西汉 / Sima Qian · Western Han',
    url: 'https://zh.wikisource.org/wiki/史記',
    description: {
      zh: '纪传体写人叙事，可从列传选读，留意人物处境与史家的判断。',
      en: 'Biographical history that can be approached through selected lives, attending to people’s circumstances and the historian’s judgments.',
    },
  },
  {
    title: { zh: '资治通鉴', en: 'Comprehensive Mirror for Aid in Government' },
    credit: '司马光 主编 · 北宋 / Sima Guang, chief compiler · Northern Song',
    url: 'https://zh.wikisource.org/wiki/資治通鑑',
    description: {
      zh: '沿编年线索看政局与人物选择，比较事件前后因果及叙述者的取舍。',
      en: 'Follow political events and personal choices chronologically, considering how causal accounts are built and what the narrative selects.',
    },
  },
  {
    title: { zh: '古文观止', en: 'Guwen Guanzhi · Classical Prose Anthology' },
    credit: '吴楚材、吴调侯 编选 · 清 / Selected by Wu Chucai & Wu Diaohou · Qing',
    url: 'https://zh.wikisource.org/wiki/古文觀止',
    description: {
      zh: '从历代散文选篇入手，比较叙事、议论与抒情的章法，适合慢读和诵读。',
      en: 'An anthology for comparing narrative, argument and lyrical prose across periods, with opportunities for close reading and reading aloud.',
    },
  },
  {
    title: { zh: '滕王阁序', en: 'Preface to the Pavilion of Prince Teng' },
    credit: '王勃 · 唐 / Wang Bo · Tang',
    url: 'https://zh.wikisource.org/wiki/滕王閣序',
    description: {
      zh: '骈句铺陈山川与身世，留意对偶、声律和情绪转折，适合出声诵读。',
      en: 'Parallel prose moves between landscape and personal circumstance; listen for paired phrases, cadence and emotional turns.',
    },
  },
  {
    title: { zh: '前赤壁赋', en: 'First Rhapsody on the Red Cliffs' },
    credit: '苏轼 · 北宋 / Su Shi · Northern Song',
    url: 'https://zh.wikisource.org/wiki/前赤壁賦',
    description: {
      zh: '由江月夜游转入主客问答，体会景、情与哲思如何随句式节奏展开。',
      en: 'A moonlit river outing becomes a dialogue between host and guest, carrying scenery, feeling and reflection through changing rhythms.',
    },
  },
  {
    title: { zh: '岳阳楼记', en: 'An Account of Yueyang Tower' },
    credit: '范仲淹 · 北宋 / Fan Zhongyan · Northern Song',
    url: 'https://zh.wikisource.org/wiki/岳陽樓記',
    description: {
      zh: '借阴晴景象对照人生感受，再转向公共关怀，留意句式与议论的递进。',
      en: 'Contrasting weather and moods lead into public responsibility; follow the progression of sentence patterns and argument.',
    },
  },
  {
    title: { zh: '唐诗三百首', en: 'Three Hundred Tang Poems' },
    credit: '唐代诸家 · 孙洙（蘅塘退士）编选 / Tang poets · Selected by Sun Zhu',
    url: 'https://zh.wikisource.org/wiki/唐詩三百首',
    description: {
      zh: '按诗体选读唐人篇章，体会节奏、声韵与意象，适合作为诵读的入口。',
      en: 'Explore Tang poetry by verse form, listening for rhythm and sound while attending to imagery; a starting point for reading aloud.',
    },
  },
]
