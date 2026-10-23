import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { routeHref } from './navigation'
import type { Language } from './navigation'
import { islandLandmarks } from './island/landmarks'
import type { LandmarkChapter, LandmarkId } from './island/landmarks'
import type { AnimalAction, IslandController } from './island/world'
import { ActivityLoading } from './IslandActivity'
import './IslandExplorer.css'

export type IslandExplorerProps = { language: Language; onClose: () => void; onVisit: (chapter: LandmarkChapter) => void }
type Status = 'loading' | 'ready' | 'error'
type Activity = 'observatory' | null
const Observatory = lazy(() => import('./observatory/Observatory').then(module => ({ default: module.Observatory })))
const chapterNames = {
  interests: { zh: '个人兴趣', en: 'Interests' }, research: { zh: '研究兴趣', en: 'Research' },
  reading: { zh: '阅读书架', en: 'Reading' }, personal: { zh: '关于我', en: 'About' },
}
const pointerEndEvents = ['pointerup', 'pointercancel', 'lostpointercapture'] as const

export function IslandExplorer({ language, onClose, onVisit }: IslandExplorerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const joystickRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const runRef = useRef<HTMLButtonElement>(null)
  const worldRef = useRef<IslandController | null>(null)
  const callbacks = useRef({ onClose, onVisit })
  const controlsActive = useRef(false)
  const joystickPointer = useRef<number | null>(null)
  const runPointer = useRef<number | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [failure, setFailure] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [near, setNear] = useState<LandmarkId | null>(null)
  const [nearAnimal, setNearAnimal] = useState<string | null>(null)
  const [animalAction, setAnimalAction] = useState<AnimalAction | null>(null)
  const [activity, setActivity] = useState<Activity>(null)
  const activityRef = useRef(activity)
  const previousActivity = useRef<Activity>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [paused, setPaused] = useState(reduced)
  const pausedRef = useRef(paused)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [running, setRunning] = useState(false)
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const landmark = islandLandmarks.find(item => item.id === near)

  useLayoutEffect(() => { callbacks.current = { onClose, onVisit } }, [onClose, onVisit])

  const clearInput = useCallback(() => {
    const joystick = joystickRef.current, run = runRef.current
    const movementPointer = joystickPointer.current, runningPointer = runPointer.current
    joystickPointer.current = null
    runPointer.current = null
    if (movementPointer !== null && joystick?.hasPointerCapture(movementPointer)) joystick.releasePointerCapture(movementPointer)
    if (runningPointer !== null && run?.hasPointerCapture(runningPointer)) run.releasePointerCapture(runningPointer)
    if (thumbRef.current) thumbRef.current.style.transform = ''
    worldRef.current?.setMove(0, 0)
    worldRef.current?.setRunning(false)
    setRunning(false)
  }, [])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const body = document.body
    const previousOverflow = body.style.overflow, previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`
    body.style.overflow = 'hidden'
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        callbacks.current.onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')]
        .filter(item => item.getClientRects().length > 0)
      const first = items[0], last = items.at(-1)
      if (!first || !last) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    dialog.addEventListener('keydown', trapFocus)
    return () => {
      dialog.removeEventListener('keydown', trapFocus)
      dialog.close()
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [])

  useLayoutEffect(() => {
    activityRef.current = activity
    controlsActive.current = status === 'ready' && !paused && visible && !activity
    worldRef.current?.setPaused(paused || !visible || !!activity)
    if (!controlsActive.current) clearInput()
    else if (document.activeElement === closeRef.current || previousActivity.current) canvasRef.current?.focus({ preventScroll: true })
    previousActivity.current = activity
  }, [paused, visible, status, activity, clearInput])

  useEffect(() => {
    if (!animalAction) return
    const timer = window.setTimeout(() => setAnimalAction(null), 4000)
    return () => clearTimeout(timer)
  }, [animalAction])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motionChanged = () => {
      setReduced(preference.matches)
      if (preference.matches) {
        pausedRef.current = true
        setPaused(true)
        controlsActive.current = false
        worldRef.current?.setPaused(true)
        clearInput()
      }
    }
    const visibilityChanged = () => {
      const nextVisible = document.visibilityState !== 'hidden'
      setVisible(nextVisible)
      worldRef.current?.setPaused(pausedRef.current || !nextVisible || !!activityRef.current)
      if (!nextVisible) { controlsActive.current = false; clearInput() }
    }
    const blur = () => clearInput()
    preference.addEventListener('change', motionChanged)
    document.addEventListener('visibilitychange', visibilityChanged)
    window.addEventListener('blur', blur)
    return () => {
      preference.removeEventListener('change', motionChanged)
      document.removeEventListener('visibilitychange', visibilityChanged)
      window.removeEventListener('blur', blur)
    }
  }, [clearInput])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false, failed = false
    let instance: IslandController | undefined
    const fail = (message: string) => {
      if (cancelled || failed) return
      failed = true
      clearInput()
      setFailure(message)
      setStatus('error')
      setNear(null)
      setNearAnimal(null)
      setAnimalAction(null)
      instance?.dispose()
      if (worldRef.current === instance) worldRef.current = null
    }
    // Keep Three.js in the separately requested world chunk.
    void import('./island/world').then(({ mountIsland }) => {
      if (cancelled) return
      instance = mountIsland(canvas, {
        onNearLandmark: id => { if (!cancelled && !failed) setNear(id) },
        onVisit: chapter => { if (!cancelled && !failed) callbacks.current.onVisit(chapter) },
        onReady: () => {
          if (cancelled || failed) return
          setStatus('ready')
        },
        onError: fail,
        onObserve: () => { if (!cancelled && !failed) setActivity('observatory') },
        onNearAnimal: id => { if (!cancelled && !failed) setNearAnimal(id) },
        onAnimal: action => { if (!cancelled && !failed) setAnimalAction(action) },
      })
      if (cancelled || failed) { instance.dispose(); return }
      worldRef.current = instance
      instance.setPaused(pausedRef.current || document.visibilityState === 'hidden' || !!activityRef.current)
    }).catch(() => fail('The island could not be loaded.'))
    return () => {
      cancelled = true
      instance?.dispose()
      if (worldRef.current === instance) worldRef.current = null
    }
  }, [attempt, clearInput])

  useEffect(() => {
    const joystick = joystickRef.current, run = runRef.current
    if (!joystick || !run) return
    const move = (event: PointerEvent) => {
      if (joystickPointer.current !== event.pointerId || !controlsActive.current) return
      event.preventDefault()
      const rect = joystick.getBoundingClientRect()
      const radius = Math.min(rect.width, rect.height) * .32
      const dx = (event.clientX - rect.left - rect.width / 2) / radius
      const dz = (event.clientY - rect.top - rect.height / 2) / radius
      const length = Math.hypot(dx, dz)
      const x = length < .12 ? 0 : dx / Math.max(1, length)
      const z = length < .12 ? 0 : dz / Math.max(1, length)
      worldRef.current?.setMove(x, z)
      if (thumbRef.current) thumbRef.current.style.transform = `translate(${x * radius}px, ${z * radius}px)`
    }
    const startMove = (event: PointerEvent) => {
      if (!controlsActive.current || event.button !== 0 || joystickPointer.current !== null) return
      joystickPointer.current = event.pointerId
      joystick.setPointerCapture(event.pointerId)
      canvasRef.current?.focus({ preventScroll: true })
      move(event)
    }
    const stopMove = (event: PointerEvent) => {
      if (joystickPointer.current !== event.pointerId) return
      joystickPointer.current = null
      worldRef.current?.setMove(0, 0)
      if (thumbRef.current) thumbRef.current.style.transform = ''
      if (joystick.hasPointerCapture(event.pointerId)) joystick.releasePointerCapture(event.pointerId)
    }
    const setRun = (value: boolean) => { worldRef.current?.setRunning(value); setRunning(value) }
    const startRun = (event: PointerEvent) => {
      if (!controlsActive.current || event.button !== 0 || runPointer.current !== null) return
      event.preventDefault()
      runPointer.current = event.pointerId
      run.setPointerCapture(event.pointerId)
      setRun(true)
    }
    const stopRun = (event: PointerEvent) => {
      if (runPointer.current !== event.pointerId) return
      runPointer.current = null
      setRun(false)
      if (run.hasPointerCapture(event.pointerId)) run.releasePointerCapture(event.pointerId)
    }
    const keyRun = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      if (controlsActive.current) setRun(event.type === 'keydown')
    }
    const releaseKeyRun = () => { if (runPointer.current === null) setRun(false) }
    joystick.addEventListener('pointerdown', startMove)
    joystick.addEventListener('pointermove', move)
    for (const type of pointerEndEvents) joystick.addEventListener(type, stopMove)
    run.addEventListener('pointerdown', startRun)
    for (const type of pointerEndEvents) run.addEventListener(type, stopRun)
    run.addEventListener('keydown', keyRun)
    run.addEventListener('keyup', keyRun)
    run.addEventListener('blur', releaseKeyRun)
    return () => {
      joystick.removeEventListener('pointerdown', startMove)
      joystick.removeEventListener('pointermove', move)
      for (const type of pointerEndEvents) joystick.removeEventListener(type, stopMove)
      run.removeEventListener('pointerdown', startRun)
      for (const type of pointerEndEvents) run.removeEventListener(type, stopRun)
      run.removeEventListener('keydown', keyRun)
      run.removeEventListener('keyup', keyRun)
      run.removeEventListener('blur', releaseKeyRun)
    }
  }, [])

  const togglePause = () => {
    const next = !pausedRef.current
    pausedRef.current = next
    setPaused(next)
    worldRef.current?.setPaused(next || !visible || !!activityRef.current)
    if (next) { controlsActive.current = false; clearInput() }
    else canvasRef.current?.focus({ preventScroll: true })
  }
  const follow = (event: MouseEvent<HTMLAnchorElement>, chapter: LandmarkChapter) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    callbacks.current.onVisit(chapter)
  }

  return <><dialog ref={dialogRef} className="island-explorer" data-status={status} aria-modal="true" aria-hidden={activity ? true : undefined} aria-labelledby="island-title" aria-describedby="island-description" lang={zh ? 'zh-CN' : 'en'}
    onCancel={event => { event.preventDefault(); callbacks.current.onClose() }}>
    <canvas ref={canvasRef} className="island-canvas" tabIndex={status === 'ready' ? 0 : -1} aria-hidden={status !== 'ready'}
      aria-label={t('可步行探索的海岛。使用 WASD 或方向键移动，Shift 奔跑，E 进入附近地标。也可使用下方内容链接。', 'An island to explore on foot. Use WASD or arrow keys to walk, Shift to run, and E to enter a nearby landmark. Equivalent content links are below.')}>
      {t('无法显示海岛时，仍可通过下方链接阅读全部内容。', 'All content remains available through the links below if the island cannot be displayed.')}
    </canvas>
    <div className="island-vignette" aria-hidden="true" />
    <header className="island-header"><div><p className="island-eyebrow">FIELD NOTES / ON FOOT</p><h2 id="island-title">{t('岛上漫游', 'An island, on foot')}</h2></div>
      <div className="island-actions">
        <button type="button" disabled={status !== 'ready'} onClick={togglePause}>{paused ? t('继续探索', 'Resume') : t('暂停', 'Pause')}</button>
        <button type="button" disabled={status !== 'ready'} onClick={() => { clearInput(); worldRef.current?.reset(); if (!paused) canvasRef.current?.focus({ preventScroll: true }) }}>{t('回到起点', 'Start again')}</button>
        <button ref={closeRef} type="button" className="island-close" onClick={onClose}>{t('退出', 'Leave')} <span aria-hidden="true">×</span></button>
      </div>
    </header>
    <p id="island-description" className="island-sr-only">{t('在岛上步行或奔跑，靠近地标后进入对应内容。按 Escape 退出。下方文字入口与岛上地标提供相同内容。', 'Walk or run to a landmark to open its content. Press Escape to leave. The text links below provide the same content as the island landmarks.')}</p>

    {status === 'loading' && <div className="island-status" role="status"><span className="island-loading-line" aria-hidden="true" /><h3>{t('正在准备岛屿…', 'Preparing the island…')}</h3><p>{t('片刻后，就可以沿着小径走走。', 'A short moment, then a path to follow.')}</p><button type="button" onClick={onClose}>{t('取消探索', 'Cancel')}</button></div>}
    {status === 'error' && <div className="island-status island-failure" role="alert"><p className="island-eyebrow">A QUIETER WAY IN</p><h3>{t('暂时无法启程', 'The island is unavailable')}</h3><p>{t('这个浏览器暂时无法显示岛屿。你仍可通过下方入口阅读全部内容。', 'This browser could not display the island. All content is still available through the links below.')}</p>
      <details><summary>{t('查看原因', 'Details')}</summary><p>{failure}</p></details>
      <button type="button" onClick={() => { closeRef.current?.focus({ preventScroll: true }); setStatus('loading'); setFailure(''); setNear(null); setAttempt(value => value + 1) }}>{t('再试一次', 'Try again')}</button></div>}
    {status === 'ready' && paused && <div className="island-status island-paused"><p className="island-eyebrow">A MOMENT OF STILLNESS</p><h3>{t('在此停留片刻', 'A moment to pause')}</h3><p>{reduced ? t('已跟随系统偏好暂停。准备好后，也可以选择继续探索。', 'Paused for your reduced-motion preference. You can choose to explore when you are ready.') : t('准备好后，再沿着小径出发。', 'The path will be here when you are ready.')}</p><button type="button" onClick={togglePause}>{t('继续探索', 'Continue exploring')}</button></div>}
    {status === 'ready' && !paused && !nearAnimal && landmark && <aside className="island-landmark" aria-live="polite" aria-atomic="true"><span>{landmark.title[language]}</span><button type="button" onClick={() => landmark.id === 'research' ? setActivity('observatory') : callbacks.current.onVisit(landmark.chapter)}><kbd aria-hidden="true">E</kbd>{landmark.id === 'research' ? t('打开观星台', 'Open the observatory') : t('进入', 'Enter') + ' ' + chapterNames[landmark.chapter][language]} <span aria-hidden="true">↗</span></button></aside>}
    {status === 'ready' && !paused && nearAnimal && <aside className="island-landmark island-animal"><span>{t('林间的小狐狸', 'A fox in the woods')}</span><div>{(['pet', 'feed', 'follow', 'stay'] as const).map(action => <button type="button" key={action} onClick={() => worldRef.current?.interactAnimal(action)}>{({ pet: ['摸摸', 'Pet'], feed: ['喂食', 'Feed'], follow: ['一起散步', 'Walk with me'], stay: ['在此休息', 'Stay here'] })[action][zh ? 0 : 1]}</button>)}</div></aside>}
    <p className="island-animal-status" role="status">{animalAction ? ({ pet: t('小狐狸停下来，让你轻轻摸摸。', 'The fox stops for a gentle pat.'), feed: t('你递出一点食物，小狐狸凑了过来。', 'The fox comes closer for a small treat.'), follow: t('小狐狸会跟着你，一起沿小径走走。', 'The fox will follow you along the paths.'), stay: t('小狐狸留在这里休息。', 'The fox stays here to rest.') })[animalAction] : ''}</p>

    <div className="island-touch" data-disabled={status !== 'ready' || paused || !visible || !!activity}>
      <div ref={joystickRef} className="island-joystick" role="group" aria-label={t('方向摇杆，拖动移动', 'Direction joystick: drag to move')}><span className="island-joystick-ring" aria-hidden="true" /><span ref={thumbRef} className="island-joystick-thumb" aria-hidden="true" /></div>
      <button ref={runRef} className="island-run" type="button" disabled={status !== 'ready' || paused || !visible || !!activity} aria-pressed={running}>{t('按住跑步', 'Hold to run')}</button>
    </div>
    <footer className="island-footer"><nav className="island-links" aria-label={t('直接阅读岛上内容', 'Read island content directly')}><span>{t('直接阅读', 'READ DIRECTLY')}</span>{islandLandmarks.map(item => <a key={item.id} href={routeHref(item.chapter, language)} onClick={event => follow(event, item.chapter)}>{chapterNames[item.chapter][language]}</a>)}</nav>
      <div className="island-activity-links"><button type="button" onClick={() => setActivity('observatory')}>{t('观星台', 'Observatory')} ↗</button><details className="island-credits"><summary>{t('素材与署名', 'Credits')}</summary><div><p>{t('景观材质、叶片与环境光：', 'Landscape materials, foliage and lighting: ')}<a href="https://polyhaven.com/">Poly Haven</a> · CC0</p><p>{t('人物：', 'Traveler: ')}<a href="https://quaternius.com/packs/ultimatemodularcharacters.html">Quaternius</a> · CC0</p><p>Fox: PixelMannen (CC0); tomkranis ({t('骨骼与动画', 'rigging & animation')}), AsoboStudio & scurest ({t('glTF 转换', 'glTF conversion')}) · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p><p>{t('模型按比例显示，步态使用动画混合。', 'Models are proportionally scaled with blended animation cycles.')} <a href="https://github.com/Studyer-Tang/Studyer-Tang.github.io/blob/main/docs/world-assets.md">{t('完整素材说明', 'Full asset notes')} ↗</a></p></div></details></div>
      <p className="island-help"><span className="island-keyboard-help"><span className="island-pointer-help">{t('点击步行 · 拖动转向 · 滚轮缩放', 'Click to walk · Drag to orbit · Scroll to zoom')}</span><kbd>WASD</kbd> / ↑↓←→ {t('移动', 'walk')} <span>·</span> <kbd>Shift</kbd> {t('跑步', 'run')} <span>·</span> <kbd>E</kbd> {t('进入', 'enter')}</span><span className="island-touch-help">{t('拖动摇杆移动 · 按住右侧按钮跑步', 'Drag to move · Hold the right button to run')}</span></p>
    </footer>
  </dialog>{activity && <Suspense fallback={<ActivityLoading language={language} onClose={() => setActivity(null)} />}><Observatory language={language} onClose={() => setActivity(null)} /></Suspense>}</>
}
