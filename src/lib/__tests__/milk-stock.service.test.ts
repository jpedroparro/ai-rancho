import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createMilkStockService } from '../services/milk-stock'
import { createMilkStockRepository } from '../repositories/milk-stock'

describe('MilkStockService', () => {
  let db: any

  beforeEach(async () => {
    db = await initTestDb()
    seedFarm(db)
  })
  afterEach(() => clearTestDb())

  it('starts with zero balance', async () => {
    const svc = createMilkStockService()
    expect(await svc.getBalance(['farm-1'])).toBe(0)
  })

  it('adds entry and updates balance', async () => {
    const svc = createMilkStockService()
    await svc.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 100 })
    expect(await svc.getBalance(['farm-1'])).toBe(100)
  })

  it('deducts exit from balance', async () => {
    const svc = createMilkStockService()
    await svc.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 200 })
    await svc.addExit({ farmId: 'farm-1', date: '2026-05-02', type: 'EXIT', reason: 'SALE', quantity: 80 })
    const balance = await svc.getBalance(['farm-1'])
    expect(balance).toBeCloseTo(120, 1)
  })

  it('throws error when exit exceeds balance', async () => {
    const svc = createMilkStockService()
    await svc.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 50 })
    await expect(
      svc.addExit({ farmId: 'farm-1', date: '2026-05-02', type: 'EXIT', reason: 'SALE', quantity: 100 })
    ).rejects.toThrow('Saldo insuficiente')
  })

  it('does not deduct from other farm balance', async () => {
    seedFarm(db, 'farm-2', 'user-2')
    const svc = createMilkStockService()
    await svc.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 100 })
    expect(await svc.getBalance(['farm-2'])).toBe(0)
  })

  it('returns movements list', async () => {
    const svc = createMilkStockService()
    await svc.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 150 })
    await svc.addExit({ farmId: 'farm-1', date: '2026-05-02', type: 'EXIT', reason: 'DISCARD', quantity: 10 })
    const movs = await svc.getMovements(['farm-1'])
    expect(movs).toHaveLength(2)
    expect(movs.some(m => m.type === 'ENTRY')).toBe(true)
    expect(movs.some(m => m.type === 'EXIT')).toBe(true)
  })

  it('balance never goes below zero', async () => {
    const repo = createMilkStockRepository()
    await repo.addEntry({ farmId: 'farm-1', date: '2026-05-01', type: 'ENTRY', reason: 'PRODUCTION', quantity: 100 })
    await repo.addExit({ farmId: 'farm-1', date: '2026-05-02', type: 'EXIT', reason: 'SALE', quantity: 100 })
    expect(await repo.getBalance(['farm-1'])).toBe(0)
  })
})
