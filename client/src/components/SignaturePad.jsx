import { useRef, useState, useEffect } from 'react'
import { Trash2, Check } from 'lucide-react'

export default function SignaturePad({ onSave, existing, saving }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing]   = useState(false)
  const [hasSig, setHasSig]     = useState(false)
  const lastPos = useRef(null)

  // Load existing signature into canvas
  useEffect(() => {
    if (!existing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setHasSig(true)
    }
    img.src = existing
  }, [existing])

  const getXY = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    const pos = getXY(e)
    lastPos.current = pos
    setDrawing(true)
    setHasSig(true)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getXY(e)
    ctx.beginPath()
    ctx.strokeStyle = '#111827'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = (e) => {
    e?.preventDefault()
    setDrawing(false)
    lastPos.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  const save = () => {
    const canvas = canvasRef.current
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white relative"
        style={{ touchAction: 'none' }}
      >
        {/* Signature line guide */}
        <div style={{
          position: 'absolute', bottom: 28, left: 20, right: 20,
          borderBottom: '1px solid #e5e7eb', pointerEvents: 'none', zIndex: 0
        }} />
        {!hasSig && (
          <p style={{
            position: 'absolute', bottom: 8, left: 0, right: 0,
            textAlign: 'center', fontSize: 11, color: '#d1d5db',
            pointerEvents: 'none', zIndex: 0
          }}>
            Draw your signature here
          </p>
        )}
        <canvas
          ref={canvasRef}
          width={500}
          height={130}
          className="w-full cursor-crosshair relative"
          style={{ zIndex: 1, display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!hasSig || saving}
          className="btn-primary text-xs py-1.5 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Save Signature'}
        </button>
        <button type="button" onClick={clear} className="btn-secondary text-xs py-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  )
}
