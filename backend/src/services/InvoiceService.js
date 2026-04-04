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
 * @param {object} order  — order completo com items, client e boxWeights
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

  const totalWeight = order.weightLb
    ?? order.items?.reduce((s, i) => s + (i.weightLb || 0), 0)
    ?? 0

  const infoRight = [
    ['DATA DE EMISSÃO', fmtDate(order.createdAt)],
    ['TOTAL (CAIXAS)',  `${order.totalBoxes} cxs`],
    ['PESO TOTAL',      `${Number(totalWeight).toFixed(1)} lbs`],
  ]

  infoRight.forEach(([label, value], i) => {
    const y = infoY + 12 + i * 26
    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLOR.midGray).text(label, col2 + 12, y)
    doc.font('Helvetica').fontSize(10).fillColor(COLOR.dark).text(value, col2 + 12, y + 10)
  })

  /* ── TABLE ── */
  const tableTop = infoY + 106
  const rowH     = 26

  // 6 columns
  const cols = {
    desc:  { x: PL,       w: 160 },
    type:  { x: PL + 165, w: 60  },
    qty:   { x: PL + 230, w: 55  },
    peso:  { x: PL + 290, w: 65  },
    price: { x: PL + 360, w: 75  },
    total: { x: PL + 440, w: W - PL * 2 - 440 },
  }

  // Header row
  doc.rect(PL, tableTop, W - PL * 2, rowH).fill(COLOR.red)

  const headers = [
    ['PRODUTO',     cols.desc],
    ['TIPO',        cols.type],
    ['QTD / CX Nº', cols.qty],
    ['PESO (LBS)',  cols.peso],
    ['PREÇO UNIT.', cols.price],
    ['SUBTOTAL',    cols.total],
  ]

  headers.forEach(([label, col]) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(COLOR.white)
       .text(label, col.x + 4, tableTop + 8, { width: col.w - 6 })
  })

  // Build data rows
  let y = tableTop + rowH
  const items = order.items ?? []
  let grandTotal = 0
  let rowIndex = 0

  for (const item of items) {
    if (item.priceType === 'PER_LB') {
      // One row per box
      const boxes = item.boxWeights ?? []
      if (boxes.length > 0) {
        for (const bw of boxes) {
          const subtotal = bw.weightLb * (item.pricePerLb || 0)
          grandTotal += subtotal
          const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f0f0f0'
          doc.rect(PL, y, W - PL * 2, rowH).fill(bg)

          const cells = [
            [item.product?.name ?? '—',                      cols.desc],
            [item.product?.type ?? '—',                      cols.type],
            [`Cx ${bw.boxNumber}`,                           cols.qty],
            [`${Number(bw.weightLb).toFixed(1)} lbs`,        cols.peso],
            [`${fmt(item.pricePerLb || 0)}/lb`,              cols.price],
            [fmt(subtotal),                                  cols.total],
          ]

          cells.forEach(([text, col]) => {
            doc.font('Helvetica').fontSize(8).fillColor(COLOR.dark)
               .text(text, col.x + 4, y + 8, { width: col.w - 6 })
          })

          doc.moveTo(PL, y + rowH).lineTo(W - PL, y + rowH)
             .strokeColor('#dddddd').lineWidth(0.5).stroke()

          y += rowH
          rowIndex++
        }
      } else {
        // Fallback: no boxWeights yet
        const subtotal = (item.weightLb || 0) * (item.pricePerLb || 0)
        grandTotal += subtotal
        const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f0f0f0'
        doc.rect(PL, y, W - PL * 2, rowH).fill(bg)

        const cells = [
          [item.product?.name ?? '—',                        cols.desc],
          [item.product?.type ?? '—',                        cols.type],
          [`${item.quantity} cxs`,                           cols.qty],
          [item.weightLb > 0 ? `${Number(item.weightLb).toFixed(1)} lbs` : '—', cols.peso],
          [`${fmt(item.pricePerLb || 0)}/lb`,                cols.price],
          [fmt(subtotal),                                    cols.total],
        ]

        cells.forEach(([text, col]) => {
          doc.font('Helvetica').fontSize(8).fillColor(COLOR.dark)
             .text(text, col.x + 4, y + 8, { width: col.w - 6 })
        })

        doc.moveTo(PL, y + rowH).lineTo(W - PL, y + rowH)
           .strokeColor('#dddddd').lineWidth(0.5).stroke()

        y += rowH
        rowIndex++
      }
    } else {
      // PER_BOX — one row per item
      const subtotal = item.quantity * (item.pricePerBox || 0)
      grandTotal += subtotal
      const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f0f0f0'
      doc.rect(PL, y, W - PL * 2, rowH).fill(bg)

      const cells = [
        [item.product?.name ?? '—',                        cols.desc],
        [item.product?.type ?? '—',                        cols.type],
        [`${item.quantity} cxs`,                           cols.qty],
        ['—',                                              cols.peso],
        [`${fmt(item.pricePerBox || 0)}/cx`,               cols.price],
        [fmt(subtotal),                                    cols.total],
      ]

      cells.forEach(([text, col]) => {
        doc.font('Helvetica').fontSize(8).fillColor(COLOR.dark)
           .text(text, col.x + 4, y + 8, { width: col.w - 6 })
      })

      doc.moveTo(PL, y + rowH).lineTo(W - PL, y + rowH)
         .strokeColor('#dddddd').lineWidth(0.5).stroke()

      y += rowH
      rowIndex++
    }
  }

  // Outer table border
  doc.rect(PL, tableTop, W - PL * 2, y - tableTop)
     .strokeColor(COLOR.border).lineWidth(0.8).stroke()

  /* ── TOTALS ── */
  const totalBoxY  = y + 16
  const totalW     = 220
  const totalX     = W - PL - totalW

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
     .text('SAAB Logistics  ·  Orlando, FL', PL, footerY + 14, { width: W - PL * 2, align: 'center' })

  doc.end()
}

module.exports = { generateInvoice }
