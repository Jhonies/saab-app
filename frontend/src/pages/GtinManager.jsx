import { useState, useEffect } from 'react'
import { fetchGtinMappings, createGtinMapping, fetchProducts } from '../services/inventoryService'
import BarcodeScanner from '../components/BarcodeScanner'
import { parseGS1Barcode } from '../utils/gs1Parser'

const GtinManager = () => {
  const [mappings, setMappings] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Scanner
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedGtin, setScannedGtin] = useState('')
  const [scannedInfo, setScannedInfo] = useState(null)

  // Manual / form
  const [manualGtin, setManualGtin] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  const load = () => {
    setLoading(true)
    Promise.all([fetchGtinMappings(), fetchProducts()])
      .then(([m, p]) => { setMappings(m); setProducts(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleScan = (rawText) => {
    setScannerOpen(false)
    const parsed = parseGS1Barcode(rawText)
    if (parsed.gtin) {
      setScannedGtin(parsed.gtin)
      setManualGtin(parsed.gtin)
      setScannedInfo(parsed)
      setMsg({ text: '', type: '' })

      // Check if already mapped
      const existing = mappings.find(m => m.gtin === parsed.gtin)
      if (existing) {
        setMsg({ text: `GTIN ja mapeado para: ${existing.product?.name}`, type: 'warn' })
      }
    } else {
      setMsg({ text: 'Codigo lido mas GTIN nao detectado. Tente novamente.', type: 'error' })
    }
  }

  const handleSave = async () => {
    const gtin = manualGtin.trim()
    if (!gtin || !selectedProduct) {
      setMsg({ text: 'Preencha o GTIN e selecione um produto.', type: 'error' })
      return
    }

    setSaving(true)
    setMsg({ text: '', type: '' })
    try {
      await createGtinMapping(gtin, Number(selectedProduct))
      setManualGtin('')
      setScannedGtin('')
      setScannedInfo(null)
      setSelectedProduct('')
      setProductSearch('')
      setMsg({ text: 'GTIN registrado com sucesso!', type: 'ok' })
      load()
    } catch (err) {
      const message = err?.response?.data?.message || 'Erro ao registrar GTIN.'
      setMsg({ text: message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = productSearch.length >= 2
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products

  return (
    <div className="flex flex-col gap-5 p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-primary m-0">Cadastro de GTIN</h1>
        <p className="text-xs text-secondary m-0 mt-1">
          Escaneie o codigo de barras de um produto para mapear o GTIN automaticamente.
        </p>
      </div>

      {/* Scan + Register Card */}
      <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4">

        {/* Step 1: Scan */}
        <div className="flex flex-col gap-2">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-muted m-0">1. Escanear ou digitar GTIN</p>
          <div className="flex gap-3 items-stretch">
            <input
              type="text"
              value={manualGtin}
              onChange={e => { setManualGtin(e.target.value); setScannedGtin('') }}
              placeholder="GTIN (ex: 07432001606913)"
              className="flex-1 bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors font-mono"
            />
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2 bg-red text-white text-sm font-bold px-4 py-2.5 rounded cursor-pointer border-0 transition-colors duration-150 hover:bg-red-hover shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="hidden sm:inline">Escanear</span>
            </button>
          </div>

          {/* Scan info */}
          {scannedInfo && scannedGtin && (
            <div className="flex flex-wrap gap-3 text-xs text-secondary mt-1">
              {scannedInfo.weightLb != null && <span>Peso: {scannedInfo.weightLb} lbs</span>}
              {scannedInfo.weightKg != null && <span>Peso: {scannedInfo.weightKg} kg</span>}
              {scannedInfo.expiryDate && <span>Validade: {scannedInfo.expiryDate}</span>}
              {scannedInfo.batch && <span>Lote: {scannedInfo.batch}</span>}
            </div>
          )}
        </div>

        {/* Step 2: Select product */}
        <div className="flex flex-col gap-2">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-muted m-0">2. Selecionar produto</p>
          <input
            type="text"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-input border border-border-input rounded px-3 py-2.5 text-sm text-primary outline-none focus:border-red transition-colors"
          />
          <div className="max-h-[200px] overflow-y-auto border border-border-input rounded bg-input">
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-secondary text-center py-4 m-0">Nenhum produto encontrado</p>
            ) : (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(String(p.id)); setProductSearch(p.name) }}
                  className={`w-full text-left px-3 py-2 text-sm border-0 border-b border-border last:border-b-0 cursor-pointer transition-colors duration-100
                    ${String(p.id) === selectedProduct
                      ? 'bg-red/10 text-red font-semibold'
                      : 'bg-transparent text-primary hover:bg-hover'
                    }`}
                >
                  <span>{p.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message */}
        {msg.text && (
          <p className={`text-xs font-semibold m-0 ${
            msg.type === 'ok' ? 'text-ok' : msg.type === 'warn' ? 'text-warn' : 'text-error'
          }`}>
            {msg.text}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !manualGtin.trim() || !selectedProduct}
          className="bg-red text-white text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded cursor-pointer border-0 transition-colors duration-150 hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto sm:self-end"
        >
          {saving ? 'Salvando...' : 'Registrar GTIN'}
        </button>
      </div>

      {/* Existing mappings */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted m-0">
          GTINs Cadastrados ({mappings.length})
        </h2>

        {loading ? (
          <p className="text-sm text-secondary py-4 text-center m-0">A carregar...</p>
        ) : mappings.length === 0 ? (
          <div className="bg-surface border border-border rounded-md p-6 text-center">
            <p className="text-sm text-secondary m-0">Nenhum GTIN cadastrado ainda.</p>
            <p className="text-xs text-muted m-0 mt-1">Escaneie um produto para comecar.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden shadow-card">
            <div className="hidden sm:grid grid-cols-[1fr_1fr] gap-2 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted border-b border-border">
              <span>GTIN</span>
              <span>Produto</span>
            </div>
            {mappings.map(m => (
              <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-1 sm:gap-2 px-5 py-3 border-b border-border last:border-b-0 hover:bg-hover transition-colors">
                <span className="text-xs font-mono text-secondary">{m.gtin}</span>
                <span className="text-sm font-medium text-primary">{m.product?.name || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanner modal */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

export default GtinManager
