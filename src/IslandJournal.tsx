import { useState } from 'react'
import { IslandActivity } from './IslandActivity'
import { literature } from './literature'
import { reading } from './reading'
import { landmarkById } from './island/landmarks'
import type { LandmarkChapter, LandmarkId } from './island/landmarks'
import type { Language } from './navigation'
import './IslandJournal.css'

type Note = { intro: { zh: string; en: string }; books: readonly number[]; prompts: readonly { zh: string; en: string }[] }
const notes: Partial<Record<LandmarkId, Note>> = {
  gate: {
    intro: { zh: '从山门往北是藏书殿，西边的小路经过镜湖和碑廊，再绕向山脊。往南穿过竹林，可以走到溪畔书斋。不妨选一个地方，慢慢走过去。', en: 'The library lies north of the gate. A western path passes the lake and history cloister before climbing the ridge. South through the bamboo is a waterside study. Choose a place and take the long way there.' },
    books: [], prompts: [{ zh: '地图中的入口会沿地面寻路；也可以点击地面、自己步行。', en: 'Map destinations follow walkable routes. You can also click the ground or walk freely.' }, { zh: '经过水榭读一篇古文，再去山顶看看此刻的星空。', en: 'Pause for some prose by the lake, then visit the observatory for the sky at a chosen time.' }],
  },
  lake: {
    intro: { zh: '水边适合读一点景物与心绪相互照应的文字。先看一遍句子怎样写景，再读一遍，留意笔锋从何处转向人的处境。', en: 'At the water’s edge, read how a landscape becomes a state of mind. Read once for the scenery, then again for the moment the writing turns toward human circumstances.' },
    books: [4, 5], prompts: [{ zh: '文章从哪里开始转折？试着用自己的话复述前后两段。', en: 'Where does the piece turn? Retell the passages on either side in your own words.' }, { zh: '同一处景物，换一种心境，还会有同样的写法吗？', en: 'Would the same landscape be described the same way in another mood?' }],
  },
  history: {
    intro: { zh: '碑廊不列年表，留一处读史的地方。同一个人物，放进一生和放进一个时代，叙述的重心往往不同。可以把纪传与编年放在一起读。', en: 'This cloister is a place to read history rather than a wall of dates. A life and a period invite different narrative choices. Try reading biography alongside chronology.' },
    books: [0, 1], prompts: [{ zh: '把一段叙述拆成事实、人物说法和作者判断。哪些部分还需要别的材料？', en: 'Separate events, reported speech and the narrator’s judgment. Which parts call for another source?' }, { zh: '若换一个人物作为叙述中心，这段历史会怎样改变？', en: 'How would the account change if another person became its central figure?' }],
  },
  bamboo: {
    intro: { zh: '读古文不必一开始就逐字拆解。先顺着句子的停顿读，听听长短句、对偶和反复怎样连成节奏，再回头看意思。', en: 'Classical prose can begin with the voice. Follow pauses, paired phrases and changes of sentence length before returning to close interpretation.' },
    books: [2, 3, 6], prompts: [{ zh: '选一小段，分别按语意和按声律停顿，听听有什么不同。', en: 'Read a short passage twice, pausing first for sense and then for sound. What changes?' }, { zh: '找出一句自己愿意记住的话，试着说明喜欢它的理由。', en: 'Choose a sentence worth remembering and explain what makes it stay with you.' }],
  },
  ridge: {
    intro: { zh: '山脊上留出一段开阔视野。这里可以回望走过的路，也可以继续去观星台，选择时间与地点，查看太阳、月球和恒星的位置。', en: 'The ridge opens a view over the paths below. Look back at the walk, or continue to the observatory to choose a time and location for the Sun, Moon and stars.' },
    books: [], prompts: [{ zh: '观星台按所选时间和地点计算天体位置；它不是实景摄像头。', en: 'The observatory calculates celestial positions for your chosen time and place; it is not a live camera.' }, { zh: '可以先找月球，再改变日期，观察它在天空中的位置变化。', en: 'Find the Moon, then change the date and compare its position in the sky.' }],
  },
  studio: {
    intro: { zh: '书斋放几本可供翻阅的书目。数学与统计之外，也留一点位置给历史。它们是阅读线索，不是已经读完的清单。', en: 'A few books to browse, with room for history alongside mathematics and statistics. These are reading directions rather than a list of completed books.' },
    books: [], prompts: [{ zh: '读完一个定义，自己举一个例子和一个反例。', en: 'After a definition, make one example and one counterexample of your own.' }, { zh: '合上书，用一段话写下这一节究竟解决了什么问题。', en: 'Close the book and write one paragraph about the problem the section actually resolves.' }],
  },
}

export function IslandJournal({ id, language, onClose, onVisit, onObserve, onMap }: { id: LandmarkId; language: Language; onClose: () => void; onVisit: (chapter: LandmarkChapter) => void; onObserve: () => void; onMap: () => void }) {
  const [selected, setSelected] = useState(0)
  const place = landmarkById(id), note = notes[id] ?? notes.gate!
  const books = id === 'studio' ? reading : note.books.map(index => literature[index])
  const book = books[selected] ?? books[0]
  const zh = language === 'zh'
  return <IslandActivity language={language} title={place.title[language]} onClose={onClose}>
    <article className="island-journal">
      <div className="journal-intro"><p className="journal-kicker">{zh ? '岛屿札记' : 'NOTES FROM THE ISLAND'}</p><p>{note.intro[language]}</p></div>
      {!!books.length && <section className="journal-reading" aria-label={zh ? '此处书目' : 'Reading here'}>
        <nav aria-label={zh ? '选择篇目' : 'Choose a text'}>{books.map((item, index) => <button type="button" key={item.url} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.title[language]}</button>)}</nav>
        {book && <div className="journal-book"><p>{book.credit}</p><h3>{book.title[language]}</h3><p>{book.description[language]}</p><a href={book.url} target="_blank" rel="noreferrer">{zh ? '打开原文或书目来源' : 'Open the text or book source'} ↗</a></div>}
      </section>}
      <section className="journal-prompts"><h3>{zh ? '在这里停一停' : 'A moment here'}</h3>{note.prompts.map((prompt, index) => <p key={index}><span>0{index + 1}</span>{prompt[language]}</p>)}</section>
      <div className="journal-actions"><button type="button" onClick={onMap}>{zh ? '展开岛屿地图' : 'Open the island map'} ↗</button>{id === 'ridge' ? <button type="button" onClick={onObserve}>{zh ? '打开观星台' : 'Open the observatory'} ↗</button> : <button type="button" onClick={() => onVisit(place.chapter)}>{zh ? '继续阅读主页内容' : 'Continue to the reading pages'} ↗</button>}</div>
    </article>
  </IslandActivity>
}
