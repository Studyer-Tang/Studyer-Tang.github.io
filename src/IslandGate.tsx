import { Component, lazy, Suspense, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import type { IslandExplorerProps } from './IslandExplorer'

const Explorer = lazy(() => import('./IslandExplorer').then(module => ({ default: module.IslandExplorer })))

function LoadingIsland({ language, onClose, failed = false }: Pick<IslandExplorerProps, 'language' | 'onClose'> & { failed?: boolean }) {
  const zh = language === 'zh'
  useLayoutEffect(() => {
    const body = document.body, previous = body.style.overflow
    body.style.overflow = 'hidden'
    return () => { body.style.overflow = previous }
  }, [])
  return <div className="island-pending" role="dialog" aria-modal="true" aria-label={zh ? '岛屿漫游' : 'Island exploration'} onKeyDown={event => {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Tab') event.preventDefault()
  }}><span className="eyebrow">THE ISLAND</span><h2>{failed ? (zh ? '小岛暂时无法打开' : 'The island could not load') : (zh ? '准备登岛' : 'Preparing the island')}</h2><p role="status">{failed ? (zh ? '可以返回阅读，或刷新页面后重试。' : 'You can return to reading or refresh to try again.') : (zh ? '正在载入海岛与步行场景…' : 'Loading the island and its walking paths…')}</p><button type="button" ref={node => { node?.focus() }} onClick={onClose}>{zh ? '返回主页' : 'Return to the site'} <span aria-hidden="true">↗</span></button></div>
}

class IslandBoundary extends Component<{ children: ReactNode } & Pick<IslandExplorerProps, 'language' | 'onClose'>, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <LoadingIsland language={this.props.language} onClose={this.props.onClose} failed /> : this.props.children
  }
}

export function IslandGate(props: IslandExplorerProps) {
  return <IslandBoundary language={props.language} onClose={props.onClose}><Suspense fallback={<LoadingIsland language={props.language} onClose={props.onClose} />}><Explorer {...props} /></Suspense></IslandBoundary>
}
