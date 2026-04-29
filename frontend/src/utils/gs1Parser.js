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

// Parse YYMMDD into ISO date, returning null if MM or DD is out of range.
// GS1 spec allows DD=00 to mean "last day of the month".
const parseGs1Date = (digits) => {
  const yy = parseInt(digits.slice(0, 2), 10)
  const mm = parseInt(digits.slice(2, 4), 10)
  const dd = parseInt(digits.slice(4, 6), 10)
  if (mm < 1 || mm > 12) return null
  if (dd < 0 || dd > 31) return null
  const year = yy < 50 ? 2000 + yy : 1900 + yy
  const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd
  const date = new Date(year, mm - 1, day)
  if (date.getMonth() !== mm - 1) return null // calendar overflow (e.g. Feb 30)
  return date.toISOString().slice(0, 10)
}

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
  { ai: '11', regex: /^11(\d{6})/, field: 'productionDate', parse: (m) => parseGs1Date(m[1]) },
  { ai: '13', regex: /^13(\d{6})/, field: 'packagingDate',  parse: (m) => parseGs1Date(m[1]) },
  { ai: '15', regex: /^15(\d{6})/, field: 'bestBeforeDate', parse: (m) => parseGs1Date(m[1]) },
  { ai: '17', regex: /^17(\d{6})/, field: 'expiryDate',     parse: (m) => parseGs1Date(m[1]) },
  // AI 7003 — Expiration date and time YYMMDDHHMM (10 digits fixed)
  {
    ai: '7003',
    regex: /^7003(\d{10})/,
    field: 'expiryDateTime',
    parse: (m) => parseGs1Date(m[1].slice(0, 6)),
  },
  // AI 10 — Batch/Lot (variable length, up to 20 alphanumeric).
  // Terminator is GS or end-of-string. Variable-length AIs without a GS
  // separator are malformed by spec; we don't try to split them via lookahead
  // because batch/serial values can contain digit patterns that look like AIs.
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

// Length of fixed-length AIs (used to skip past unknown ones gracefully).
// Maps AI prefix → total length (AI digits + data digits).
const KNOWN_FIXED_LENGTHS = {
  '00': 20, '01': 16, '02': 16,
  '11': 8, '13': 8, '15': 8, '17': 8,
  '20': 4,
}

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
    data = data.replace(/\s+/g, '').replace(/\((\d{2,4})\)/g, (_, ai) => GS + ai)
  }

  let iterations = 0
  while (data.length > 0 && iterations < 30) {
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
        const value = def.parse(m)
        if (value !== null) result[def.field] = value
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
      // Unknown AI — try to skip past it gracefully.
      // 1) If next 2 digits are a known fixed-length AI prefix, skip its full length.
      // 2) Otherwise jump to the next GS separator if any.
      // 3) Last resort: drop one char and keep trying (avoids losing data after
      //    an unknown 4-digit AI like 7003 when no GS is present).
      const prefix2 = data.slice(0, 2)
      const prefix4 = data.slice(0, 4)
      const skipLen = KNOWN_FIXED_LENGTHS[prefix4] || KNOWN_FIXED_LENGTHS[prefix2]
      if (skipLen) {
        data = data.slice(skipLen)
        continue
      }
      const gsIdx = data.indexOf(GS)
      if (gsIdx >= 0) {
        data = data.slice(gsIdx + 1)
      } else {
        data = data.slice(1)
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
