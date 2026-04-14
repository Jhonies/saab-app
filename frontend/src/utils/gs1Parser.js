/**
 * Parse a GS1-128 (EAN-128) barcode string.
 *
 * GS1-128 uses Application Identifiers (AIs) to encode data fields.
 * Common AIs in meat industry:
 *   AI 01  — GTIN (14 digits, fixed length)
 *   AI 310x — Net weight in kg (6 digits, x = decimal places) [fixed length]
 *   AI 320x — Net weight in lb (6 digits, x = decimal places) [fixed length]
 *   AI 17  — Expiry date YYMMDD (6 digits, fixed length)
 *   AI 10  — Batch/Lot number (variable length, up to 20 chars)
 *
 * Variable-length fields are terminated by GS (ASCII 29 / \x1D) or
 * by the FNC1 character (which scanners often encode as \x1D or ]C1).
 *
 * Returns: { gtin, weightLb, weightKg, expiryDate, batch, raw }
 */

const GS = '\x1D' // Group Separator — FNC1 delimiter

/**
 * AI definitions: [regex, fieldName, parser, fixedLength?]
 * Fixed-length AIs don't need a GS terminator.
 */
const AI_DEFS = [
  // AI 01 — GTIN-14 (14 digits fixed)
  {
    ai: '01',
    regex: /^01(\d{14})/,
    field: 'gtin',
    parse: (m) => m[1],
  },
  // AI 3200-3209 — Net weight in lb (6 digits, decimal position = last digit of AI)
  {
    ai: '320',
    regex: /^320(\d)(\d{6})/,
    field: 'weightLb',
    parse: (m) => {
      const decimals = parseInt(m[1], 10)
      const raw = parseInt(m[2], 10)
      return raw / Math.pow(10, decimals)
    },
  },
  // AI 3100-3109 — Net weight in kg (6 digits)
  {
    ai: '310',
    regex: /^310(\d)(\d{6})/,
    field: 'weightKg',
    parse: (m) => {
      const decimals = parseInt(m[1], 10)
      const raw = parseInt(m[2], 10)
      return raw / Math.pow(10, decimals)
    },
  },
  // AI 11, 13, 15, 17 — Dates YYMMDD (6 digits fixed)
  // We extract them all as expiryDate for simplicity, or we can just extract them dynamically.
  // We'll map them to appropriate fields.
  {
    ai: '11',
    regex: /^11(\d{6})/,
    field: 'productionDate',
    parse: (m) => {
      const yy = parseInt(m[1].slice(0, 2), 10); const mm = parseInt(m[1].slice(2, 4), 10); const dd = parseInt(m[1].slice(4, 6), 10);
      const year = yy < 50 ? 2000 + yy : 1900 + yy; const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd;
      return new Date(year, mm - 1, day).toISOString().slice(0, 10);
    },
  },
  {
    ai: '13',
    regex: /^13(\d{6})/,
    field: 'packagingDate',
    parse: (m) => {
      const yy = parseInt(m[1].slice(0, 2), 10); const mm = parseInt(m[1].slice(2, 4), 10); const dd = parseInt(m[1].slice(4, 6), 10);
      const year = yy < 50 ? 2000 + yy : 1900 + yy; const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd;
      return new Date(year, mm - 1, day).toISOString().slice(0, 10);
    },
  },
  {
    ai: '15',
    regex: /^15(\d{6})/,
    field: 'bestBeforeDate',
    parse: (m) => {
      const yy = parseInt(m[1].slice(0, 2), 10); const mm = parseInt(m[1].slice(2, 4), 10); const dd = parseInt(m[1].slice(4, 6), 10);
      const year = yy < 50 ? 2000 + yy : 1900 + yy; const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd;
      return new Date(year, mm - 1, day).toISOString().slice(0, 10);
    },
  },
  {
    ai: '17',
    regex: /^17(\d{6})/,
    field: 'expiryDate',
    parse: (m) => {
      const yy = parseInt(m[1].slice(0, 2), 10); const mm = parseInt(m[1].slice(2, 4), 10); const dd = parseInt(m[1].slice(4, 6), 10);
      const year = yy < 50 ? 2000 + yy : 1900 + yy; const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd;
      return new Date(year, mm - 1, day).toISOString().slice(0, 10);
    },
  },
  // AI 10 — Batch/Lot (variable length, up to 20 alphanumeric)
  {
    ai: '10',
    regex: /^10([^\x1D]{1,20})/,
    field: 'batch',
    parse: (m) => m[1],
    variable: true,
  },
  // AI 21 — Serial Number (variable length, up to 20 alphanumeric)
  {
    ai: '21',
    regex: /^21([^\x1D]{1,20})/,
    field: 'serial',
    parse: (m) => m[1],
    variable: true,
  },
]

/**
 * @param {string} rawString — raw barcode data from scanner
 * @returns {{ gtin?: string, weightLb?: number, weightKg?: number, expiryDate?: string, batch?: string, raw: string }}
 */
export function parseGS1Barcode(rawString) {
  const result = { raw: rawString }

  // Strip common scanner prefixes (symbology identifiers)
  //   ]C1 = GS1-128,  ]d2 = GS1 DataBar,  ]e0 = GS1 DataBar Expanded
  //   ]I1 = GS1 Interleaved 2of5,  ]Q3 = GS1 QR/DataMatrix
  let data = rawString.replace(/^\]\w\d/, '')

  // ── Handle parenthesized AI format ──
  // Some printers encode the barcode as plain Code 128 with parenthesized AIs
  // in the actual data, e.g. "(01)90000000033301(10)122812(21)272477".
  // We convert this to raw GS1 format by replacing each "(XX)" with GS + AI digits.
  // The GS before each AI correctly terminates any preceding variable-length field.
  if (/\(\d{2,4}\)/.test(data)) {
    data = data.replace(/\((\d{2,4})\)/g, (_, ai) => GS + ai)
  }

  let iterations = 0
  while (data.length > 0 && iterations < 20) {
    iterations++

    // Skip GS separators
    if (data[0] === GS) {
      data = data.slice(1)
      continue
    }

    let matched = false
    for (const def of AI_DEFS) {
      const m = data.match(def.regex)
      if (m) {
        result[def.field] = def.parse(m)
        data = data.slice(m[0].length)
        // If variable length, consume trailing GS if present
        if (def.variable && data[0] === GS) {
          data = data.slice(1)
        }
        matched = true
        break
      }
    }

    if (!matched) {
      // Unknown AI — skip 2 chars (AI) and try to find next GS or end
      const gsIdx = data.indexOf(GS)
      if (gsIdx >= 0) {
        data = data.slice(gsIdx + 1)
      } else {
        break
      }
    }
  }

  // ── Fallback: plain EAN-13, UPC-A, or GTIN-14 ──
  // If the scanner read a simple retail barcode (not GS1-128) we still
  // want to capture the GTIN.  EAN-13 = 13 digits, UPC-A = 12 digits,
  // GTIN-14 = 14 digits.  Zero-pad to 14 digits for consistency.
  if (!result.gtin) {
    const stripped = rawString.replace(/^\]\w\d/, '').trim()
    if (/^\d{12,14}$/.test(stripped)) {
      result.gtin = stripped.padStart(14, '0')
    }
  }

  // Convert kg to lb if we have kg but no lb
  if (result.weightKg != null && result.weightLb == null) {
    result.weightLb = +(result.weightKg * 2.20462).toFixed(4)
  }

  return result
}
