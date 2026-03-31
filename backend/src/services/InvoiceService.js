const PDFDocument = require('pdfkit')

// Paleta SAAB
const COLOR = {
  dark:      '#1a1a1a',
  surface:   '#222222',
  red:       '#8b0000',
  redDark:   '#3d0000',
  white:     '#ffffff',
  lightGray: '#cccccc',
  midGray:   '#888888',
  border:    '#333333',
}

const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

/**
 * Gera o PDF da fatura e escreve no stream passado.
 * @param {object} order  — order completo com items e client
 * @param {Stream} stream — writable stream (res)
 */
const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({
    size:    'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  })

  doc.pipe(stream)

  const W  = doc.page.width   // 595
  const H  = doc.page.height  // 842
  const PL = 48               // padding left/right

  /* ── HEADER background ── */
  doc.rect(0, 0, W, 110).fill(COLOR.redDark)
  doc.rect(0, 108, W, 3).fill(COLOR.red)

  /* ── Company name ── */
  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLOR.white)
     .text('SAAB', PL, 30)

  doc.font('Helvetica').fontSize(9).fillColor('#f4a0a0')
     .text('GESTÃO LOGÍSTICA', PL, 56)

  /* ── FATURA label ── */
  doc.font('Helvetica-Bold').fontSize(28).fillColor(COLOR.white)
     .text('FATURA', 0, 36, { align: 'right', width: W - PL })

  doc.font('Helvetica').fontSize(9).fillColor('#f4a0a0')
     .text(`Nº ${String(order.id).padStart(6, '0')}`, 0, 68, { align: 'right', width: W - PL })

  /* ── BODY background ── */
  doc.rect(0, 111, W, H - 111).fill('#f7f7f7')

  /* ── Info block ── */
  const infoY = 136
  const col2  = W / 2 + 10

  // Box esquerdo — Cliente
  doc.rect(PL, infoY, W / 2 - PL - 10, 90)
     .fillAndStroke('#ffffff', COLOR.border)

  doc.font('Helvetica-Bold').fontSize(7).fillColor(COLOR.midGray)
     .text('CLIENTE', PL + 12, infoY + 12)

  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR.dark)
     .text(order.client?.email ?? '—', PL + 12, infoY + 26, { width: W / 2 - PL - 30 })

  // Box direito — Info pedido
  doc.rect(col2, infoY, W - col2 - PL, 90)
     .fillAndStroke('#ffffff', COLOR.border)

  const totalWeight = order.weightKg
    ?? order.items?.reduce((s, i) => s + (i.weightKg || 0), 0)
    ?? 0

  const infoRight = [
    ['DATA DE EMISSÃO', fmtDate(order.createdAt)],
    ['TOTAL (CAIXAS)',  `${order.totalBoxes} cxs`],
    ['PESO TOTAL',      `${Number(totalWeight).toFixed(1)} kg`],
  ]

  infoRight.forEach(([label, value], i) => {
    const y = infoY + 12 + i * 26
    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLOR.midGray).text(label, col2 + 12, y)
    doc.font('Helvetica').fontSize(10).fillColor(COLOR.dark).text(value, col2 + 12, y + 10)
  })

  /* ── TABLE ── */
  const tableTop = infoY + 106
  const rowH     = 32

  // 6 columns — compressed to fit Peso (kg)
  const cols = {
    desc:  { x: PL,       w: 170 },
    type:  { x: PL + 175, w: 70  },
    qty:   { x: PL + 250, w: 50  },
    peso:  { x: PL + 305, w: 55  },
    price: { x: PL + 365, w: 70  },
    total: { x: PL + 440, w: W - PL * 2 - 440 },
  }

  // Header row
  doc.rect(PL, tableTop, W - PL * 2, rowH).fill(COLOR.red)

  const headers = [
    ['PRODUTO',    cols.desc],
    ['TIPO',       cols.type],
    ['QTD (CXS)', cols.qty],
    ['PESO (KG)', cols.peso],
    ['PREÇO/CX',  cols.price],
    ['SUBTOTAL',   cols.total],
  ]

  headers.forEach(([label, col]) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR.white)
       .text(label, col.x + 6, tableTop + 11, { width: col.w - 8 })
  })

  // Data rows
  let y = tableTop + rowH
  const items = order.items ?? []

  items.forEach((item, i) => {
    const bg       = i % 2 === 0 ? '#ffffff' : '#f0f0f0'
    const subtotal = item.quantity * (item.product?.pricePerBox ?? 0)

    doc.rect(PL, y, W - PL * 2, rowH).fill(bg)

    const cells = [
      [item.product?.name ?? '—',                      cols.desc],
      [item.product?.type ?? '—',                      cols.type],
      [String(item.quantity),                           cols.qty],
      [`${Number(item.weightKg || 0).toFixed(1)} kg`,  cols.peso],
      [fmt(item.product?.pricePerBox ?? 0),             cols.price],
      [fmt(subtotal),                                   cols.total],
    ]

    cells.forEach(([text, col]) => {
      doc.font('Helvetica').fontSize(9).fillColor(COLOR.dark)
         .text(text, col.x + 6, y + 11, { width: col.w - 8 })
    })

    doc.moveTo(PL, y + rowH).lineTo(W - PL, y + rowH)
       .strokeColor('#dddddd').lineWidth(0.5).stroke()

    y += rowH
  })

  // Outer table border
  doc.rect(PL, tableTop, W - PL * 2, rowH + items.length * rowH)
     .strokeColor(COLOR.border).lineWidth(0.8).stroke()

  /* ── TOTALS ── */
  const totalBoxY  = y + 16
  const totalW     = 220
  const totalX     = W - PL - totalW
  const grandTotal = items.reduce(
    (acc, item) => acc + item.quantity * (item.product?.pricePerBox ?? 0), 0
  )

  doc.rect(totalX, totalBoxY, totalW, 44).fillAndStroke(COLOR.red, COLOR.red)

  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.white)
     .text('VALOR TOTAL', totalX + 12, totalBoxY + 8)

  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLOR.white)
     .text(fmt(grandTotal), totalX + 12, totalBoxY + 22, { width: totalW - 20, align: 'right' })

  /* ── FOOTER ── */
  const footerY = H - 52
  doc.rect(0, footerY, W, 52).fill(COLOR.dark)

  doc.moveTo(0, footerY).lineTo(W, footerY)
     .strokeColor(COLOR.red).lineWidth(2).stroke()

  doc.font('Helvetica').fontSize(8).fillColor(COLOR.midGray)
     .text(
       'SAAB Logistics  ·  Orlando, FL  ·  Auto-generated document — no signature required.',
       PL, footerY + 14,
       { width: W - PL * 2, align: 'center' }
     )

  doc.end()
}

module.exports = { generateInvoice }
