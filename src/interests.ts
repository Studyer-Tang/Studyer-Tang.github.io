export type Interest = {
  id: string
  title: { zh: string; en: string }
  description: { zh: string; en: string }
}

export const interests: Interest[] = [
  {
    id: 'history-ideas',
    title: { zh: '历史与思想', en: 'History & ideas' },
    description: {
      zh: '我喜欢历史，尤其喜欢古文史书里的人物、叙事和议论，也喜欢追问一个观念从何而来。罗素的哲学思考与欧拉的著作，同样是我感兴趣的阅读线索。',
      en: 'I enjoy history, especially the people, narratives and arguments in classical Chinese historical writing. I also like asking where ideas come from; Russell’s philosophical questions and Euler’s works are further reading interests.',
    },
  },
  {
    id: 'poetry-prose',
    title: { zh: '诗词与散文', en: 'Poetry & prose' },
    description: {
      zh: '我喜欢朗朗上口的诗词与散文，尤其在意句子的节奏、声韵和停顿。也愿意放慢速度，出声诵读，体会文字在声音中的起伏。',
      en: 'I enjoy poetry and prose that flow naturally aloud, especially their rhythm, sound and pauses. I like the idea of slowing down and reading aloud to hear how the words rise and fall.',
    },
  },
  {
    id: 'mathematics-analysis',
    title: { zh: '数学与分析', en: 'Mathematics & analysis' },
    description: {
      zh: '分析学吸引我的，是直觉与严谨之间的来回。统计与金融市场则提供了另一类问题：当信息有限时，我们怎样理解不确定性？',
      en: 'I am drawn to the interplay of intuition and rigor in analysis. Statistics and financial markets raise a related question for me: how do we understand uncertainty when information is limited?',
    },
  },
  {
    id: 'games-deduction',
    title: { zh: '游戏与推理', en: 'Games & deduction' },
    description: {
      zh: '游戏里，我偏爱线索逐渐连起来的时刻。从零散的信息重建故事，试着解释矛盾，再根据新线索修正判断；吸引我的是推理本身，以及发现另一种可能的过程。',
      en: 'In games, I enjoy the moment when clues begin to connect: reconstructing a story from fragments, trying to explain contradictions, then revising a judgment as new evidence appears. The appeal is in the deduction and discovering another possibility.',
    },
  },
]
