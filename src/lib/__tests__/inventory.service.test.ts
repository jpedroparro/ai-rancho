import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createInventoryService } from '../services/inventory'

const FARM = 'farm-1'

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
})
afterEach(clearTestDb)

describe('InventoryService', () => {
  describe('createItem', () => {
    it('cria item com campos obrigatórios', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({
        name: 'Ração concentrada',
        category: 'FEED',
        quantity: 500,
        unit: 'kg',
        farmId: FARM,
      })
      expect(item.id).toBeTruthy()
      expect(item.name).toBe('Ração concentrada')
      expect(item.quantity).toBe(500)
      expect(item.status).toBe('OK')
    })

    it('indica LOW quando quantidade abaixo do mínimo', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({
        name: 'Vacina aftosa',
        category: 'MEDICINE',
        quantity: 5,
        unit: 'doses',
        minQuantity: 20,
        farmId: FARM,
      })
      expect(item.status).toBe('LOW')
    })

    it('indica OUT quando quantidade é zero', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({
        name: 'Sal mineral',
        category: 'FEED',
        quantity: 0,
        unit: 'kg',
        minQuantity: 50,
        farmId: FARM,
      })
      expect(item.status).toBe('OUT')
    })
  })

  describe('getItems', () => {
    it('lista todos os itens da fazenda', async () => {
      const svc = createInventoryService()
      await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      await svc.createItem({ name: 'Ivermectina', category: 'MEDICINE', quantity: 10, unit: 'ml', farmId: FARM })
      const items = await svc.getItems({ farmIds: [FARM] })
      expect(items).toHaveLength(2)
    })

    it('filtra por categoria', async () => {
      const svc = createInventoryService()
      await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      await svc.createItem({ name: 'Ivermectina', category: 'MEDICINE', quantity: 10, unit: 'ml', farmId: FARM })
      const medicines = await svc.getItems({ category: 'MEDICINE', farmIds: [FARM] })
      expect(medicines).toHaveLength(1)
      expect(medicines[0].category).toBe('MEDICINE')
    })

    it('filtra apenas itens com estoque baixo ou zerado', async () => {
      const svc = createInventoryService()
      await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 200, unit: 'kg', minQuantity: 50, farmId: FARM })
      await svc.createItem({ name: 'Vacina', category: 'MEDICINE', quantity: 3, unit: 'doses', minQuantity: 20, farmId: FARM })
      await svc.createItem({ name: 'Sal', category: 'FEED', quantity: 0, unit: 'kg', minQuantity: 10, farmId: FARM })
      const low = await svc.getItems({ lowStock: true, farmIds: [FARM] })
      expect(low).toHaveLength(2)
      expect(low.every(i => i.status === 'LOW' || i.status === 'OUT')).toBe(true)
    })
  })

  describe('updateQuantity', () => {
    it('adiciona ao estoque existente', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      const updated = await svc.updateQuantity(item.id, 50)
      expect(updated.quantity).toBe(150)
    })

    it('subtrai do estoque existente', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      const updated = await svc.updateQuantity(item.id, -30)
      expect(updated.quantity).toBe(70)
    })

    it('não permite quantidade negativa', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 10, unit: 'kg', farmId: FARM })
      await expect(svc.updateQuantity(item.id, -50)).rejects.toThrow(/estoque insuficiente/i)
    })

    it('atualiza status após alteração de quantidade', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Vacina', category: 'MEDICINE', quantity: 30, unit: 'doses', minQuantity: 20, farmId: FARM })
      expect(item.status).toBe('OK')
      const updated = await svc.updateQuantity(item.id, -25)
      expect(updated.status).toBe('LOW')
    })
  })

  describe('updateItem', () => {
    it('atualiza nome, custo e fornecedor', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      const updated = await svc.updateItem(item.id, { name: 'Feno Premium', costPerUnit: 1.5, supplier: 'Agropecuária X' })
      expect(updated.name).toBe('Feno Premium')
      expect(updated.costPerUnit).toBe(1.5)
      expect(updated.supplier).toBe('Agropecuária X')
    })
  })

  describe('deleteItem', () => {
    it('remove item do inventário', async () => {
      const svc = createInventoryService()
      const item = await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', farmId: FARM })
      await svc.deleteItem(item.id)
      const items = await svc.getItems({ farmIds: [FARM] })
      expect(items).toHaveLength(0)
    })
  })

  describe('getStockValue', () => {
    it('calcula valor total do estoque (qty × custo unitário)', async () => {
      const svc = createInventoryService()
      await svc.createItem({ name: 'Feno', category: 'FEED', quantity: 100, unit: 'kg', costPerUnit: 1.5, farmId: FARM })
      await svc.createItem({ name: 'Ração', category: 'FEED', quantity: 200, unit: 'kg', costPerUnit: 2.0, farmId: FARM })
      const value = await svc.getStockValue([FARM])
      expect(value).toBeCloseTo(550)
    })
  })
})
