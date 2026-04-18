#!/usr/bin/env node
// Usage: node import-imoveis.js <csv-file> <sector-code>
// CSV format: address,lat,lng,owner_name,owner_phone

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  const [,, csvFile, sectorCode] = process.argv
  if (!csvFile || !sectorCode) {
    console.error('Usage: node import-imoveis.js <csv-file> <sector-code>')
    process.exit(1)
  }

  const { data: sector, error: sectorErr } = await supabase
    .from('sectors')
    .select('id')
    .eq('code', sectorCode)
    .single()

  if (sectorErr || !sector) {
    console.error('Sector not found:', sectorCode)
    process.exit(1)
  }

  const raw = fs.readFileSync(csvFile, 'utf-8')
  const lines = raw.trim().split('\n').slice(1) // skip header

  const rows = lines.map(line => {
    const [address, lat, lng, owner_name, owner_phone] = line.split(',').map(s => s.trim())
    return {
      address,
      sector_id: sector.id,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      owner_name: owner_name || null,
      owner_phone: owner_phone || null,
    }
  })

  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('properties').insert(batch)
    if (error) console.error('Batch error:', error.message)
    else console.log(`Imported rows ${i + 1}–${Math.min(i + BATCH, rows.length)}`)
  }

  console.log(`Done. ${rows.length} properties imported to sector ${sectorCode}.`)
}

main()
