import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

/**
 * BarcodeScanner — modal compacto que usa a câmera do dispositivo para ler barcodes.
 *
 * Layout:
 *  - Modal centralizado (max-w-[420px])
 *  - Frame de vídeo em aspect-square (1:1) — não força rotação do telemóvel
 *  - Moldura visual grossa branca com cantos vermelhos para guiar o posicionamento
 *  - Linha de scan grossa e com alto contraste
 *
 * Props:
 *   onScan(rawText: string) — chamado quando um código é lido
 *   onClose() — fechar o scanner
 */
const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Câmera não suportada no navegador. Está a usar HTTPS?')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        stream.getTracks().forEach(track => track.stop())

        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)

        const reader = new BrowserMultiFormatReader(hints)
        readerRef.current = reader

        const devices = await reader.listVideoInputDevices()
        if (!devices || devices.length === 0) {
          setError('Nenhuma câmera encontrada.')
          return
        }

        setCameras(devices)
        const back = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('traseira') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        )
        const deviceId = back?.deviceId || devices[0]?.deviceId || ''
        setSelectedCamera(deviceId)
        startScanning(reader, deviceId)

      } catch (err) {
        console.error('Camera permissions:', err)
        setError('Sem acesso à câmera. Verifique as permissões.')
      }
    }

    initCamera()

    return () => {
      if (readerRef.current) {
        readerRef.current.reset()
      }
    }
  }, [])

  const startScanning = (reader, deviceId) => {
    if (!videoRef.current || !deviceId) return

    reader.reset()

    // ZXing usa VGA por padrão; precisamos HD para ler GS1-128 longos.
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)

    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (constraints && constraints.video) {
        if (typeof constraints.video === 'boolean') {
          constraints.video = {}
        }
        constraints.video.width = { ideal: 1920, min: 1280 }
        constraints.video.height = { ideal: 1080, min: 720 }
        constraints.video.advanced = [{ focusMode: 'continuous' }]
      }
      try {
        const stream = await origGetUserMedia(constraints)
        navigator.mediaDevices.getUserMedia = origGetUserMedia
        return stream
      } catch (err) {
        navigator.mediaDevices.getUserMedia = origGetUserMedia
        throw err
      }
    }

    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
      if (result) {
        reader.reset()
        onScan(result.getText())
      }
    }).catch((err) => {
      navigator.mediaDevices.getUserMedia = origGetUserMedia
      console.error(err)
      setError('Erro ao iniciar stream: ' + (err.message || ''))
    })
  }

  const handleCameraChange = (e) => {
    const deviceId = e.target.value
    setSelectedCamera(deviceId)
    if (readerRef.current) {
      startScanning(readerRef.current, deviceId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-surface border border-border rounded-lg w-full max-w-[420px] shadow-xl z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-primary m-0">Escanear Código de Barras</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary bg-transparent border-0 cursor-pointer rounded transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera selector */}
        {cameras.length > 1 && (
          <div className="px-4 py-2 border-b border-border">
            <select
              value={selectedCamera}
              onChange={handleCameraChange}
              className="w-full bg-input border border-border-input rounded px-2 py-1.5 text-xs text-primary outline-none"
            >
              {cameras.map(c => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Camera ${cameras.indexOf(c) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video — frame quadrado (1:1) em mobile, 4:3 em desktop. Câmera continua a capturar 1920x1080. */}
        <div className="relative aspect-square sm:aspect-[4/3] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Overlay: máscara + moldura grossa + cantos vermelhos */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Frame guide — moldura grossa centralizada */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] h-[44%] border-[3px] border-white/95 rounded-md"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
            />

            {/* Cantos vermelhos (alto contraste) */}
            {[
              'top-[28%] left-[11%] border-l-[5px] border-t-[5px] rounded-tl-md',
              'top-[28%] right-[11%] border-r-[5px] border-t-[5px] rounded-tr-md',
              'bottom-[28%] left-[11%] border-l-[5px] border-b-[5px] rounded-bl-md',
              'bottom-[28%] right-[11%] border-r-[5px] border-b-[5px] rounded-br-md',
            ].map((cls, i) => (
              <span
                key={i}
                className={`absolute w-6 h-6 border-red ${cls}`}
                style={{ borderColor: '#eb3138' }}
              />
            ))}

            {/* Linha de scan — grossa, alto contraste */}
            <div className="absolute left-[11%] right-[11%] top-1/2 -translate-y-1/2 h-[3px] bg-red-base shadow-[0_0_8px_rgba(235,49,56,0.9)] animate-pulse" style={{ backgroundColor: '#eb3138' }} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-error-bg text-error text-xs text-center">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-secondary m-0">
            Posicione o código dentro da moldura — não precisa girar o telemóvel.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
