const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')

// ── Assets ──
const ASSETS_DIR = path.join(__dirname, '..', 'assets')
const LOGO_PATH = path.join(ASSETS_DIR, 'Logo-do-invoice.png')
const FONT_HELV_BOLD = path.join(ASSETS_DIR, 'helvetica-world-bold.ttf')
const FONT_HELV_ITALIC = path.join(ASSETS_DIR, 'helvetica-world-italic.ttf')
const FONT_IBM_ITALIC = path.join(ASSETS_DIR, 'IBMPlexSans-Italic-VariableFont_wdth,wght.ttf')
const FONT_IBM_BOLD = path.join(ASSETS_DIR, 'IBMPlexSans-Bold.ttf')

// Warn on missing assets at startup (non-fatal — invoice endpoint will fail individually)
for (const f of [LOGO_PATH, FONT_HELV_BOLD, FONT_HELV_ITALIC, FONT_IBM_ITALIC, FONT_IBM_BOLD]) {
   if (!fs.existsSync(f)) {
      console.warn(`[InvoiceService] asset não encontrado — ${f}`)
   }
}

// ── Palette ──
const COLOR = {
   lightRed: '#e6ccd5',
   red: '#8b0000',
   black: '#000000',
   darkGray: '#333333',
   midGray: '#666666',
   lightGray: '#999999',
   lineGray: '#cccccc',
   white: '#ffffff',
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
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 48, right: 48 },
   })

   doc.pipe(stream)

   doc.registerFont('HelvBold', FONT_HELV_BOLD)
   doc.registerFont('HelvItalic', FONT_HELV_ITALIC)
   doc.registerFont('IBMItalic', FONT_IBM_ITALIC)
   doc.registerFont('IBMBold', FONT_IBM_BOLD)

   const W = doc.page.width
   const PL = 48
   const PR = W - 48
   const CW = PR - PL  // content width

   // ── Font aliases ──
   const BOLD = 'HelvBold'    // hierarchy & emphasis
   const BODY = 'IBMItalic'   // secondary & descriptive

   // ── Footer block height (used for both row overflow check and footer placement) ──
   const FOOTER_BLOCK_H = 170

   // ── Page-break threshold ──
   const PAGE_BOTTOM = doc.page.height - 40 - FOOTER_BLOCK_H - 14

   // ═══════════════════════════════════════════
   // ── HEADER (repeated on every page) ──
   // ═══════════════════════════════════════════
   const drawHeader = () => {
      // Left: Company info
      doc.font('IBMBold').fontSize(11).fillColor(COLOR.black)
         .text('SAAB Foods LLC', PL, 40)

      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
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
   doc.font('HelvItalic').fontSize(22).fillColor(COLOR.red)
      .text('INVOICE', PL, invoiceY)


   // ── Info block ──
   const infoY = invoiceY + 40
   const col1 = PL
   const col2 = PL + CW * 0.33
   const col3 = PL + CW * 0.66

   // BILL TO
   doc.font('IBMBold').fontSize(10).fillColor(COLOR.black)
      .text('BILL TO', col1, infoY)
   doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
      .text(
         ([order.clientName, order.address].filter(Boolean).join('\n') || '—').toUpperCase(),
         col1, infoY + 14, { width: CW * 0.30 }
      )

   // SHIP TO
   doc.font('IBMBold').fontSize(10).fillColor(COLOR.black)
      .text('SHIP TO', col2, infoY)
   doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
      .text(
         ([order.clientName, order.address].filter(Boolean).join('\n') || '—').toUpperCase(),
         col2, infoY + 14, { width: CW * 0.30 }
      )

   // INVOICE # / DATE / DUE DATE / TERMS
   const dueDate = new Date(order.createdAt)
   dueDate.setDate(dueDate.getDate() + 7)

   const rightLabels = [
      ['INVOICE #', String(order.id).padStart(5, '0')],
      ['DATE', fmtDate(order.createdAt)],
      ['DUE DATE', fmtDate(dueDate)],
      ['TERMS', 'Net 7'],
   ]

   rightLabels.forEach(([label, value], i) => {
      const ly = infoY + i * 14
      doc.font('IBMBold').fontSize(10).fillColor(COLOR.black)
         .text(label, col3, ly, { width: 70, align: 'right' })
      doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
         .text(value, col3 + 75, ly, { width: 100 })
   })

   // ── SALES REP ──
   const repY = infoY + 70
   doc.font('IBMBold').fontSize(10).fillColor(COLOR.black)
      .text('SALES REP', col1, repY)
   doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
      .text((order.client?.email || 'WELLINGTON').toUpperCase(), col1, repY + 14)

   // Thin gray separator before table
   const sepY = repY + 36
   doc.moveTo(PL, sepY).lineTo(PR, sepY)
      .strokeColor(COLOR.lineGray).lineWidth(0.3).stroke()

   // ═══════════════════════════════════════════
   // ── TABLE ──
   // ═══════════════════════════════════════════
   const tableTop = sepY + 10
   const headerH = 18

   // Column layout
   const cols = {
      qty: { x: PL, w: 50 },
      item: { x: PL + 50, w: 120 },
      desc: { x: PL + 170, w: CW - 170 - 70 - 70 },
      rate: { x: PR - 140, w: 70, align: 'right' },
      amount: { x: PR - 70, w: 70, align: 'right' },
   }

   // ── Draw table header row ──
   const drawTableHeader = (yPos) => {
      const headers = [
         ['QTY', cols.qty],
         ['ITEM', cols.item],
         ['DESCRIPTION', cols.desc],
         ['RATE', cols.rate],
         ['AMOUNT', cols.amount],
      ]

      // Header background
      doc.rect(PL, yPos, CW, headerH).fill(COLOR.lightRed)

      headers.forEach(([label, col]) => {
         doc.font('HelvItalic').fontSize(9).fillColor(COLOR.red)
            .text(label, col.x + 4, yPos + 5, { width: col.w - 8, align: col.align || 'left' })
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
      const prodType = prodName

      if (item.priceType === 'PER_LB') {
         const boxes = item.boxWeights ?? []
         if (boxes.length > 0) {
            const totalWeight = boxes.reduce((sum, bw) => sum + Number(bw.weightLb || 0), 0)
            const subtotal = totalWeight * (item.pricePerLb || 0)
            grandTotal += subtotal

            // Build multi-line description — max 3 weights per line
            const weightValues = boxes.map(bw => Number(bw.weightLb).toFixed(2))
            const weightChunks = []
            for (let i = 0; i < weightValues.length; i += 3) {
               weightChunks.push(weightValues.slice(i, i + 3).join(' + '))
            }
            const weightsStr = weightChunks
               .map((chunk, i) => i < weightChunks.length - 1 ? chunk + ' +' : chunk)
               .join('\n')
            const descLines = [
               prodType,
               `${String(boxes.length).padStart(2, '0')} CASES`,
               weightsStr,
            ].filter(Boolean).join('\n')

            rows.push({
               qty: `${fmtNum(totalWeight)}`,
               item: prodName,
               desc: descLines,
               rate: fmtNum(item.pricePerLb || 0),
               amount: fmtNum(subtotal),
            })
         } else {
            const subtotal = (item.weightLb || 0) * (item.pricePerLb || 0)
            grandTotal += subtotal
            rows.push({
               qty: `${item.quantity}`,
               item: prodName,
               desc: prodType,
               rate: fmtNum(item.pricePerLb || 0),
               amount: fmtNum(subtotal),
            })
         }
      } else {
         const subtotal = item.quantity * (item.pricePerBox || item.pricePerUnit || 0)
         grandTotal += subtotal
         rows.push({
            qty: `${item.quantity}`,
            item: prodName,
            desc: prodType,
            rate: fmtNum(item.pricePerBox || item.pricePerUnit || 0),
            amount: fmtNum(subtotal),
         })
      }
   }

   // ── Render rows with dynamic height & pagination ──
   for (const row of rows) {
      doc.font('HelvItalic').fontSize(10)
      const descHeight = doc.heightOfString((row.desc || '—').toUpperCase(), { width: cols.desc.w - 8 })
      const rowH = Math.max(18, descHeight + 10)

      if (y + rowH > PAGE_BOTTOM) {
         doc.addPage()
         drawHeader()
         const newTableY = 115
         y = drawTableHeader(newTableY)
         tableStartY = newTableY
      }

      const cellY = y + 5

      // QTY
      doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
         .text(String(row.qty).toUpperCase(), cols.qty.x + 4, cellY, { width: cols.qty.w - 8, align: cols.qty.align || 'left' })

      // ITEM
      doc.font('IBMBold').fontSize(10).fillColor(COLOR.black)
         .text(String(row.item).toUpperCase(), cols.item.x + 4, cellY, { width: cols.item.w - 8, align: cols.item.align || 'left' })

      // DESCRIPTION
      doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
         .text((row.desc || '—').toUpperCase(), cols.desc.x + 4, cellY, { width: cols.desc.w - 8 })

      // RATE
      doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
         .text(String(row.rate).toUpperCase(), cols.rate.x + 4, cellY, { width: cols.rate.w - 8, align: cols.rate.align || 'right' })

      // AMOUNT
      doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
         .text(String(row.amount).toUpperCase(), cols.amount.x + 4, cellY, { width: cols.amount.w - 8, align: cols.amount.align || 'right' })

      y += rowH
      rowIndex++
   }

   // ═══════════════════════════════════════════
   // ── BALANCE DUE + FOOTER ──
   const balW = 200
   const footerFits = (y + 14 + FOOTER_BLOCK_H) <= doc.page.height - 40
   let balY = footerFits ? y + 25 : (() => {
      doc.addPage()
      drawHeader()
      return 125
   })()

   const pageH = doc.page.height

   // Dotted line before footer
   const dottedY = balY - 10
   doc.moveTo(PL, dottedY).lineTo(PR, dottedY)
      .dash(2, { space: 2 }).strokeColor(COLOR.lineGray).lineWidth(0.7).stroke().undash()

   // ── Balance Due (right) + NSF Fee (left) — same row ──
   doc.font('HelvItalic').fontSize(11).fillColor(COLOR.black)
      .text('BALANCE DUE', PR - balW, balY, { width: balW - 90, align: 'right' })
   doc.font('IBMBold').fontSize(15).fillColor(COLOR.black)
      .text(fmt(grandTotal), PR - 85, balY - 3, { width: 85, align: 'right' })

   doc.font('HelvItalic').fontSize(7).fillColor(COLOR.black)
      .text('NSF Fee: $25/$30/$40 or 5% of check, per FL law.\n!!!PRODUCT RETURNS ONLY AT DELIVERY | DEVOLUCIONES SOLO AL MOMENTO DE LA ENTREGA | DEVOLUCOES SOMENTE NO ATO DA ENTREGA', PL, balY, { width: PR - PL - balW - 20, lineGap: 3 })

   // ── Signature fields ──
   const lineLen = 140
   const sigY = balY + 45

   doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
      .text('Print name', PL, sigY)
   doc.moveTo(PL + 46, sigY + 8).lineTo(PL + 46 + lineLen, sigY + 8)
      .strokeColor(COLOR.lightGray).lineWidth(0.5).stroke()

   doc.text('Date', PL, sigY + 22)
   doc.moveTo(PL + 22, sigY + 30).lineTo(PL + 22 + 30, sigY + 30)
      .strokeColor(COLOR.lightGray).lineWidth(0.5).stroke()
   doc.text('/', PL + 54, sigY + 22)
   doc.moveTo(PL + 59, sigY + 30).lineTo(PL + 59 + 30, sigY + 30)
      .strokeColor(COLOR.lightGray).lineWidth(0.5).stroke()
   doc.text('/', PL + 91, sigY + 22)
   doc.moveTo(PL + 96, sigY + 30).lineTo(PL + 96 + 40, sigY + 30)
      .strokeColor(COLOR.lightGray).lineWidth(0.5).stroke()

   doc.text('Please, sign:', PL, sigY + 44)
   doc.moveTo(PL + 50, sigY + 52).lineTo(PL + 50 + lineLen, sigY + 52)
      .strokeColor(COLOR.lightGray).lineWidth(0.5).stroke()

   // ── Pay Invoice Button ──
   doc.roundedRect(PL, sigY + 68, 75, 20, 3)
      .strokeColor(COLOR.black).lineWidth(0.6).stroke()
   doc.font('HelvItalic').fontSize(9).fillColor(COLOR.black)
      .text('Pay invoice', PL, sigY + 74, { width: 75, align: 'center' })

   // ── Bottom bar ──
   const certY = pageH - 45

   doc.font('HelvItalic').fontSize(6.5).fillColor(COLOR.black)
      .text(
         'Please, send your update Sales Tax Certificate to saab@saabfoods.com or delivering it to one of our representatives.',
         PL, certY, { width: CW, align: 'center' }
      )

   doc.font('HelvItalic').fontSize(6.5).fillColor(COLOR.black)
      .text('Zelle: 321-989-7211', PL, doc.y + 4, { width: CW, align: 'center' })

   doc.end()
}

module.exports = { generateInvoice }
