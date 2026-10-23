import { useEffect, useId, useRef, useState } from 'react'
import { IslandActivity } from './IslandActivity'
import { manageSeaPlayback } from './sea-playback'
import type { SeaPlaybackState } from './sea-playback'
import type { Language } from './navigation'
import recording from './sea-recording.json'

export function Seascape({ language, onClose }: { language: Language; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playback = useRef<ReturnType<typeof manageSeaPlayback> | null>(null)
  const [status, setStatus] = useState<SeaPlaybackState>('loading')
  const descriptionId = useId()
  const zh = language === 'zh'
  const moving = status === 'playing' || status === 'loading'

  useEffect(() => {
    const video = videoRef.current!
    const source = window.matchMedia('(max-width: 760px)').matches ? recording.mobile.path : recording.desktop.path
    const controller = manageSeaPlayback(video, source, document, window.matchMedia('(prefers-reduced-motion: reduce)'), setStatus)
    playback.current = controller
    return () => { playback.current = null; controller.dispose() }
  }, [])

  return <IslandActivity language={language} title={zh ? '码头 · 向海而望' : 'The pier · Looking out to sea'} onClose={onClose}>
    <video ref={videoRef} className="seascape-video" muted playsInline loop preload="metadata" poster={recording.poster.path} tabIndex={0}
      aria-label={zh ? '真实海浪录像' : 'Recorded ocean waves'} aria-describedby={descriptionId}
      onKeyDown={event => {
        if ((event.key === ' ' || event.key === 'k') && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault()
          playback.current?.toggle()
        }
      }} />
    {status === 'loading' && <div className="seascape-video-message" role="status">{zh ? '正在载入海浪录像…' : 'Loading the ocean footage…'}</div>}
    {(status === 'blocked' || status === 'paused') && <div className="seascape-video-message" role="status">{status === 'blocked'
      ? (zh ? '点击下方播放按钮，让海浪动起来。' : 'Press Play below to start the waves.')
      : (zh ? '海浪已暂停，点击下方按钮继续。' : 'The waves are paused. Press Play below to continue.')}</div>}
    {status === 'error' && <div className="seascape-error" role="alert">{zh ? '海浪录像暂时无法播放，可以重新载入。' : 'The ocean recording could not play. Try loading it again.'}
      <button type="button" onClick={() => playback.current?.retry()}>{zh ? '重新载入录像' : 'Reload recording'}</button>
    </div>}
    <footer className="seascape-bottom">
      <div className="seascape-controls seascape-video-controls"><button type="button" disabled={status === 'error'} aria-pressed={moving} onClick={() => playback.current?.toggle()}>
        <span aria-hidden="true">{moving ? 'Ⅱ' : '▷'}</span>{moving ? (zh ? '暂停海浪' : 'Pause waves') : (zh ? '播放海浪' : 'Play waves')}
      </button><span className="seascape-recording-label">{zh ? '海岸实拍 · 静音循环' : 'COASTAL FOOTAGE · SILENT LOOP'}</span></div>
      <div className="seascape-credits"><p id={descriptionId}>{zh ? '实拍海浪录像，非直播。' : 'Recorded ocean waves, not a live camera.'} © {recording.creator} · <a href={recording.sourceUrl}>{zh ? '原片' : 'Source'} ↗</a> · <a href={recording.licenseUrl}>{recording.licenseName} ↗</a> · {zh ? '已剪辑与压缩' : 'Edited and compressed'}</p>
        <p className="seascape-help">{zh ? '空格键播放 / 暂停 · 离开页面自动停止' : 'Space to play / pause · Stops when you leave'}</p></div>
    </footer>
  </IslandActivity>
}
