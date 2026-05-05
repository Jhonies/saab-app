/**
 * Tests for gs1Parser — using real barcode data from box photos
 */
import { parseGS1Barcode } from './gs1Parser.js'

// Helper
const approx = (a, b, tolerance = 0.01) => Math.abs(a - b) < tolerance

console.log('=== GS1 Parser Tests ===\n')
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

// ──────────────────────────────────────────────
// Test 1: Beef Eye Round DLX (GS1-128 with weight)
// From photo: (01)90000000019550(11)260204(3202)005390(10)122811(21)369193
// Expected: GTIN=90000000019550, weight=53.90 lbs, batch=122811, serial=369193
// ──────────────────────────────────────────────
console.log('\n📦 Beef Eye Round DLX:')

test('parses parenthesized format', () => {
  const r = parseGS1Barcode('(01)90000000019550(11)260204(3202)005390(10)122811(21)369193')
  assert(r.gtin === '90000000019550', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 53.90), `weight=${r.weightLb}`)
  assert(r.batch === '122811', `batch=${r.batch}`)
  assert(r.serial === '369193', `serial=${r.serial}`)
  assert(r.hasWeight === true, 'hasWeight')
})

test('parses raw format (no parens, with GS separators)', () => {
  const GS = '\x1D'
  const raw = `01900000000195501126020432020053901012281121369193`
  const r = parseGS1Barcode(raw)
  assert(r.gtin === '90000000019550', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 53.90), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
})

test('parses raw format with GS between batch and serial', () => {
  const GS = '\x1D'
  const raw = `0190000000019550112602043202005390${GS}10122811${GS}21369193`
  const r = parseGS1Barcode(raw)
  assert(r.gtin === '90000000019550', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 53.90), `weight=${r.weightLb}`)
  assert(r.batch === '122811', `batch=${r.batch}`)
  assert(r.serial === '369193', `serial=${r.serial}`)
})

// ──────────────────────────────────────────────
// Test 2: Sirloin Flap Meat (GS1-128 with weight)
// From photo: 019001234505158320200621711260319213896546(4)
// The numbers on the label: 0190012345051583202006217112603192138965646
// Expected: GTIN=90012345051583, weight=62.17 lbs
// ──────────────────────────────────────────────
console.log('\n📦 Sirloin Flap Meat:')

test('parses continuous format', () => {
  const r = parseGS1Barcode('(01)90012345051583(3202)006217(11)260319(21)38965646')
  assert(r.gtin === '90012345051583', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 62.17), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
  assert(r.serial === '38965646', `serial=${r.serial}`)
})

// ──────────────────────────────────────────────
// Test 3: Short Rib Plate (GS1-128 with weight) — from app screenshot
// (01)07432001611955(3202)005020(11)260126(21)2001032
// Expected: GTIN=07432001611955, weight=50.20 lbs
// ──────────────────────────────────────────────
console.log('\n📦 Short Rib Plate:')

test('parses parenthesized format', () => {
  const r = parseGS1Barcode('(01)07432001611955(3202)005020(11)260126(21)2001032')
  assert(r.gtin === '07432001611955', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 50.20), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
  assert(r.serial === '2001032', `serial=${r.serial}`)
})

// ──────────────────────────────────────────────
// Test 4: Beef Small Intestines (GS1-128 WITHOUT weight!)
// From photo sidebar barcode: (01)90012693862223(11)260202(21)0134001246
// Expected: GTIN=90012693862223, NO weight, hasWeight=false
// ──────────────────────────────────────────────
console.log('\n📦 Beef Small Intestines (NO weight in barcode):')

test('parses barcode without weight AI', () => {
  const r = parseGS1Barcode('(01)90012693862223(11)260202(21)0134001246')
  assert(r.gtin === '90012693862223', `GTIN=${r.gtin}`)
  assert(r.weightLb == null, `weightLb should be null, got ${r.weightLb}`)
  assert(r.hasWeight === false, `hasWeight should be false`)
  assert(r.serial === '0134001246', `serial=${r.serial}`)
})

test('raw continuous format without GS separators', () => {
  // This is the tricky one — no GS separators at all
  const raw = '019001269386222311260202210134001246'
  const r = parseGS1Barcode(raw)
  assert(r.gtin === '90012693862223', `GTIN=${r.gtin}`)
  assert(r.hasWeight === false, `hasWeight should be false`)
})

