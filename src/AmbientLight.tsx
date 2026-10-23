import { useEffect, useRef } from 'react'

/** A small foreground light field; no images, shaders or animation library. */
export function AmbientLight({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !active) return
    let width = 0, height = 0, frame = 0, last = 0
    let pointer = { x: -1000, y: -1000, dx: 0, dy: 0 }
    const particles = Array.from({ length: 42 }, (_, i) => ({
      x: (i * .61803398875) % 1, y: .25 + ((i * .381966) % .7),
      phase: i * 1.7, radius: .6 + (i % 4) * .25,
    }))
    const resize = () => {
      width = innerWidth; height = innerHeight
      const ratio = Math.min(devicePixelRatio || 1, 1.25)
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer = { x: event.clientX, y: event.clientY,
        dx: Math.max(-18, Math.min(18, event.movementX)), dy: Math.max(-18, Math.min(18, event.movementY)) }
    }
    const leave = () => { pointer.x = -1000; pointer.y = -1000 }
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw)
      if (time - last < 32) return
      const dt = Math.min((time - last) / 1000, .05)
      last = time
      context.clearRect(0, 0, width, height)
      context.fillStyle = '#e6e7cc'
      for (const p of particles) {
        const x = p.x * width, y = p.y * height
        const dx = x - pointer.x, dy = y - pointer.y
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 270)
        p.x = (p.x + (Math.sin(time * .00016 + p.phase) * 2 + pointer.dx * influence * .5) * dt / width + 1) % 1
        p.y = (p.y + (Math.cos(time * .00012 + p.phase) * 1.4 + pointer.dy * influence * .5) * dt / height + 1) % 1
        context.globalAlpha = .045 + (Math.sin(time * .001 + p.phase) + 1) * .045 + influence * .3
        context.beginPath()
        context.arc(p.x * width, p.y * height, p.radius + influence * .8, 0, Math.PI * 2)
        context.fill()
      }
      // A broad, very faint light follows the cursor rather than obscuring it.
      if (pointer.x >= 0) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220)
        glow.addColorStop(0, '#c5dbcb0c'); glow.addColorStop(1, '#c5dbcb00')
        context.globalAlpha = 1; context.fillStyle = glow; context.fillRect(0, 0, width, height)
      }
      pointer.dx *= .86; pointer.dy *= .86
    }
    resize()
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      context.clearRect(0, 0, width, height)
    }
  }, [active])
  return <canvas ref={canvasRef} className="scenery-lights" aria-hidden="true" />
}
