/**
 * Gera QR codes em lote para todos os imóveis do banco.
 *
 * Uso:
 *   node scripts/generate-qrcodes.js
 *
 * Requisitos:
 *   npm install qrcode dotenv @supabase/supabase-js
 *
 * Saída:
 *   Pasta ./qrcodes/ com um PNG por imóvel, nomeado pelo endereço.
 *   Cada QR code contém o UUID do imóvel (property_id).
 */

const { createClient } = require('@supabase/supabase-js')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  const outDir = path.join(__dirname, '..', 'qrcodes')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, address, sector_id')
    .order('address')

  if (error) {
    console.error('Erro ao buscar imóveis:', error.message)
    process.exit(1)
  }

  console.log(`Gerando QR codes para ${properties.length} imóveis...\n`)

  for (const prop of properties) {
    const safeName = prop.address
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 80)
    const filename = `${safeName}_${prop.id.slice(0, 8)}.png`
    const filepath = path.join(outDir, filename)

    await QRCode.toFile(filepath, prop.id, {
      type: 'png',
      width: 300,
      margin: 2,
      color: { dark: '#006B3F', light: '#ffffff' },
    })

    console.log(`  ✓ ${prop.address}`)
  }

  console.log(`\nPronto! ${properties.length} QR codes salvos em ./qrcodes/`)
  console.log('Imprima em etiquetas e cole na placa de cada imóvel.')
}

main()
