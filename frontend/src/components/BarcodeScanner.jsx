import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

/**
 * BarcodeScanner — modal component that uses the device camera to scan barcodes.
 *
 * Props:
 *   onScan(rawText: string) — called when a barcode is successfully read
 *   onClose() — called to dismiss the scanner
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
        // 1. Verificar se a API de mediaDevices existe (requer HTTPS ou localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Câmera não suportada no navegador. Está usando HTTPS?')
          return
        }

        // 2. Pedir permissão explicitamente para forçar o aviso do navegador
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        stream.getTracks().forEach(track => track.stop()) // Parar a stream para o ZXing usar

        // 3. Inicializar ZXing
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
        // Prefer back camera
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
        setError('Sem acesso à câmera. Verifique as permissões ou se bloqueou sem querer.')
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
        reader.reset()
        onScan(result.getText())
      }
      // Ignore decode errors — they happen continuously until a code is found
    }).catch(() => {
      setError('Erro ao acessar a câmera.')
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
          <h3 className="text-sm font-bold text-primary m-0">Escanear Codigo de Barras</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary bg-transparent border-0 cursor-pointer rounded transition-colors"
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

        {/* Video feed */}
        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {/* Scan line overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[70%] h-0.5 bg-red/60 animate-pulse" />
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
            Aponte a camera para o codigo de barras da caixa
          </p>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
