const PDFDocument = require('pdfkit')
const path = require('path')

// ── Assets ──
const LOGO_PATH       = path.join(__dirname, '..', 'assets', 'Logo-do-invoice.png')
const FONT_HELV_BOLD  = path.join(__dirname, '..', 'assets', 'helvetica-world-italic.ttf')
const FONT_IBM_ITALIC = path.join(__dirname, '..', 'assets', 'IBMPlexSans-Italic-VariableFont_wdth,wght.ttf')

// ── Palette ──
const COLOR = {
  red:       '#8b0000',
  black:     '#000000',
  darkGray:  '#333333',
  midGray:   '#666666',
  lightGray: '#999999',
  lineGray:  '#cccccc',
  white:     '#ffffff',
}

// ── Helpers ──
const fmt = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const fmtNum = (n) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  })

/**
 * Gera PDF no modelo oficial SAAB Foods LLC.
 * @param {object} order  — order com items, product e boxWeights
 * @param {Stream} stream — writable (res)
 */
const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({
    size:    'LETTER',
    margins: { top: 40, bottom: 40, left: 48, right: 48 },
  })

  doc.pipe(stream)

  doc.registerFont('HelvBold', FONT_HELV_BOLD)
  doc.registerFont('IBMItalic', FONT_IBM_ITALIC)

  const W  = doc.page.width
  const PL = 48
  const PR = W - 48
  const CW = PR - PL  // content width

  // ── Font aliases ──
  const BOLD = 'HelvBold'    // hierarchy & emphasis
  const BODY = 'IBMItalic'   // secondary & descriptive

  // ── Page-break threshold ──
  // Footer block: NSF(50) + signatures(68) + bottom bar(50) ≈ 168
  const PAGE_BOTTOM = doc.page.height - 180 // leave room for footer block

  // ═══════════════════════════════════════════
  // ── HEADER (repeated on every page) ──
  // ═══════════════════════════════════════════
  const drawHeader = () => {
    // Left: Company info
    doc.font(BOLD).fontSize(11).fillColor(COLOR.black)
       .text('SAAB Foods LLC', PL, 40)

    doc.font(BODY).fontSize(8).fillColor(COLOR.darkGray)
       .text('6843 Conway Rd Ste 120', PL, 55)
       .text('Orlando, FL 32812', PL, 65)
       .text('saab@saabfoods.com', PL, 75)

    // Right: Logo (includes "SAAB FOODS" text)
    try {
      doc.image(LOGO_PATH, PR - 105, 28, { width: 80 })
    } catch (_) { /* logo not found — skip */ }
  }

  // ═══════════════════════════════════════════
  // ── FIRST PAGE: HEADER + INFO + TABLE ──
  // ═══════════════════════════════════════════
  drawHeader()

  // ── INVOICE title ──
  const invoiceY = 115
  doc.font(BOLD).fontSize(22).fillColor(COLOR.red)
     .text('INVOICE', PL, invoiceY)

  // Thin red line under title
  doc.moveTo(PL, invoiceY + 28).lineTo(PR, invoiceY + 28)
     .strokeColor(COLOR.red).lineWidth(0.5).stroke()

  // ── Info block ──
  const infoY = invoiceY + 40
  const col1 = PL
  const col2 = PL + CW * 0.33
  const col3 = PL + CW * 0.66

  // BILL TO
  doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
     .text('BILL TO', col1, infoY)
  doc.font(BODY).fontSize(9).fillColor(COLOR.darkGray)
     .text(order.clientName || '—', col1, infoY + 14, { width: CW * 0.30 })

  // SHIP TO
  doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
     .text('SHIP TO', col2, infoY)
  doc.font(BODY).fontSize(9).fillColor(COLOR.darkGray)
     .text(order.address || '—', col2, infoY + 14, { width: CW * 0.30 })

  // INVOICE # / DATE / DUE DATE / TERMS
  // DUE DATE = createdAt + 7 days
  const dueDate = new Date(order.createdAt)
  dueDate.setDate(dueDate.getDate() + 7)

  const rightLabels = [
    ['INVOICE #', String(order.id).padStart(5, '0')],
    ['DATE',      fmtDate(order.createdAt)],
    ['DUE DATE',  fmtDate(dueDate)],
    ['TERMS',     'Net 7'],
  ]

  rightLabels.forEach(([label, value], i) => {
    const ly = infoY + i * 14
    doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
       .text(label, col3, ly, { width: 80 })
    doc.font(BODY).fontSize(8).fillColor(COLOR.darkGray)
       .text(value, col3 + 82, ly, { width: 100 })
  })

  // ── SALES REP ──
  const repY = infoY + 70
  doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
     .text('SALES REP', col1, repY)
  doc.font(BODY).fontSize(9).fillColor(COLOR.darkGray)
     .text(order.client?.email || '—', col1, repY + 14)

  // Thin gray separator before table
  const sepY = repY + 32
  doc.moveTo(PL, sepY).lineTo(PR, sepY)
     .strokeColor(COLOR.lineGray).lineWidth(0.3).stroke()

  // ═══════════════════════════════════════════
  // ── TABLE ──
  // ═══════════════════════════════════════════
  const tableTop = sepY + 8
  const headerH = 22

  // Column layout
  const cols = {
    qty:    { x: PL,        w: 55  },
    item:   { x: PL + 55,   w: 115 },
    desc:   { x: PL + 170,  w: CW - 170 - 75 - 80 },
    rate:   { x: PR - 155,  w: 75  },
    amount: { x: PR - 80,   w: 80  },
  }

  // ── Draw table header row ──
  const drawTableHeader = (yPos) => {
    doc.rect(PL, yPos, CW, headerH).fill(COLOR.red)

    const headers = [
      ['QTY',         cols.qty],
      ['ITEM',        cols.item],
      ['DESCRIPTION', cols.desc],
      ['RATE',        cols.rate],
      ['AMOUNT',      cols.amount],
    ]

    headers.forEach(([label, col]) => {
      doc.font(BOLD).fontSize(7).fillColor(COLOR.white)
         .text(label, col.x + 4, yPos + 6, { width: col.w - 8 })
    })

    return yPos + headerH
  }

  let y = drawTableHeader(tableTop)
  let tableStartY = tableTop // remember for outer border (resets on new page)

  // ── Data rows ──
  const items = order.items ?? []
  let grandTotal = 0
  let rowIndex = 0

  // Build structured rows: one per item (consolidate boxWeights)
  const rows = []
  for (const item of items) {
    const prodName = item.product?.name ?? '—'
    const prodType = item.product?.type ?? ''

    if (item.priceType === 'PER_LB') {
      const boxes = item.boxWeights ?? []
      if (boxes.length > 0) {
        const totalWeight = boxes.reduce((sum, bw) => sum + Number(bw.weightLb || 0), 0)
        const subtotal = totalWeight * (item.pricePerLb || 0)
        grandTotal += subtotal

        // Build multi-line description
        const weightsStr = boxes.map(bw => Number(bw.weightLb).toFixed(2)).join(' + ')
        const descLines = [
          prodType,
          `${String(boxes.length).padStart(2, '0')} CASES`,
          weightsStr,
        ].filter(Boolean).join('\n')

        rows.push({
          qty:    `${fmtNum(totalWeight)}`,
          item:   prodName,
          desc:   descLines,
          rate:   fmtNum(item.pricePerLb || 0),
          amount: fmtNum(subtotal),
        })
      } else {
        const subtotal = (item.weightLb || 0) * (item.pricePerLb || 0)
        grandTotal += subtotal
        rows.push({
          qty:    `${item.quantity} cxs`,
          item:   prodName,
          desc:   prodType,
          rate:   fmtNum(item.pricePerLb || 0),
          amount: fmtNum(subtotal),
        })
      }
    } else {
      const subtotal = item.quantity * (item.pricePerBox || item.pricePerUnit || 0)
      grandTotal += subtotal
      rows.push({
        qty:    `${item.quantity}`,
        item:   prodName,
        desc:   prodType,
        rate:   fmtNum(item.pricePerBox || item.pricePerUnit || 0),
        amount: fmtNum(subtotal),
      })
    }
  }

  // ── Render rows with dynamic height & pagination ──
  for (const row of rows) {
    // Calculate row height based on description text
    doc.font(BODY).fontSize(8)
    const descHeight = doc.heightOfString(row.desc || '—', { width: cols.desc.w - 8 })
    const rowH = Math.max(22, descHeight + 12) // min 22, pad 6 top + 6 bottom

    // Check page overflow — leave room for at least this row + footer
    if (y + rowH > PAGE_BOTTOM) {
      // Draw outer border for current page's table portion
      doc.rect(PL, tableStartY, CW, y - tableStartY)
         .strokeColor(COLOR.darkGray).lineWidth(0.5).stroke()

      doc.addPage()
      drawHeader()
      const newTableY = 115
      y = drawTableHeader(newTableY)
      tableStartY = newTableY
    }

    // Alternate background
    if (rowIndex % 2 === 1) {
      doc.rect(PL, y, CW, rowH).fill('#f5f5f5')
    }

    const cellY = y + 6

    // QTY
    doc.font(BODY).fontSize(8).fillColor(COLOR.black)
       .text(row.qty, cols.qty.x + 4, cellY, { width: cols.qty.w - 8 })

    // ITEM (product name — bold)
    doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
       .text(row.item, cols.item.x + 4, cellY, { width: cols.item.w - 8 })

    // DESCRIPTION (multi-line — body)
    doc.font(BODY).fontSize(8).fillColor(COLOR.black)
       .text(row.desc || '—', cols.desc.x + 4, cellY, { width: cols.desc.w - 8 })

    // RATE
    doc.font(BODY).fontSize(8).fillColor(COLOR.black)
       .text(row.rate, cols.rate.x + 4, cellY, { width: cols.rate.w - 8, align: 'right' })

    // AMOUNT (bold)
    doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
       .text(row.amount, cols.amount.x + 4, cellY, { width: cols.amount.w - 8, align: 'right' })

    // Bottom border
    doc.moveTo(PL, y + rowH).lineTo(PR, y + rowH)
       .strokeColor(COLOR.lineGray).lineWidth(0.3).stroke()

    y += rowH
    rowIndex++
  }

  // Outer table border
  doc.rect(PL, tableStartY, CW, y - tableStartY)
     .strokeColor(COLOR.darkGray).lineWidth(0.5).stroke()

  // ═══════════════════════════════════════════
  // ── BALANCE DUE + FOOTER (drawn as a single block) ──
  // ═══════════════════════════════════════════
  // Total height: balance(30) + nsf(50) + signatures(68) + bottom bar(50) ≈ 198
  const FOOTER_BLOCK_H = 210
  const balW = 200

  // If the whole footer block doesn't fit, move to a new page
  const footerFits = (y + 14 + FOOTER_BLOCK_H) <= doc.page.height - 40
  let balY

  if (footerFits) {
    // Everything on the same page — balance right after table
    balY = y + 14
  } else {
    // Not enough room — new page, balance at the top
    doc.addPage()
    drawHeader()
    balY = 125
  }

  doc.font(BOLD).fontSize(10).fillColor(COLOR.black)
     .text('BALANCE DUE', PR - balW, balY, { width: balW - 90, align: 'right' })

  doc.font(BOLD).fontSize(14).fillColor(COLOR.black)
     .text(fmt(grandTotal), PR - 85, balY - 2, { width: 85, align: 'right' })

  // ── Footer always anchored to page bottom ──
  // Red line at bottom, then certificate text + Zelle ABOVE the line
  const pageH = doc.page.height
  const zeleY  = pageH - 30   // Zelle (last line, near bottom edge)
  const certY  = zeleY - 12   // Certificate text (one line above Zelle)
  const lineY  = certY - 8    // Red line above certificate text

  doc.moveTo(PL, lineY).lineTo(PR, lineY)
     .strokeColor(COLOR.red).lineWidth(0.5).stroke()

  doc.font(BODY).fontSize(6.5).fillColor(COLOR.lightGray)
     .text(
       'Please, send your update Sales Tax Certificate to saab@saabfoods.com or delivering it to one of our representatives.',
       PL, certY, { width: CW, align: 'center' }
     )

  doc.font(BOLD).fontSize(6.5).fillColor(COLOR.lightGray)
     .text('Zelle: 321-989-7211', PL, zeleY, { width: CW, align: 'center' })

  // ── Signature fields — anchored above bottom bar ──
  const lineLen = 180
  const sigY = lineY - 68

  doc.font(BODY).fontSize(8).fillColor(COLOR.darkGray)
     .text('Print name:', PL, sigY)
  doc.moveTo(PL + 58, sigY + 10).lineTo(PL + 58 + lineLen, sigY + 10)
     .strokeColor(COLOR.darkGray).lineWidth(0.5).stroke()

  doc.font(BODY).fontSize(8).fillColor(COLOR.darkGray)
     .text('Date:  ____/____/____', PL, sigY + 22)

  doc.font(BODY).fontSize(8).fillColor(COLOR.darkGray)
     .text('Please, sign:', PL, sigY + 44)
  doc.moveTo(PL + 70, sigY + 54).lineTo(PL + 70 + lineLen, sigY + 54)
     .strokeColor(COLOR.darkGray).lineWidth(0.5).stroke()

  // ── NSF / Returns policy — anchored above signatures ──
  const nsfY = sigY - 50

  doc.font(BODY).fontSize(6).fillColor(COLOR.lightGray)
     .text('NSF Fee: $25/$30/$40 or 5% of check, per FL law.', PL, nsfY)

  doc.font(BODY).fontSize(6).fillColor(COLOR.lightGray)
     .text(
       '*PRODUCT RETURNS ONLY AT DELIVERY / DEVOLUCIONES\n' +
       'SOLO AL MOMENTO DE LA ENTREGA / DEVOLUÇÕES SOMENTE\n' +
       'NO ATO DA ENTREGA',
       PL, nsfY + 12
     )

  doc.end()
}

module.exports = { generateInvoice }
