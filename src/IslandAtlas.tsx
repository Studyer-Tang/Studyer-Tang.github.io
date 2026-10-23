import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { islandLandmarks } from './island/landmarks'
import type { LandmarkId } from './island/landmarks'
import { islandRadiusAt, LAKE_CENTER, LAKE_RADII } from './island/layout'
import { islandTrails } from './island/trails'
import type { IslandPose } from './island/world'
import type { Language } from './navigation'
import './IslandAtlas.css'

export type AtlasHandle = { updatePose: (pose: IslandPose) => void }
const shore = Array.from({ length: 129 }, (_, i) => {
  const angle = i / 128 * Math.PI * 2, radius = islandRadiusAt(angle)
  return `${i ? 'L' : 'M'}${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius).toFixed(1)}`
}).join(' ') + ' Z'
const regions = [
  { x: -35, z: -66, zh: '北山', en: 'RIDGE' }, { x: -125, z: 12, zh: '西林', en: 'WOODS' },
  { x: 5, z: 78, zh: '南园', en: 'GARDEN' },
]
export const IslandAtlas = forwardRef<AtlasHandle, { language: Language; initialPose: IslandPose; visited: ReadonlySet<LandmarkId>; route: LandmarkId | null; enabled: boolean; onWalk: (id: LandmarkId) => void; onRead: (id: LandmarkId) => void; onClose: () => void }>(function IslandAtlas({ language, initialPose, visited, route, enabled, onWalk, onRead, onClose }, ref) {
  const [pose, setPose] = useState(initialPose)
  const close = useRef<HTMLButtonElement>(null)
  useImperativeHandle(ref, () => ({ updatePose: setPose }), [])
  useEffect(() => { close.current?.focus({ preventScroll: true }) }, [])
  const zh = language === 'zh'
  return <aside id="island-atlas-panel" className="island-atlas" aria-labelledby="atlas-title" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() } }}>
    <header><div><p>AN ISLAND ATLAS</p><h3 id="atlas-title">{zh ? '山水之间' : 'Between hill and water'}</h3></div><button type="button" ref={close} onClick={onClose} aria-label={zh ? '关闭地图' : 'Close map'}>×</button></header>
    <svg className="atlas-map" viewBox="-181 -156 298 301" role="img" aria-label={zh ? '岛屿示意图，圆点为地点，箭头为当前位置' : 'Schematic island map: dots mark places and the arrow marks your position'}>
      <path d={shore} className="atlas-land" />
      {islandTrails.map((trail, index) => <polyline key={index} points={trail.map(point => point.join(',')).join(' ')} className="atlas-trail" />)}
      <path d="M43 10H102V25H84V18H43Z" className="atlas-pier" />
      <ellipse cx={LAKE_CENTER.x} cy={LAKE_CENTER.z} rx={LAKE_RADII.x} ry={LAKE_RADII.z} className="atlas-lake" />
      {regions.map(region => <text key={region.zh} x={region.x} y={region.z} className="atlas-region">{region[language]}</text>)}
      <path d="M-119 -33H-60" className="atlas-bridge" />
      <text x="94" y="-135" className="atlas-north">N ↑</text>
      {islandLandmarks.map((place, index) => <g key={place.id} className={visited.has(place.id) ? 'atlas-place is-visited' : 'atlas-place'}><circle cx={place.entry.x} cy={place.entry.z} r={route === place.id ? 7 : 5} /><text x={place.entry.x} y={place.entry.z + 2}>{index + 1}</text></g>)}
      <g transform={`translate(${pose.x} ${pose.z}) rotate(${-pose.heading * 180 / Math.PI})`} className="atlas-player"><circle r="8" /><path d="M0 -7L4 5L0 3L-4 5Z" /></g>
    </svg>
    <p className="atlas-caption">{zh ? `本次已到访 ${visited.size} / ${islandLandmarks.length} 处 · 点击「前往」沿路步行` : `${visited.size} / ${islandLandmarks.length} places visited · Walk to a destination`}</p>
    <ol className="atlas-places">{islandLandmarks.map(place => <li key={place.id} data-visited={visited.has(place.id)}><button type="button" onClick={() => onRead(place.id)}>{place.title[language]}<span aria-hidden="true"> ↗</span></button><button type="button" disabled={!enabled} aria-label={`${zh ? '步行前往' : 'Walk to'} ${place.title[language]}`} onClick={() => onWalk(place.id)}>{route === place.id ? (zh ? '途中' : 'Walking') : (zh ? '前往' : 'Walk')}</button></li>)}</ol>
    <p className="atlas-footnote">{zh ? '手动移动会结束导航。地图是示意图，沿途可随时停下。' : 'Manual movement ends navigation. This is a schematic map; stop anywhere along the way.'}</p>
  </aside>
})
