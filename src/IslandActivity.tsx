import { useId, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Language } from './navigation'
import './IslandActivity.css'

export function IslandActivity({ language, title, children, onClose }: { language: Language; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const dialog = ref.current!
    const body = document.body, overflow = body.style.overflow
    const ownsLock = overflow !== 'hidden'
    if (ownsLock) body.style.overflow = 'hidden'
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    return () => { dialog.close(); if (ownsLock) body.style.overflow = overflow }
  }, [])
  return <dialog ref={ref} className="island-activity" aria-modal="true" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="activity-header"><div><p>FIELD NOTES / A CLOSER LOOK</p><h2 id={titleId}>{title}</h2></div><button ref={closeRef} type="button" onClick={onClose}>{language === 'zh' ? '返回小岛' : 'Back to the island'} <span aria-hidden="true">×</span></button></header>
    <div className="activity-body">{children}</div>
  </dialog>
}

export function ActivityLoading({ language, onClose }: { language: Language; onClose: () => void }) {
  return <IslandActivity language={language} title={language === 'zh' ? '准备启程' : 'A closer look'} onClose={onClose}><div className="activity-message" role="status">{language === 'zh' ? '正在载入，请稍候…' : 'Preparing the view…'}</div></IslandActivity>
}
