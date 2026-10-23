import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import type { Language } from '../navigation'
import catalogData from './data/bright-stars.json'
import images from './data/images.json'
import {
  calculateSky, DEFAULT_SITE, lunarPhasePath, MAX_DATE, MIN_DATE,
  parseObservation, phaseIndex, projectSky, utcInput,
} from './astronomy'
import type { BrightStar, Observation, SkyObject } from './astronomy'
import './Observatory.css'

export type ObservatoryProps = { language: Language; onClose: () => void }
type View = 'sky' | 'moon' | 'sun'
const catalog: readonly BrightStar[] = catalogData
const phases = [
  ['新月前后', 'Near new moon'], ['娥眉月', 'Waxing crescent'], ['上弦附近', 'First quarter'], ['盈凸月', 'Waxing gibbous'],
  ['满月前后', 'Near full moon'], ['亏凸月', 'Waning gibbous'], ['下弦附近', 'Last quarter'], ['残月', 'Waning crescent'],
]
const starColor = (bv: number | null) => bv === null ? '#e2e9e7' : bv < .1 ? '#c8dcfa' : bv < .6 ? '#e4eaf0' : bv < 1.1 ? '#f3dfb5' : '#ebbc92'

export function Observatory({ language, onClose }: ObservatoryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const latestClose = useRef(onClose)
  const [observation, setObservation] = useState<Observation>(() => ({ ...DEFAULT_SITE, time: new Date(Math.floor(Date.now() / 60_000) * 60_000) }))
  const [draft, setDraft] = useState(() => ({ utc: utcInput(observation.time), latitude: String(DEFAULT_SITE.latitude), longitude: '0' }))
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('sky')
  const [selectedId, setSelectedId] = useState('moon')
  const [limit, setLimit] = useState(4)
  const [imageFailed, setImageFailed] = useState(false)
  const gradientId = useId()
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const sky = useMemo(() => calculateSky(observation, catalog), [observation])
  const objects = useMemo(() => [sky.sun, sky.moon, ...sky.stars], [sky])
  const selected = objects.find(object => object.id === selectedId) ?? sky.moon
  const visibleStars = sky.stars.filter(star => star.altitude >= 0 && star.magnitude <= limit)
  const plotted = [...visibleStars, sky.sun, sky.moon].filter(object => object.altitude >= 0)
  const image = images.find(item => item.id.startsWith(view))
  const label = (object: SkyObject) => object.kind === 'sun' ? t('太阳', 'Sun') : object.kind === 'moon' ? t('月球', 'Moon') : object.name
  const sameDefaultSite = observation.latitude === DEFAULT_SITE.latitude && observation.longitude === DEFAULT_SITE.longitude

  useLayoutEffect(() => { latestClose.current = onClose }, [onClose])
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // The parent island may already hold the scroll lock. Do not restore its lock on a joint unmount.
    const body = document.body, previousOverflow = body.style.overflow
    const ownsLock = previousOverflow !== 'hidden'
    if (ownsLock) body.style.overflow = 'hidden'
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); latestClose.current(); return }
      if (event.key !== 'Tab') return
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, summary, a[href]')]
        .filter(control => control.getClientRects().length > 0)
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    dialog.addEventListener('keydown', keyboard)
    return () => {
      dialog.removeEventListener('keydown', keyboard)
      dialog.close()
      if (ownsLock) body.style.overflow = previousOverflow
    }
  }, [])

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try { setObservation(parseObservation(draft.utc, draft.latitude, draft.longitude)); setError('') }
    catch (cause) {
      const field = cause instanceof Error ? cause.message : ''
      setError(field === 'latitude' ? t('纬度须在 −90° 至 90° 之间。', 'Latitude must be between −90° and 90°.')
        : field === 'longitude' ? t('经度须在 −180° 至 180° 之间。', 'Longitude must be between −180° and 180°.')
          : t('请输入 1900 至 2100 年间有效的 UTC 日期和时间。', 'Enter a valid UTC date and time between 1900 and 2100.'))
    }
  }
  const changeTime = (time: Date) => {
    if (time.getUTCFullYear() < 1900 || time.getUTCFullYear() > 2100) return
    setObservation(previous => ({ ...previous, time }))
    setDraft(previous => ({ ...previous, utc: utcInput(time) }))
    setError('')
  }
  const changeView = (next: View) => { setView(next); setImageFailed(false); if (next !== 'sky') setSelectedId(next) }
  const chooseObject = (id: string) => { setSelectedId(id); if (id !== view) setView('sky') }
  const selectFromChart = (event: MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width * 720
    const y = (event.clientY - bounds.top) / bounds.height * 720
    let closest: SkyObject | undefined, distance = 17
    for (const object of plotted) {
      const point = projectSky(object.altitude, object.azimuth)!
      const d = Math.hypot(x - point.x, y - point.y)
      if (d < distance) { closest = object; distance = d }
    }
    if (closest) setSelectedId(closest.id)
  }

  return <dialog ref={dialogRef} className="observatory" aria-modal="true" aria-labelledby="observatory-title" lang={zh ? 'zh-CN' : 'en'}
    onCancel={event => { event.preventDefault(); latestClose.current() }}>
    <div className="observatory-shell">
      <header className="observatory-header"><div><p className="observatory-eyebrow">THE OBSERVATORY</p><h2 id="observatory-title">{t('抬头，看一片真实的星空', 'A sky grounded in observation')}</h2><p>{t('真实星表 · 本地天文计算 · NASA 归档影像', 'Catalogued stars · Local ephemerides · NASA archival imagery')}</p></div><button ref={closeRef} className="observatory-close" type="button" onClick={onClose} aria-label={t('关闭观星台，返回岛屿', 'Close the observatory and return to the island')}><span className="observatory-close-label">{t('返回岛屿', 'Back to the island')}</span><span aria-hidden="true">×</span></button></header>

      <form className="observatory-form" onSubmit={apply} noValidate>
        <label className="observatory-time">{t('日期与时间', 'Date & time')} <span>UTC</span><input type="datetime-local" min={MIN_DATE} max={MAX_DATE} step="60" required value={draft.utc} onChange={event => setDraft(previous => ({ ...previous, utc: event.target.value }))} /></label>
        <label>{t('纬度 / 北为正', 'Latitude / north +')}<input type="number" min="-90" max="90" step="any" required value={draft.latitude} onChange={event => setDraft(previous => ({ ...previous, latitude: event.target.value }))} /></label>
        <label>{t('经度 / 东为正', 'Longitude / east +')}<input type="number" min="-180" max="180" step="any" required value={draft.longitude} onChange={event => setDraft(previous => ({ ...previous, longitude: event.target.value }))} /></label>
        <button type="submit">{t('应用设置', 'Apply')}</button>
      </form>
      <div className="observatory-site-note"><p>{sameDefaultSite ? t('公开默认位置：格林尼治（51.4779°N，0°）。可手动修改，不读取设备位置。', 'Public default: Greenwich (51.4779°N, 0°). Edit manually; no device location is requested.') : t('使用你手动输入的经纬度；不请求定位权限，不上传这些设置。', 'Using your manually entered coordinates; no location permission or upload.')} {t('观测高度按海平面计算。', 'Sea-level observer.')}</p><p role="status" className="observatory-error">{error}</p></div>

      <div className="observatory-toolbar"><div className="observatory-views" role="group" aria-label={t('观测视图', 'Observation view')}>{(['sky', 'moon', 'sun'] as const).map(item => <button type="button" key={item} aria-pressed={view === item} onClick={() => changeView(item)}>{item === 'sky' ? t('星空图', 'Sky chart') : item === 'moon' ? t('月球影像', 'Moon image') : t('太阳影像', 'Sun image')}</button>)}</div><div className="observatory-time-actions"><button type="button" onClick={() => changeTime(new Date(observation.time.getTime() - 3_600_000))} aria-label={t('提前一小时', 'One hour earlier')}>−1h</button><button type="button" onClick={() => changeTime(new Date(Math.floor(Date.now() / 60_000) * 60_000))}>{t('现在（设备时钟）', 'Now (device clock)')}</button><button type="button" onClick={() => changeTime(new Date(observation.time.getTime() + 3_600_000))} aria-label={t('推后一小时', 'One hour later')}>+1h</button></div></div>
      <p className="observatory-applied-time">{t('当前计算时刻', 'Current calculation')} <time dateTime={observation.time.toISOString()}>{utcInput(observation.time).replace('T', ' ')} UTC</time></p>

      <div className="observatory-workspace"><section className="observatory-view" aria-label={view === 'sky' ? t('根据时间地点计算的星空图', 'Sky chart calculated for the selected time and place') : t('有日期标注的 NASA 归档影像', 'Dated NASA archival imagery')}>
        {view === 'sky' ? <>
          <div className="observatory-chart-top"><span className="observatory-badge">{t('计算星图 / 不是相机实拍', 'CALCULATED CHART / NOT A CAMERA VIEW')}</span><label htmlFor={`${gradientId}-magnitude`}>{t('显示至星等', 'Magnitude limit')} <output>{limit.toFixed(1)}</output><input id={`${gradientId}-magnitude`} type="range" min="0" max="4" step="0.5" value={limit} onChange={event => setLimit(Number(event.target.value))} /></label></div>
          <svg className="observatory-chart" viewBox="0 0 720 720" role="img" aria-label={t('天顶在中央，北在上方，东在左侧。点击天体查看详情；键盘用户可用右侧选择框。', 'Zenith at the centre, north up, east left. Click an object for details, or use the object selector for keyboard access.')} onClick={selectFromChart}>
            <defs><radialGradient id={gradientId}><stop stopColor={sky.sun.altitude > -6 ? '#253b4c' : '#102435'} /><stop offset="1" stopColor="#07131e" /></radialGradient></defs>
            <circle cx="360" cy="360" r="300" fill={`url(#${gradientId})`} />
            {[100, 200, 300].map((r, index) => <g className="observatory-grid" key={r}><circle cx="360" cy="360" r={r} /><text x="370" y={360 - r + 16}>{60 - index * 30}°</text></g>)}
            <g className="observatory-grid"><path d="M60 360H660M360 60V660" /><circle cx="360" cy="360" r="2" /></g>
            <g className="observatory-cardinals"><text x="360" y="34" textAnchor="middle">{t('北', 'N')}</text><text x="360" y="700" textAnchor="middle">{t('南', 'S')}</text><text x="26" y="365" textAnchor="middle">{t('东', 'E')}</text><text x="694" y="365" textAnchor="middle">{t('西', 'W')}</text></g>
            {plotted.map(object => {
              const point = projectSky(object.altitude, object.azimuth)!
              const radius = object.kind === 'star' ? Math.max(1.1, 3.5 - object.magnitude * .65) : object.kind === 'sun' ? 7 : 5.5
              const labelOnLeft = point.x > 540
              return <g key={object.id}><title>{label(object)} · {object.altitude.toFixed(1)}° / {object.azimuth.toFixed(1)}°</title><circle cx={point.x} cy={point.y} r={radius} fill={object.kind === 'sun' ? '#f3d998' : object.kind === 'moon' ? '#e7e7d4' : starColor(object.star?.colorIndex ?? null)} />{object.id === selected.id && <circle className="observatory-selection" cx={point.x} cy={point.y} r={radius + 8} />}{(object.kind !== 'star' || object.id === selected.id) && <text className="observatory-object-label" x={point.x + (labelOnLeft ? -1 : 1) * (radius + 10)} y={point.y + 4} textAnchor={labelOnLeft ? 'end' : 'start'}>{label(object)}</text>}</g>
            })}
          </svg>
          <p className="observatory-current-object" aria-live="polite"><strong>{label(selected)}</strong> {t('高度', 'Altitude')} {selected.altitude.toFixed(1)}° <span>·</span> {t('方位', 'Azimuth')} {selected.azimuth.toFixed(1)}°</p>
          <p className="observatory-chart-note">{t('向天顶仰望：东在左。', 'Looking upward: east is on the left.')} {visibleStars.length} / {catalog.length} {t('颗目录亮星在地平线上方；点大小与颜色为示意。', 'catalogued bright stars above the horizon; symbol sizes and colors are illustrative.')}</p>
          <p className="observatory-daylight">{sky.sun.altitude >= 0 ? t('此时太阳在地平线上方。图中仍标出恒星位置，不表示白昼能肉眼看见它们。', 'The Sun is above the horizon. Stars remain plotted to show their positions; this does not mean they are visible in daylight.') : sky.sun.altitude > -18 ? t('此时处于暮光阶段，较暗恒星可能被天光掩盖。', 'Twilight: fainter stars may be obscured by sky brightness.') : t('太阳低于地平线 18°；这张图不模拟天气、光污染或地形遮挡。', 'The Sun is more than 18° below the horizon. Weather, light pollution and terrain are not simulated.')}</p>
        </> : image && <figure className="observatory-photo"><div className="observatory-photo-top"><span className="observatory-badge">{t('真实观测影像 / 非实时', 'OBSERVATIONAL IMAGE / NOT LIVE')}</span><time dateTime={image.observedAt}>{image.observedAt}</time></div>{imageFailed ? <div className="observatory-image-failure" role="status">{t('这张本地影像暂时无法载入，可打开下方 NASA 来源。', 'The local image could not load. Open the NASA source below.')}</div> : <img src={image.path} width={image.width} height={image.height} alt={image.title[language]} decoding="async" onError={() => setImageFailed(true)} />}
          <figcaption><h3>{image.title[language]}</h3><p>{image.details[language]}</p><p className="observatory-photo-credit">{image.credit} <span>·</span> <a href={image.sourceUrl}>{t('NASA 影像记录', 'NASA image record')} ↗</a></p><p className="observatory-archive-note">{t('归档照片不会随上方时间、地点或月相变化。', 'The archive image does not change with the selected time, location or lunar phase.')}</p></figcaption>
        </figure>}
      </section>

      <aside className="observatory-inspector"><label className="observatory-object-picker">{t('选择天体', 'Select an object')}<select value={selected.id} onChange={event => chooseObject(event.target.value)}>{objects.map(object => <option key={object.id} value={object.id}>{label(object)}{object.kind === 'star' ? ` · ${object.magnitude.toFixed(2)}` : ''}</option>)}</select></label><div className="observatory-object-heading"><p className="observatory-eyebrow">{selected.kind === 'star' ? 'HYG v4.1 / J2000 → DATE' : 'ASTRONOMY ENGINE / TOPOCENTRIC'}</p><h3>{label(selected)}</h3><p>{selected.altitude >= 0 ? t('地平线上方', 'Above the horizon') : t('地平线下方', 'Below the horizon')}</p></div>
        <dl className="observatory-metrics"><div><dt>{t('高度角', 'Altitude')}</dt><dd>{selected.altitude.toFixed(1)}°</dd></div><div><dt>{t('方位角 / 北起顺时针', 'Azimuth / clockwise from north')}</dt><dd>{selected.azimuth.toFixed(1)}°</dd></div><div><dt>{t('赤经 / 日期坐标', 'RA / equator of date')}</dt><dd>{selected.raHours.toFixed(3)} h</dd></div><div><dt>{t('赤纬 / 日期坐标', 'Dec / equator of date')}</dt><dd>{selected.decDeg.toFixed(2)}°</dd></div>{selected.kind === 'star' ? <div><dt>{t('视星等 / 星表值', 'Visual magnitude / catalog')}</dt><dd>{selected.magnitude.toFixed(2)}</dd></div> : <div><dt>{t('距观测者', 'Observer distance')}</dt><dd>{Math.round(selected.distanceKm ?? 0).toLocaleString(language)} km</dd></div>}</dl>
        <div className="observatory-phase"><svg viewBox="-29 -29 58 58" role="img" aria-label={t('计算月相示意，非照片；朝向不模拟当地视角。', 'Computed lunar phase schematic, not a photo; orientation is not location-specific.')}><circle r="24" fill="#162731" stroke="#879a9b55" /><path d={lunarPhasePath(sky.illuminatedFraction)} fill="#e8e7ce" transform={sky.phaseAngle > 180 ? 'scale(-1,1)' : undefined} /></svg><div><span>{t('所选时刻的月相', 'Moon phase at selected time')}</span><strong>{phases[phaseIndex(sky.phaseAngle)][zh ? 0 : 1]}</strong><p>{t('照明比例', 'Illuminated')} {(sky.illuminatedFraction * 100).toFixed(1)}%</p></div></div>
        <p className="observatory-phase-note">{t('月相为计算示意；不表示月面细节或当地所见朝向。', 'The phase symbol is computed, without surface detail or a local orientation.')}</p>
        <div className="observatory-body-links"><button type="button" onClick={() => changeView('moon')}>{t('看月球观测影像', 'View the Moon image')} ↗</button><button type="button" onClick={() => changeView('sun')}>{t('看太阳观测影像', 'View the Sun image')} ↗</button></div>
      </aside></div>

      <footer className="observatory-footer"><p className="observatory-timestamp">{t('计算时刻', 'Calculated for')} <time dateTime={observation.time.toISOString()}>{utcInput(observation.time).replace('T', ' ')} UTC</time> <span>·</span> {observation.latitude.toFixed(4)}°, {observation.longitude.toFixed(4)}°</p><details className="observatory-sources"><summary>{t('数据来源、许可与计算范围', 'Sources, licenses & calculation scope')}</summary><div><p>{t('星图依据 HYG v4.1 最亮 400 颗恒星的 J2000 坐标、视星等和线性自行，加入岁差与章动；不含恒星周年视差、周年光行差、大气折射或当地遮挡。太阳月球为观测者位置的日期坐标。用于理解天空位置，不是望远镜指向解。', 'The chart uses J2000 coordinates, visual magnitudes and linear proper motions for the 400 brightest HYG v4.1 stars, with precession and nutation. Stellar annual parallax, annual aberration, atmospheric refraction and local obstructions are omitted. Sun and Moon coordinates are topocentric and of date. This is a sky-position guide, not a telescope pointing solution.')}</p><ul><li><a href="https://github.com/cosinekitty/astronomy">Astronomy Engine 2.1.19</a> · MIT · Don Cross</li><li>HYG v4.1 · David Nash / Astronexus · CC BY-SA 4.0 · <a href="/observatory/HYG-NOTICE.txt">{t('星表许可与来源', 'Catalog attribution')}</a> · <a href="/observatory/bright-stars.json">{t('离线星表', 'Offline catalog')}</a></li><li>{t('NASA 影像是各自标注日期的归档科学观测产品；增强色与伪彩不等于人眼自然色。NASA 不为本站背书。', 'NASA images are archived scientific observations dated individually; enhanced and false colors are not natural human vision. NASA does not endorse this site.')} <a href="/observatory/NASA-NOTICE.txt">{t('完整影像来源与使用说明', 'Full image credits and usage notices')}</a></li></ul></div></details></footer>
    </div>
  </dialog>
}
