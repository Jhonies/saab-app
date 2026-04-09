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
   // balance(30) + nsf(50) + signatures(68) + bottom bar(50) ≈ 198
   const FOOTER_BLOCK_H = 210

   // ── Page-break threshold ──
   // Rows must stop early enough so the footer always fits on the same page
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
   doc.font(BODY).fontSize(22).fillColor(COLOR.red)
      .text('INVOICE', PL, invoiceY)


   // ── Info block ──
   const infoY = invoiceY + 40
   const col1 = PL
   const col2 = PL + CW * 0.33
   const col3 = PL + CW * 0.66

   // BILL TO
   doc.font('IBMBold').fontSize(8).fillColor(COLOR.black)
      .text('BILL TO', col1, infoY)
   doc.font(BODY).fontSize(9).fillColor(COLOR.black)
      .text(
         ([order.clientName, order.address].filter(Boolean).join('\n') || '—').toUpperCase(),
         col1, infoY + 14, { width: CW * 0.30 }
      )

   // SHIP TO
   doc.font('IBMBold').fontSize(8).fillColor(COLOR.black)
      .text('SHIP TO', col2, infoY)
   doc.font('HelvItalic').fontSize(9).fillColor(COLOR.black)
      .text(
         ([order.clientName, order.address].filter(Boolean).join('\n') || '—').toUpperCase(),
         col2, infoY + 14, { width: CW * 0.30 }
      )

   // INVOICE # / DATE / DUE DATE / TERMS
   // DUE DATE = createdAt + 7 days
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
      doc.font('IBMBold').fontSize(8).fillColor(COLOR.black)
         .text(label, col3, ly, { width: 80 })
      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
         .text(value, col3 + 82, ly, { width: 100 })
   })

   // ── SALES REP ──
   const repY = infoY + 70
   doc.font(BOLD).fontSize(8).fillColor(COLOR.black)
      .text('SALES REP', col1, repY)
   doc.font(BODY).fontSize(9).fillColor(COLOR.black)
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
      qty: { x: PL, w: 55 },
      item: { x: PL + 55, w: 115 },
      desc: { x: PL + 170, w: CW - 170 - 75 - 80 },
      rate: { x: PR - 155, w: 75 },
      amount: { x: PR - 80, w: 80 },
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
         doc.font(BODY).fontSize(7).fillColor(COLOR.red)
            .text(label, col.x + 4, yPos + 6, { width: col.w - 8 })
      })

      // Bottom border under header
      doc.moveTo(PL, yPos + headerH).lineTo(PR, yPos + headerH)
         .strokeColor(COLOR.lineGray).lineWidth(0.3).stroke()

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
               qty: `${item.quantity} cxs`,
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
      // Calculate row height based on description text
      doc.font('HelvItalic').fontSize(8)
      const descHeight = doc.heightOfString((row.desc || '—').toUpperCase(), { width: cols.desc.w - 8 })
      const rowH = Math.max(22, descHeight + 12) // min 22, pad 6 top + 6 bottom

      // Check page overflow — leave room for at least this row + footer
      if (y + rowH > PAGE_BOTTOM) {
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
      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
         .text(String(row.qty).toUpperCase(), cols.qty.x + 4, cellY, { width: cols.qty.w - 8 })

      // ITEM (product name — IBM bold)
      doc.font('IBMBold').fontSize(8).fillColor(COLOR.black)
         .text(row.item, cols.item.x + 4, cellY, { width: cols.item.w - 8 })

      // DESCRIPTION (multi-line — HelvItalic uppercase)
      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
         .text((row.desc || '—').toUpperCase(), cols.desc.x + 4, cellY, { width: cols.desc.w - 8 })

      // RATE
      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
         .text(String(row.rate).toUpperCase(), cols.rate.x + 4, cellY, { width: cols.rate.w - 8, align: 'right' })

      // AMOUNT
      doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
         .text(String(row.amount).toUpperCase(), cols.amount.x + 4, cellY, { width: cols.amount.w - 8, align: 'right' })

      // Bottom border
      doc.moveTo(PL, y + rowH).lineTo(PR, y + rowH)
         .strokeColor(COLOR.lineGray).lineWidth(0.3).stroke()

      y += rowH
      rowIndex++
   }

   // ═══════════════════════════════════════════
   // ── BALANCE DUE + FOOTER ──
   // ═══════════════════════════════════════════
   // Footer layout (always drawn top-to-bottom to avoid PDFKit auto-pagination):
   //   balY   → Balance Due (right) + NSF Fee (left)
   //   balY+35 → Signatures
   //   pageH-40 → separator line
   //   pageH-30 → Sales Tax cert text
   //   pageH-18 → Zelle
   const balW = 200

   const footerFits = (y + 14 + FOOTER_BLOCK_H) <= doc.page.height - 40
   let balY

   if (footerFits) {
      balY = y + 14
   } else {
      doc.addPage()
      drawHeader()
      balY = 125
   }

   const pageH = doc.page.height

   // ── Balance Due (right) + NSF Fee (left) — same row ──
   doc.font('HelvItalic').fontSize(10).fillColor(COLOR.black)
      .text('BALANCE DUE', PR - balW, balY, { width: balW - 90, align: 'right' })
   doc.font('HelvItalic').fontSize(14).fillColor(COLOR.black)
      .text(fmt(grandTotal).toUpperCase(), PR - 85, balY - 2, { width: 85, align: 'right' })

   doc.font('HelvItalic').fontSize(6).fillColor(COLOR.black)
      .text('NSF Fee: $25/$30/$40 or 5% of check, per FL law.', PL, balY)
   doc.font('HelvItalic').fontSize(6).fillColor(COLOR.black)
      .text(
         '*PRODUCT RETURNS ONLY AT DELIVERY / DEVOLUCIONES\n' +
         'SOLO AL MOMENTO DE LA ENTREGA / DEVOLUÇÕES SOMENTE\n' +
         'NO ATO DA ENTREGA',
         PL, balY + 10
      )

   // ── Signature fields ──
   const lineLen = 180
   const sigY = balY + 52

   doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
      .text('Print name:', PL, sigY)
   doc.moveTo(PL + 58, sigY + 10).lineTo(PL + 58 + lineLen, sigY + 10)
      .strokeColor(COLOR.black).lineWidth(0.5).stroke()

   doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
      .text('Date:  ____/____/____', PL, sigY + 22)

   doc.font('HelvItalic').fontSize(8).fillColor(COLOR.black)
      .text('Please, sign:', PL, sigY + 44)
   doc.moveTo(PL + 70, sigY + 54).lineTo(PL + 70 + lineLen, sigY + 54)
      .strokeColor(COLOR.black).lineWidth(0.5).stroke()

   // ── Bottom bar — drawn sequentially to avoid PDFKit auto-pagination ──
   const certY = pageH - 70

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