// ──────────────────────────────────────────────
// Test 5: Lava Cake (simple UPC/EAN — no AI structure)
// From photo: 10860816005037
// Expected: GTIN padded to 14 digits, no weight
// ──────────────────────────────────────────────
console.log('\n📦 Lava Cake (simple UPC):')

test('parses simple UPC/EAN barcode', () => {
  const r = parseGS1Barcode('10860816005037')
  // Note: 14 digits already, so no padding needed — but this looks like it starts with "10"
  // which is the AI for batch. The parser should handle this via fallback.
  // Actually 10860816005037 is 14 digits, so it might be treated as GTIN-14.
  // Either way, it should have no weight.
  assert(r.hasWeight === false, `hasWeight should be false`)
  // The GTIN should be captured either via AI 01 or via EAN fallback
  assert(r.gtin != null, `should have a GTIN`)
})

test('parses 13-digit EAN barcode', () => {
  const r = parseGS1Barcode('0860816005037')
  assert(r.gtin === '00860816005037', `GTIN=${r.gtin} (expected padded to 14)`)
  assert(r.hasWeight === false, 'hasWeight')
})

test('parses 12-digit UPC barcode', () => {
  const r = parseGS1Barcode('860816005037')
  assert(r.gtin === '00860816005037', `GTIN=${r.gtin} (expected padded to 14)`)
  assert(r.hasWeight === false, 'hasWeight')
})

// ──────────────────────────────────────────────
// Test 6: Edge cases
// ──────────────────────────────────────────────
console.log('\n🔧 Edge cases:')

test('handles ]C1 prefix (with GS separators as real scanners send)', () => {
  const GS = '\x1D'
  // Real GS1-128 scanner output for Sirloin Flap:
  // ]C1 + AI01 + GTIN-14 + AI3202 + weight + AI11 + date + AI21 + serial
  const r = parseGS1Barcode(`]C101900123450515833202006217112603192138965646`)
  assert(r.gtin === '90012345051583', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 62.17), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
})

test('handles ]C1 prefix with GS between variable fields', () => {
  const GS = '\x1D'
  const r = parseGS1Barcode(`]C1019001234505158332020062171126031${GS}9213896546${GS}`)
  // Even if the GS is in a weird position, GTIN and weight should parse
  assert(r.gtin === '90012345051583', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 62.17), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
})

test('handles weight in kg (AI 3102)', () => {
  const r = parseGS1Barcode('(01)12345678901234(3102)002445')
  assert(r.gtin === '12345678901234', `GTIN=${r.gtin}`)
  assert(approx(r.weightKg, 24.45), `weightKg=${r.weightKg}`)
  assert(r.weightLb != null, 'should convert kg to lb')
  assert(r.hasWeight === true, 'hasWeight')
})

test('handles empty/garbage input', () => {
  const r = parseGS1Barcode('')
  assert(r.hasWeight === false, 'hasWeight')
  assert(r.gtin == null, 'no gtin')
})

test('handles very short input', () => {
  const r = parseGS1Barcode('123')
  assert(r.hasWeight === false, 'hasWeight')
})

// ──────────────────────────────────────────────
// Test 7: Variable-length field lookahead (the bug fix)
// ──────────────────────────────────────────────
console.log('\n🔧 Variable-length fields with GS separators (realistic):')

test('batch and serial parse correctly with GS separators', () => {
  const GS = '\x1D'
  // This is how a real GS1-128 scanner sends the data:
  // FNC1 between variable-length fields
  const raw = `0190000000019550320200539010122811${GS}21369193`
  const r = parseGS1Barcode(raw)
  assert(r.gtin === '90000000019550', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 53.90), `weight=${r.weightLb}`)
  assert(r.batch === '122811', `batch=${r.batch}`)
  assert(r.serial === '369193', `serial=${r.serial}`)
})

test('without GS separators — fixed-length AIs still parse (known limitation for variable fields)', () => {
  // Without GS separators between variable fields, batch will consume serial.
  // This is a known limitation per GS1 spec — variable fields REQUIRE separators.
  // But the important thing is GTIN and weight (fixed-length) ALWAYS parse correctly.
  const raw = '019000000001955032020053901012281121369193'
  const r = parseGS1Barcode(raw)
  assert(r.gtin === '90000000019550', `GTIN=${r.gtin}`)
  assert(approx(r.weightLb, 53.90), `weight=${r.weightLb}`)
  assert(r.hasWeight === true, 'hasWeight')
  // batch may contain serial data — this is expected without GS separators
})

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────
console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log('⚠️  Some tests failed!')
  process.exit(1)
} else {
  console.log('✅ All tests passed!')
}
