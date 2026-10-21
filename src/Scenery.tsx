import { useEffect, useState } from 'react'
import type { Language } from './navigation'
import './Scenery.css'

export function Scenery({ language }: { language: Language }) {
  const [enabled, setEnabled] = useState(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReduced(preference.matches)
    const updateVisibility = () => setVisible(document.visibilityState !== 'hidden')
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  const zh = language === 'zh'
  const active = enabled && !reduced
  return <>
    <div className="scenery" aria-hidden="true" data-running={active && visible}>
      <div className="scenery-frame"><div className="scenery-image" /><div className="scenery-water" /><div className="scenery-mist" /></div>
      <div className="scenery-shade" />
    </div>
    <button className="scene-control" type="button" disabled={reduced} aria-pressed={active}
      aria-label={zh ? '背景动态' : 'Background motion'}
      title={reduced ? (zh ? '跟随系统：减少动态效果' : 'Following the system: reduced motion') : (active ? (zh ? '暂停背景' : 'Pause background') : (zh ? '播放背景' : 'Play background'))}
      onClick={() => setEnabled(value => !value)}>
      <span className={'motion-dot' + (active ? ' motion-dot-on' : '')} aria-hidden="true" />
      {active ? (zh ? '山水流动' : 'Motion on') : (zh ? '山水静止' : 'Motion off')}
    </button>
  </>
}
