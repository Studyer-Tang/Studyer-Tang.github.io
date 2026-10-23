import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { IslandActivity } from './IslandActivity'
import type { Language } from './navigation'

type ViewController = { turn: (yaw: number, pitch: number) => void; zoom: (factor: number) => void; reset: () => void }

export function Seascape({ language, onClose }: { language: Language; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useRef<ViewController | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const zh = language === 'zh'
  useEffect(() => {
    const canvas = canvasRef.current!
    let renderer: THREE.WebGLRenderer
    let disposed = false, failed = false, pendingFrame = 0
    let texture: THREE.Texture | undefined
    let pointer: { id: number; x: number; y: number } | null = null
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(68, 1, .1, 10)
    camera.rotation.order = 'YXZ'
    const sphere = new THREE.SphereGeometry(5, 64, 32)
    sphere.scale(-1, 1, 1)
    const paintMaterial = new THREE.MeshBasicMaterial()
    scene.add(new THREE.Mesh(sphere, paintMaterial))
    const initialYaw = 1.13, initialPitch = -.03
    let yaw = initialYaw, pitch = initialPitch, fov = 68
    const fail = () => {
      if (disposed || failed) return
      failed = true
      cancelAnimationFrame(pendingFrame)
      pendingFrame = 0
      setStatus('error')
    }
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' }) }
    catch { sphere.dispose(); paintMaterial.dispose(); fail(); return }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    const paint = () => {
      pendingFrame = 0
      if (disposed || failed || !texture || !canvas.clientWidth || !canvas.clientHeight) return
      camera.rotation.set(pitch, yaw, 0)
      camera.fov = fov
      camera.updateProjectionMatrix()
      try { renderer.render(scene, camera) } catch { fail() }
    }
    const requestPaint = () => { if (!pendingFrame && !disposed && !failed) pendingFrame = requestAnimationFrame(paint) }
    const resize = () => {
      if (disposed || failed || !canvas.clientWidth || !canvas.clientHeight) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      requestPaint()
    }
    const turn = (dx: number, dy: number) => { yaw += dx; pitch = THREE.MathUtils.clamp(pitch + dy, -1.12, 1.12); requestPaint() }
    const zoom = (factor: number) => { fov = THREE.MathUtils.clamp(fov * factor, 35, 85); requestPaint() }
    controls.current = { turn, zoom, reset() { yaw = initialYaw; pitch = initialPitch; fov = 68; requestPaint() } }
    const down = (event: PointerEvent) => {
      if (disposed || failed || pointer || event.button !== 0) return
      canvas.focus({ preventScroll: true })
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return
      turn((event.clientX - pointer.x) * .003, (event.clientY - pointer.y) * .003)
      pointer.x = event.clientX; pointer.y = event.clientY
    }
    const up = (event?: PointerEvent) => {
      if (event && pointer?.id !== event.pointerId) return
      const id = pointer?.id
      pointer = null
      if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id)
    }
    const wheel = (event: WheelEvent) => {
      if (document.activeElement !== canvas || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      event.preventDefault()
      zoom(Math.exp(THREE.MathUtils.clamp(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1), -250, 250) * .0015))
    }
    const key = (event: KeyboardEvent) => {
      if (document.activeElement !== canvas || event.ctrlKey || event.metaKey || event.altKey) return
      const turns: Record<string, [number, number]> = { ArrowLeft: [.12, 0], ArrowRight: [-.12, 0], ArrowUp: [0, .08], ArrowDown: [0, -.08] }
      if (turns[event.key]) { event.preventDefault(); turn(...turns[event.key]) }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.9) }
      if (event.key === '-') { event.preventDefault(); zoom(1.1) }
    }
    const lostContext = (event: Event) => { event.preventDefault(); up(); fail() }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('lostpointercapture', up)
    canvas.addEventListener('wheel', wheel, { passive: false })
    canvas.addEventListener('keydown', key)
    canvas.addEventListener('webglcontextlost', lostContext)
    const blur = () => up()
    window.addEventListener('blur', blur)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const path = window.matchMedia('(max-width: 760px)').matches || renderer.capabilities.maxTextureSize < 8192 ? '/world-assets/coast-panorama.webp' : '/world-assets/coast-panorama-8k.webp'
    new THREE.TextureLoader().load(path, loaded => {
      if (disposed || failed) { loaded.dispose(); return }
      texture = loaded
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = false
      texture.minFilter = THREE.LinearFilter
      paintMaterial.map = texture
      paintMaterial.needsUpdate = true
      setStatus('ready')
      resize()
    }, undefined, fail)
    resize()
    return () => {
      disposed = true
      cancelAnimationFrame(pendingFrame)
      controls.current = null
      up()
      observer.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('lostpointercapture', up)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('keydown', key)
      canvas.removeEventListener('webglcontextlost', lostContext)
      window.removeEventListener('blur', blur)
      texture?.dispose()
      sphere.dispose()
      paintMaterial.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [attempt])
  return <IslandActivity language={language} title={zh ? '码头 · 向海而望' : 'The pier · Looking out to sea'} onClose={onClose}>
    <canvas ref={canvasRef} className="seascape-canvas" tabIndex={status === 'ready' ? 0 : -1} aria-label={zh ? '真实海岸全景。拖动查看，方向键转向，滚轮或加减号缩放。' : 'Photographic coastal panorama. Drag or use arrow keys to look around; scroll or use plus and minus to zoom.'} />
    {status === 'loading' && <div className="activity-message seascape-loading" role="status">{zh ? '正在展开真实海岸全景…' : 'Opening the coastal panorama…'}</div>}
    {status === 'error' && <><img className="seascape-fallback" src="/world-assets/coast-panorama.webp" alt={zh ? '南非 Fish Hoek 海滩真实摄影' : 'A real photograph of Fish Hoek Beach, South Africa'} /><div className="seascape-error" role="alert">{zh ? '全景暂时无法显示，可以重试或返回小岛。' : 'The panoramic view is unavailable. You can retry or return to the island.'}<button type="button" onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }}>{zh ? '重新载入' : 'Try again'}</button></div></>}
    <footer className="seascape-bottom"><div className="seascape-controls">
      <button type="button" disabled={status !== 'ready'} aria-label={zh ? '向左看' : 'Look left'} onClick={() => controls.current?.turn(.2, 0)}>←</button><button type="button" disabled={status !== 'ready'} aria-label={zh ? '向右看' : 'Look right'} onClick={() => controls.current?.turn(-.2, 0)}>→</button>
      <button type="button" disabled={status !== 'ready'} aria-label={zh ? '放大海景' : 'Zoom in'} onClick={() => controls.current?.zoom(.85)}>＋</button><button type="button" disabled={status !== 'ready'} aria-label={zh ? '缩小海景' : 'Zoom out'} onClick={() => controls.current?.zoom(1.15)}>−</button><button type="button" disabled={status !== 'ready'} onClick={() => controls.current?.reset()}>{zh ? '望向海面' : 'Face the sea'}</button>
    </div><div className="seascape-credits"><p>{zh ? '真实摄影全景，非实时影像。Fish Hoek Beach，南非。' : 'A photographed panorama, not a live feed. Fish Hoek Beach, South Africa.'} <a href="https://polyhaven.com/a/fish_hoek_beach">Poly Haven · CC0 ↗</a></p><p className="seascape-help">{zh ? '拖动环视 · 滚轮缩放 · 方向键也可操作' : 'Drag to look around · Scroll to zoom · Arrow keys supported'}</p></div></footer>
  </IslandActivity>
}
