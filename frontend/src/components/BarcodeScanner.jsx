import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const trackRef = useRef(null)

  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')

  // Capability-driven UI
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [zoomCaps, setZoomCaps] = useState(null) // { min, max, step }
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    let cancelled = false

    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Câmera não suportada no navegador. Use HTTPS.')
          return
        }

        // Force permission prompt
        const tmp = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        tmp.getTracks().forEach(t => t.stop())

        // Barcode format hints — cover all common formats used in meat/food industry
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,    // GS1-128 (principal — carnes com peso)
          BarcodeFormat.EAN_13,      // EAN-13 (produtos simples)
          BarcodeFormat.EAN_8,       // EAN-8 (pequenos)
          BarcodeFormat.UPC_A,       // UPC-A (produtos americanos)
          BarcodeFormat.UPC_E,       // UPC-E (compacto)
          BarcodeFormat.ITF,         // Interleaved 2-of-5 (caixas grandes)
          BarcodeFormat.CODE_39,     // Code 39 (alguns fornecedores de carne)
          BarcodeFormat.CODABAR,     // Codabar (legado)
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)
        hints.set(DecodeHintType.ALSO_INVERTED, true)

        const reader = new BrowserMultiFormatReader(hints)
        readerRef.current = reader

        const devices = await reader.listVideoInputDevices()
        if (cancelled) return

        if (!devices || devices.length === 0) {
          setError('Nenhuma câmera encontrada.')
          return
        }

        setCameras(devices)

        const back = devices.find(d =>
          /back|traseira|rear|environment/i.test(d.label || ''),
        )
        const deviceId = back?.deviceId || devices[0].deviceId
        setSelectedCamera(deviceId)
        startScanning(deviceId)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Erro ao acessar câmera. Verifique permissões.')
      }
    }

    initCamera()

    return () => {
      cancelled = true
      const track = trackRef.current
      if (track && track.readyState === 'live') {
        // Best-effort: turn off torch before tear-down (avoids leaving phone light on)
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {})
      }
      trackRef.current = null
      readerRef.current?.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanning = (deviceId) => {
    if (!videoRef.current || !deviceId || !readerRef.current) return

    readerRef.current.reset()
    trackRef.current = null
    setTorchSupported(false)
    setTorchOn(false)
    setZoomCaps(null)
    setZoomLevel(1)

    // HD constraints + continuous autofocus when supported.
    // Browsers that don't support these fields silently ignore them.
    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        advanced: [{ focusMode: 'continuous' }],
      },
    }

    readerRef.current
      .decodeFromConstraints(constraints, videoRef.current, (result) => {
        if (result) {
          const text = result.getText()
          // Haptic feedback (no-op on desktop / unsupported browsers)
          try { navigator.vibrate?.(80) } catch {}
          // Stop continuous decoding so we don't fire onScan repeatedly
          setTimeout(() => readerRef.current?.reset(), 300)
          onScan(text)
        }
      })
      .then(() => {
        // After the stream is attached, inspect the live track for capabilities
        const stream = videoRef.current?.srcObject
        const track = stream?.getVideoTracks?.()[0]
        if (!track) return
        trackRef.current = track

        const caps = track.getCapabilities ? track.getCapabilities() : {}
        if (caps.torch) setTorchSupported(true)
        if (caps.zoom && typeof caps.zoom === 'object') {
          const min = caps.zoom.min ?? 1
          const max = caps.zoom.max ?? 1
          const step = caps.zoom.step ?? 0.1
          if (max > min) {
            setZoomCaps({ min, max, step })
            const settings = track.getSettings?.() || {}
            setZoomLevel(settings.zoom ?? min)
          }
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Erro ao iniciar câmera: ' + (err.message || ''))
      })
  }

  const handleCameraChange = (e) => {
    const deviceId = e.target.value
    setSelectedCamera(deviceId)
    startScanning(deviceId)
  }

  const toggleTorch = async () => {
    const track = trackRef.current
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch (err) {
      console.error('torch toggle failed', err)
      setTorchSupported(false)
    }
  }

  const handleZoomChange = async (e) => {
    const value = Number(e.target.value)
    setZoomLevel(value)
    const track = trackRef.current
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: value }] })
    } catch (err) {
      console.error('zoom failed', err)
    }
  }

  // Tap-to-focus: ask the camera to focus where the user clicked.
  // pointsOfInterest is normalized [0..1] coordinates. Browsers without it ignore.
  const handleVideoTap = async (e) => {
    const track = trackRef.current
    if (!track) return
    const caps = track.getCapabilities?.() || {}
    if (!caps.pointsOfInterest && !Array.isArray(caps.focusMode)) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const advanced = []
    if (caps.focusMode?.includes?.('single-shot')) advanced.push({ focusMode: 'single-shot' })
    if (caps.pointsOfInterest) advanced.push({ pointsOfInterest: [{ x, y }] })
    if (advanced.length === 0) return

    try {
      await track.applyConstraints({ advanced })
    } catch {
      // Ignore — focus is best-effort
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-surface border border-border rounded-md w-full max-w-md shadow-xl z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-primary m-0">
            Escanear Código de Barras
          </h3>

          <div className="flex items-center gap-1">
            {torchSupported && (
              <button
                onClick={toggleTorch}
                title={torchOn ? 'Desligar lanterna' : 'Ligar lanterna'}
                aria-label={torchOn ? 'Desligar lanterna' : 'Ligar lanterna'}
                className={`p-1.5 rounded transition-colors ${
                  torchOn
                    ? 'text-yellow-300 bg-yellow-300/10'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-1.5 text-secondary hover:text-primary"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Camera selector */}
        {cameras.length > 1 && (
          <div className="px-4 py-2 border-b border-border">
            <select
              value={selectedCamera}
              onChange={handleCameraChange}
              className="w-full bg-input border rounded px-2 py-1.5 text-xs"
            >
              {cameras.map(c => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Camera ${cameras.indexOf(c) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video */}
        <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onClick={handleVideoTap}
            className="w-full h-full object-cover cursor-crosshair"
          />

          {/* Scanning line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[2px] bg-red-500 animate-pulse" />
          </div>

          {/* Zoom slider — só aparece se a câmara suportar */}
          {zoomCaps && (
            <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 bg-black/55 backdrop-blur rounded px-3 py-1.5">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider shrink-0">Zoom</span>
              <input
                type="range"
                min={zoomCaps.min}
                max={zoomCaps.max}
                step={zoomCaps.step}
                value={zoomLevel}
                onChange={handleZoomChange}
                className="flex-1 accent-red-500"
              />
              <span className="text-[10px] font-mono text-white/80 w-10 text-right">
                {Number(zoomLevel).toFixed(1)}x
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-100 text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-secondary m-0">
            Aponte a câmera para o código de barras da caixa
          </p>
        </div>

      </div>
    </div>
  )
}

export default BarcodeScanner
