import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createSaleService } from '../services/sale'

const FARM = 'farm-1'

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
})
afterEach(clearTestDb)

describe('SaleService', () => {
  it('cria uma venda e calcula total', async () => {
    const svc = createSaleService()
    const sale = await svc.createSale({ type: 'MILK', date: '2024-06-01', quantity: 100, pricePerUnit: 2.5, farmId: FARM })
    expect(sale.id).toBeTruthy()
    expect(sale.total).toBeCloseTo(250)
  })

  it('soma receita total de múltiplas vendas', async () => {
    const svc = createSaleService()
    await svc.createSale({ type: 'MILK', date: '2024-06-01', quantity: 100, pricePerUnit: 2.5, farmId: FARM })
    await svc.createSale({ type: 'WOOL', date: '2024-06-02', quantity: 20, pricePerUnit: 12, farmId: FARM })
    const total = await svc.getRevenue([FARM])
    expect(total).toBeCloseTo(490)
  })

  it('filtra soma por fazenda', async () => {
    const svc = createSaleService()
    await svc.createSale({ type: 'MILK', date: '2024-06-01', quantity: 50, pricePerUnit: 2, farmId: FARM })
    await svc.createSale({ type: 'MILK', date: '2024-06-01', quantity: 50, pricePerUnit: 2, farmId: 'outra' })
    const total = await svc.getRevenue([FARM])
    expect(total).toBeCloseTo(100)
  })

  it('retorna vendas recentes ordenadas por data desc', async () => {
    const svc = createSaleService()
    await svc.createSale({ type: 'MILK', date: '2024-06-01', quantity: 10, pricePerUnit: 2, farmId: FARM })
    await svc.createSale({ type: 'MILK', date: '2024-06-03', quantity: 10, pricePerUnit: 2, farmId: FARM })
    const recent = await svc.getRecentSales(2, [FARM])
    expect(recent[0].date).toBe('2024-06-03')
    expect(recent[1].date).toBe('2024-06-01')
  })
})
