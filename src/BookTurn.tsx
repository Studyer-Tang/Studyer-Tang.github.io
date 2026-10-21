import { Children, Fragment, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { pageGeometry, TURN_DURATION, TURN_SLICES } from './page-geometry'
import type { TurnDirection } from './page-geometry'
import './BookTurn.css'

type Snapshot = { key: string; pages: ReactNode[]; language: string; height: number }
type Flip = { id: number; from: Snapshot; to: Snapshot; direction: -1 | 1; width: number; height: number }
type Props = {
  pageKey: string; language: string; direction: TurnDirection; children: ReactNode
  onBusyChange: (busy: boolean) => void; onSettled: () => void
}

function pagesIn(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? pagesIn(child.props.children) : [child])
}

export function BookTurn({ pageKey, language, direction, children, onBusyChange, onSettled }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const slices = useRef<(HTMLDivElement | null)[]>([])
  const previous = useRef<Snapshot | null>(null)
  const active = useRef(0)
  const serial = useRef(0)
  const [flip, setFlip] = useState<Flip | null>(null)
  const pages = pagesIn(children)
  const finish = useCallback((id: number) => {
    if (active.current !== id) return
    active.current = 0
    setFlip(null)
    onBusyChange(false)
    onSettled()
  }, [onBusyChange, onSettled])

  useLayoutEffect(() => {
    const bounds = stage.current?.getBoundingClientRect()
    const next: Snapshot = { key: pageKey, pages, language, height: bounds?.height ?? 0 }
    const before = previous.current
    previous.current = next
    if (!before || before.key === pageKey) return
    const simple = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 680px)').matches
    if (!direction || simple || before.pages.length !== 2 || pages.length !== 2 || !bounds?.width) {
      active.current = 0
      setFlip(null)
      onBusyChange(false)
      onSettled()
      return
    }
    const id = ++serial.current
    active.current = id
    setFlip({ id, from: before, to: next, direction, width: bounds.width / 2, height: Math.max(before.height, next.height) })
    onBusyChange(true)
  }, [pageKey, language, direction, pages, onBusyChange, onSettled])

  useEffect(() => {
    if (!flip) return
    let frame = 0
    let start: number | undefined
    const draw = (now: number) => {
      if (active.current !== flip.id) return
      start ??= now
      const progress = Math.min(1, (now - start) / TURN_DURATION)
      const shape = pageGeometry(progress, flip.width, flip.direction)
      if (sheet.current) sheet.current.style.transform = `translateZ(3px) rotateY(${shape.rotation}rad)`
      shape.slices.forEach((slice, index) => {
        const node = slices.current[index]
        if (!node) return
        node.style.transform = `translate3d(${slice.x}px,0,${slice.z}px) rotateY(${slice.angle}rad)`
        node.style.setProperty('--turn-shade', String(slice.shade))
      })
      if (shadow.current) {
        shadow.current.style.opacity = String(shape.shadow * 0.24)
        shadow.current.style.transform = `translateX(${shape.sweep}px) scaleX(${0.55 + shape.shadow * 0.45})`
      }
      if (progress === 1) finish(flip.id)
      else frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    const end = () => finish(flip.id)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timeout = window.setTimeout(end, TURN_DURATION + 600)
    window.addEventListener('resize', end)
    reduced.addEventListener('change', end)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      window.removeEventListener('resize', end)
      reduced.removeEventListener('change', end)
    }
  }, [flip, finish])

  const forward = flip?.direction === 1
  const face = (page: ReactNode, index: number, back: boolean) => <div className={'turn-face ' + (back ? 'turn-face-back' : 'turn-face-front')} lang={back ? flip?.to.language : flip?.from.language}>
    <div className="turn-face-content" style={{ width: flip!.width, left: -index * flip!.width / TURN_SLICES }}>{page}</div>
  </div>
  return <div ref={stage} className="book-turn-stage" data-turning={flip ? (forward ? 'forward' : 'backward') : undefined} style={flip ? { minHeight: flip.height } : undefined}>
    <div className="book-spread" lang={language} inert={!!flip} style={flip ? { visibility: 'hidden' } : undefined}>{pages}</div>
    {flip && <div className="book-turn-layer" aria-hidden="true" inert>
      <div className="turn-still turn-still-left" lang={forward ? flip.from.language : flip.to.language}>{forward ? flip.from.pages[0] : flip.to.pages[0]}</div>
      <div className="turn-still turn-still-right" lang={forward ? flip.to.language : flip.from.language}>{forward ? flip.to.pages[1] : flip.from.pages[1]}</div>
      <div ref={shadow} className="turn-ground-shadow" />
      <div ref={sheet} className={'turn-sheet ' + (forward ? 'turn-forward' : 'turn-backward')} style={{ transform: 'translateZ(3px)' }}>
        {Array.from({ length: TURN_SLICES }, (_, index) => {
          const frontIndex = forward ? index : TURN_SLICES - index - 1
          return <div key={index} ref={node => { slices.current[index] = node }} className="turn-slice" style={{ width: flip.width / TURN_SLICES, transformOrigin: forward ? 'left center' : 'right center', transform: `translate3d(${frontIndex * flip.width / TURN_SLICES}px,0,0)` }}>
            {face(forward ? flip.from.pages[1] : flip.from.pages[0], frontIndex, false)}
            {face(forward ? flip.to.pages[0] : flip.to.pages[1], TURN_SLICES - frontIndex - 1, true)}
          </div>
        })}
      </div>
    </div>}
  </div>
}
