import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

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
          setError('Câmera não suportada no navegador. Use HTTPS.')
          return
        }

        // força permissão
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        stream.getTracks().forEach(track => track.stop())

        // 🔥 HINTS MELHORADOS (sem quebrar nada)
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.ITF,        // caixas grandes (muito importante)
          BarcodeFormat.CODABAR     // alguns fornecedores
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)
        hints.set(DecodeHintType.ALSO_INVERTED, true)

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
        console.error(err)
        setError('Erro ao acessar câmera. Verifique permissões.')
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

    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result) {
        // 🔥 pequeno delay evita bug em alguns celulares
        const text = result.getText()

        setTimeout(() => {
          reader.reset()
        }, 300)

        onScan(text)
      }
    }).catch((err) => {
      console.error(err)
      setError('Erro ao iniciar câmera: ' + (err.message || ''))
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

      <div className="relative bg-surface border border-border rounded-md w-full max-w-md shadow-xl z-10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-primary m-0">
            Escanear Código de Barras
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary"
          >
            ✕
          </button>
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

        {/* 🔥 VOLTOU PRO LAYOUT ANTIGO (MAIS ESTÁVEL) */}
        <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* linha simples (menos poluição visual) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[2px] bg-red-500 animate-pulse" />
          </div>
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
