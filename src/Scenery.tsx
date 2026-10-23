import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from './navigation'
import photographs from './photographs.json'
import { AmbientLight } from './AmbientLight'
import './Scenery.css'

export function Scenery({ language, reading = false, exploring = false }: { language: Language; reading?: boolean; exploring?: boolean }) {
  const [enabled, setEnabled] = useState(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [index, setIndex] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const current = useRef(0)
  const desired = useRef(0)
  const request = useRef(0)
  const invalidateRequest = useCallback(() => { request.current++ }, [])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReduced(preference.matches)
    const updateVisibility = () => setVisible(document.visibilityState !== 'hidden')
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      invalidateRequest()
      preference.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [invalidateRequest])
  const showPhoto = useCallback((target: number) => {
    const next = (target + photographs.length) % photographs.length
    const token = ++request.current
    desired.current = next
    setError(false)
    if (next === current.current) { setPending(null); return }
    setPending(next)
    const image = new Image()
    const selectedSource = () => window.matchMedia('(max-width: 600px)').matches ? photographs[next].mobile : photographs[next].desktop
    image.onload = () => {
      if (request.current !== token) return
      const source = new URL(selectedSource(), location.href).href
      if (image.src !== source) { image.src = source; return }
      setPrevious(current.current)
      current.current = next
      setIndex(next)
      setPending(null)
    }
    image.onerror = () => {
      if (request.current !== token) return
      desired.current = current.current
      setPending(null); setError(true)
    }
    image.src = selectedSource()
  }, [])
  const active = enabled && !reduced && visible && !reading && !exploring
  useEffect(() => {
    if (!active || pending !== null) return
    const timer = window.setTimeout(() => showPhoto(current.current + 1), 28000)
    return () => clearTimeout(timer)
  }, [active, index, pending, showPhoto])
  useEffect(() => {
    if (previous === null) return
    const timer = window.setTimeout(() => setPrevious(null), reduced ? 0 : 1700)
    return () => clearTimeout(timer)
  }, [index, previous, reduced])
  const zh = language === 'zh'
  const photo = photographs[index]
  const picture = (i: number, outgoing = false) => <picture className={'photo-layer' + (outgoing ? ' photo-outgoing' : ' photo-current')} key={photographs[i].id}>
    <source media="(max-width: 600px)" srcSet={photographs[i].mobile} />
    <img src={photographs[i].desktop} alt="" fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async" onError={() => setError(true)} />
  </picture>
  return <>
    <div className="scenery" aria-hidden="true">
      {previous !== null && picture(previous, true)}
      {picture(index)}
      <div className="scenery-shade" />
      <AmbientLight active={active} />
    </div>
    <aside className="landscape-bar" aria-label={zh ? '实景摄影与换景' : 'Landscape photographs'}>
      <div className="landscape-caption"><span className="landscape-kicker">{zh ? '实景摄影' : 'LANDSCAPES'}</span><span className="landscape-title">{photo.title[language]}</span></div>
      <nav className="landscape-navigation" aria-label={zh ? '切换风景' : 'Change landscape'}>
        <button type="button" onClick={() => showPhoto(desired.current - 1)} aria-label={zh ? '上一幅风景' : 'Previous landscape'}>←</button>
        {photographs.map((item, i) => <button type="button" key={item.id} aria-label={(zh ? '选择风景：' : 'Show landscape: ') + item.title[language]} aria-pressed={index === i} onClick={() => showPhoto(i)}><span>{String(i + 1).padStart(2, '0')}</span></button>)}
        <button type="button" onClick={() => showPhoto(desired.current + 1)} aria-label={zh ? '下一幅风景' : 'Next landscape'}>→</button>
      </nav>
      <button className="landscape-motion" type="button" aria-pressed={enabled && !reduced} disabled={reduced || reading} onClick={() => setEnabled(value => !value)} title={reduced ? (zh ? '跟随系统减少动态效果' : 'Following reduced motion') : reading ? (zh ? '阅读时保持静景' : 'Landscapes stay still while reading') : (zh ? '暂停或继续自动换景与微光互动' : 'Pause or resume landscapes and ambient light')}>
        <span aria-hidden="true">{active ? 'Ⅱ' : '▷'}</span>{reading ? (zh ? '静景阅读' : 'Reading mode') : (zh ? '自动换景' : 'Autoplay')}
      </button>
      <p className="landscape-credit">© <a href={photo.authorUrl}>{photo.author}</a><span aria-hidden="true"> · </span><a href={photo.sourceUrl}>{zh ? '原片' : 'Original'}</a><span aria-hidden="true"> · </span><a href={photo.licenseUrl}>{photo.license}</a><span> · {zh ? '已裁切与压缩' : 'Cropped & compressed'}</span></p>
      <span className="landscape-status" role="status">{pending !== null ? (zh ? '正在载入下一幅风景…' : 'Loading landscape…') : error ? (zh ? '暂时无法载入，请再试一次。' : 'Unable to load this landscape. Please try again.') : ''}</span>
    </aside>
  </>
}
