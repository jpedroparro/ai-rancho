import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createSaleService } from '@/lib/services/sale'
import { createFarmService } from '@/lib/services/farm'
import { createMilkStockService } from '@/lib/services/milk-stock'
import { getDb } from '@/lib/database'
import { validateSale } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  return NextResponse.json(await createSaleService().getSales(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateSale(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  // Milk sale: validate and deduct stock
  if (data.type === 'MILK') {
    const milkStock = createMilkStockService()
    const balance = await milkStock.getBalance(farmId ? [farmId] : undefined)
    if (data.quantity > balance + 0.001) {
      return NextResponse.json({ error: 'Saldo insuficiente. Disponivel: ' + balance.toFixed(1) + 'L, solicitado: ' + data.quantity.toFixed(1) + 'L' }, { status: 422 })
    }
  }

  const sale = await createSaleService().createSale({ ...data, farmId })

  // Post-create side effects
  if (data.type === 'MILK') {
    await createMilkStockService().addExit({ farmId: farmId ?? undefined, date: data.date, type: 'EXIT', reason: 'SALE', quantity: data.quantity, saleId: sale.id })
  }

  if (data.type === 'ANIMAL' && Array.isArray(data.animalIds) && data.animalIds.length > 0) {
    const db = await getDb()
    for (const animalId of data.animalIds) {
      db.run('UPDATE animals SET status="SOLD", updatedAt=datetime("now") WHERE id=?', [animalId])
      db.run('INSERT OR IGNORE INTO sale_animals (saleId, animalId) VALUES (?,?)', [sale.id, animalId])
    }
  }

  return NextResponse.json(sale, { status: 201 })
})
