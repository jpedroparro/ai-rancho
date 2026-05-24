import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createAnimalService } from '../services/animal'

const FARM = 'farm-1'

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
})
afterEach(clearTestDb)

describe('AnimalService', () => {
  describe('createAnimal', () => {
    it('cria um animal com campos obrigatórios', async () => {
      const svc = createAnimalService()
      const animal = await svc.createAnimal({ tag: 'LT-001', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      expect(animal.id).toBeTruthy()
      expect(animal.tag).toBe('LT-001')
      expect(animal.type).toBe('DAIRY')
      expect(animal.status).toBe('ACTIVE')
    })

    it('cria animal com nome e peso opcionais', async () => {
      const svc = createAnimalService()
      const animal = await svc.createAnimal({ tag: 'BV-001', name: 'Trovão', type: 'BEEF', gender: 'MALE', weight: 420, farmId: FARM })
      expect(animal.name).toBe('Trovão')
      expect(animal.weight).toBe(420)
    })

    it('rejeita tag duplicada', async () => {
      const svc = createAnimalService()
      await svc.createAnimal({ tag: 'DUP-001', type: 'SHEEP', gender: 'FEMALE', farmId: FARM })
      await expect(svc.createAnimal({ tag: 'DUP-001', type: 'SHEEP', gender: 'FEMALE', farmId: FARM })).rejects.toThrow()
    })
  })

  describe('getAnimals', () => {
    it('retorna lista vazia quando não há animais', async () => {
      const list = await createAnimalService().getAnimals({ farmIds: [FARM] })
      expect(list).toEqual([])
    })

    it('filtra por fazenda', async () => {
      const svc = createAnimalService()
      await svc.createAnimal({ tag: 'LT-F1', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await svc.createAnimal({ tag: 'LT-F2', type: 'DAIRY', gender: 'FEMALE', farmId: 'outra-fazenda' })
      const list = await svc.getAnimals({ farmIds: [FARM] })
      expect(list).toHaveLength(1)
      expect(list[0].tag).toBe('LT-F1')
    })

    it('filtra por tipo', async () => {
      const svc = createAnimalService()
      await svc.createAnimal({ tag: 'LT-01', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await svc.createAnimal({ tag: 'OV-01', type: 'SHEEP', gender: 'FEMALE', farmId: FARM })
      const dairy = await svc.getAnimals({ type: 'DAIRY', farmIds: [FARM] })
      expect(dairy).toHaveLength(1)
      expect(dairy[0].type).toBe('DAIRY')
    })

    it('filtra por status', async () => {
      const svc = createAnimalService()
      const a = await svc.createAnimal({ tag: 'LT-02', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await svc.updateAnimal(a.id, { status: 'SOLD' })
      const active = await svc.getAnimals({ status: 'ACTIVE', farmIds: [FARM] })
      expect(active).toHaveLength(0)
      const sold = await svc.getAnimals({ status: 'SOLD', farmIds: [FARM] })
      expect(sold).toHaveLength(1)
    })
  })

  describe('updateAnimal', () => {
    it('atualiza peso e notas', async () => {
      const svc = createAnimalService()
      const a = await svc.createAnimal({ tag: 'LT-03', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      const updated = await svc.updateAnimal(a.id, { weight: 500, notes: 'saudável' })
      expect(updated.weight).toBe(500)
      expect(updated.notes).toBe('saudável')
    })
  })

  describe('deleteAnimal', () => {
    it('remove o animal do banco', async () => {
      const svc = createAnimalService()
      const a = await svc.createAnimal({ tag: 'LT-04', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await svc.deleteAnimal(a.id)
      const list = await svc.getAnimals({ farmIds: [FARM] })
      expect(list).toHaveLength(0)
    })
  })
})
