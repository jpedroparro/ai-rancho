// ── Domain Types ──────────────────────────────────────────────────────────────

export type AnimalType = 'DAIRY' | 'SHEEP' | 'BEEF'

export interface Farm {
  id: string
  name: string
  location: string | null
  hectares: number | null
  description: string | null
  userId: string
  createdAt: string
  updatedAt: string
}
export type AnimalStatus = 'ACTIVE' | 'SOLD' | 'DEAD'
export type Gender = 'MALE' | 'FEMALE'
export type SaleType = 'MILK' | 'ANIMAL' | 'WOOL' | 'MEAT'
export type ExpenseCategory = 'FEED' | 'MEDICINE' | 'EQUIPMENT' | 'LABOR' | 'OTHER'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type PaymentType = 'SALARY' | 'BONUS' | 'ADVANCE'
export type UserRole = 'ADMIN' | 'USER'
export type AuthProvider = 'credentials' | 'google'
export type InventoryCategory = 'FEED' | 'MEDICINE' | 'EQUIPMENT' | 'FUEL' | 'OTHER'
export type InventoryStatus = 'OK' | 'LOW' | 'OUT'

export interface InventoryItem {
  id: string
  farmId?: string | null
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  minQuantity: number
  costPerUnit: number
  supplier?: string | null
  notes?: string | null
  status: InventoryStatus
  createdAt: string
  updatedAt: string
}

export interface CreateInventoryItemDto {
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  minQuantity?: number
  costPerUnit?: number
  supplier?: string
  notes?: string
  farmId?: string
}

export interface UpdateInventoryItemDto {
  name?: string
  category?: InventoryCategory
  unit?: string
  minQuantity?: number
  costPerUnit?: number
  supplier?: string
  notes?: string
}

export type EventType = 'VACCINATION' | 'TREATMENT' | 'BREEDING' | 'WEANING' | 'WEIGHING' | 'SHEARING' | 'PURCHASE' | 'SALE' | 'MAINTENANCE' | 'OTHER'
export type EventStatus = 'PENDING' | 'DONE' | 'CANCELLED'

export interface CalendarEvent {
  id: string
  farmId?: string | null
  title: string
  description?: string | null
  eventType: EventType
  date: string
  animalId?: string | null
  status: EventStatus
  createdAt: string
  updatedAt: string
  animal?: { tag: string; name: string | null } | null
}

export interface User {
  id: string
  name: string | null
  email: string
  password: string
  role: UserRole
  farmName: string | null
  provider: AuthProvider
  createdAt: string
  updatedAt: string
}

export interface Animal {
  id: string
  tag: string
  name: string | null
  type: AnimalType
  breed: string | null
  birthDate: string | null
  gender: Gender
  status: AnimalStatus
  weight: number | null
  notes: string | null
  farmId?: string | null
  createdAt: string
  updatedAt: string
}

export interface MilkRecord {
  id: string
  animalId: string
  date: string
  morning: number
  evening: number
  total: number
  notes: string | null
  farmId?: string | null
  createdAt: string
  animal?: { tag: string; name: string | null }
}

export interface Sale {
  id: string
  type: SaleType
  date: string
  quantity: number
  unit: string
  pricePerUnit: number
  total: number
  buyer: string | null
  notes: string | null
  farmId?: string | null
  createdAt: string
}

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  date: string
  amount: number
  supplier: string | null
  notes: string | null
  farmId?: string | null
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  role: string | null
  salary: number
  phone: string | null
  startDate: string
  status: EmployeeStatus
  notes: string | null
  farmId?: string | null
  createdAt: string
  updatedAt: string
  payments?: Payment[]
}

export interface Payment {
  id: string
  employeeId: string
  amount: number
  date: string
  type: PaymentType
  notes: string | null
  createdAt: string
  employee?: { name: string }
}

// ── Repository Interfaces (Dependency Inversion) ──────────────────────────────

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
}

export interface IFarmRepository {
  findByUserId(userId: string): Promise<Farm[]>
  findById(id: string): Promise<Farm | null>
  create(data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Farm>
  update(id: string, data: Partial<Omit<Farm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Farm>
  delete(id: string): Promise<void>
}

export interface IAnimalRepository {
  findAll(filters?: { type?: string; status?: string; farmIds?: string[] }): Promise<Animal[]>
  findById(id: string): Promise<Animal | null>
  create(data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Animal>
  update(id: string, data: Partial<Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Animal>
  delete(id: string): Promise<void>
}

export interface IMilkRepository {
  findByDays(days: number, farmIds?: string[]): Promise<MilkRecord[]>
  findByDateRange(startDate: string, endDate: string, farmIds?: string[]): Promise<MilkRecord[]>
  findByAnimalId(animalId: string): Promise<MilkRecord[]>
  create(data: Omit<MilkRecord, 'id' | 'createdAt' | 'animal'>): Promise<MilkRecord>
}

export interface ISaleRepository {
  findAll(farmIds?: string[]): Promise<Sale[]>
  sumTotal(farmIds?: string[]): Promise<number>
  create(data: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale>
  findRecent(limit: number, farmIds?: string[]): Promise<Sale[]>
}

export interface IExpenseRepository {
  findAll(farmIds?: string[]): Promise<Expense[]>
  sumTotal(farmIds?: string[]): Promise<number>
  create(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>
  delete(id: string): Promise<void>
  findRecent(limit: number, farmIds?: string[]): Promise<Expense[]>
}

export interface IEmployeeRepository {
  findAll(farmIds?: string[]): Promise<Employee[]>
  findById(id: string): Promise<Employee | null>
  create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'payments'>): Promise<Employee>
  update(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'payments'>>): Promise<Employee>
  deactivate(id: string): Promise<void>
}

export interface IPaymentRepository {
  findAll(): Promise<Payment[]>
  create(data: Omit<Payment, 'id' | 'createdAt' | 'employee'>): Promise<Payment>
  findByEmployee(employeeId: string, limit?: number): Promise<Payment[]>
}

// ── DTO types (request payloads) ──────────────────────────────────────────────

export interface CreateAnimalDto {
  tag: string
  name?: string
  type: AnimalType
  breed?: string
  gender: Gender
  weight?: number
  status?: AnimalStatus
  notes?: string
  farmId?: string
}

export interface UpdateAnimalDto extends Partial<CreateAnimalDto> {}

export interface CreateMilkDto {
  animalId: string
  date: string
  morning?: number
  evening?: number
  notes?: string
  farmId?: string
}

export interface CreateSaleDto {
  type: SaleType
  date: string
  quantity: number
  unit?: string
  pricePerUnit: number
  buyer?: string
  notes?: string
  farmId?: string
}

export interface CreateExpenseDto {
  category: ExpenseCategory
  description: string
  date: string
  amount: number
  supplier?: string
  notes?: string
  farmId?: string
}

export interface CreateEmployeeDto {
  name: string
  role?: string
  salary?: number
  phone?: string
  startDate: string
  status?: EmployeeStatus
  notes?: string
  farmId?: string
}

export interface CreatePaymentDto {
  employeeId: string
  amount: number
  date: string
  type?: PaymentType
  notes?: string
}

export interface CreateFarmDto {
  name: string
  location?: string
  hectares?: number
  description?: string
}

export interface CreateCalendarEventDto {
  title: string
  description?: string
  eventType: EventType
  date: string
  animalId?: string
  farmId?: string
}

export interface UpdateCalendarEventDto extends Partial<CreateCalendarEventDto> {
  status?: EventStatus
}

export interface ICalendarRepository {
  findAll(filters?: { farmIds?: string[]; month?: string; year?: number }): Promise<CalendarEvent[]>
  findById(id: string): Promise<CalendarEvent | null>
  create(data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'animal'>): Promise<CalendarEvent>
  update(id: string, data: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'animal'>>): Promise<CalendarEvent>
  delete(id: string): Promise<void>
}

// ── New Module Types ──────────────────────────────────────────────────────────

export type WeightRecord = {
  id: string
  animalId: string
  date: string
  weight: number
  notes: string | null
  farmId?: string | null
  createdAt: string
  animal?: { tag: string; name: string | null }
}

export type HealthEventType = 'VACCINATION' | 'TREATMENT' | 'DEWORMING' | 'EXAMINATION'
export type HealthEventStatus = 'DONE' | 'SCHEDULED'

export interface HealthEvent {
  id: string
  animalId?: string | null
  farmId?: string | null
  type: HealthEventType
  title: string
  date: string
  dose?: string | null
  product?: string | null
  veterinarian?: string | null
  withdrawalDays: number
  withdrawalEndDate?: string | null
  famacha?: number | null
  notes?: string | null
  status: HealthEventStatus
  createdAt: string
  animal?: { tag: string; name: string | null } | null
}

export type ReproductionEventType = 'INSEMINATION' | 'PREGNANCY_CHECK' | 'CALVING' | 'DRY_OFF'
export type ReproductionResult = 'PREGNANT' | 'OPEN' | 'POSITIVE' | 'NEGATIVE'

export interface ReproductionEvent {
  id: string
  animalId: string
  farmId?: string | null
  type: ReproductionEventType
  date: string
  result?: ReproductionResult | null
  bullId?: string | null
  calvingDate?: string | null
  calfId?: string | null
  daysOpen?: number | null
  notes?: string | null
  createdAt: string
  animal?: { tag: string; name: string | null }
}

export type MilkStockMovementType = 'ENTRY' | 'EXIT'
export type MilkStockReason = 'PRODUCTION' | 'SALE' | 'DISCARD' | 'OWN_CONSUMPTION'

export interface MilkStockMovement {
  id: string
  farmId?: string | null
  date: string
  type: MilkStockMovementType
  reason: MilkStockReason
  quantity: number
  saleId?: string | null
  notes?: string | null
  createdAt: string
}

export type WoolQuality = 'FINE' | 'MEDIUM' | 'COARSE'

export interface ShearingRecord {
  id: string
  animalId: string
  farmId?: string | null
  date: string
  woolWeight: number
  quality?: WoolQuality | null
  serviceProvider?: string | null
  costPerAnimal: number
  notes?: string | null
  createdAt: string
  animal?: { tag: string; name: string | null }
}

export interface CreateWeightDto {
  animalId: string; date: string; weight: number; notes?: string; farmId?: string
}
export interface CreateHealthEventDto {
  animalId?: string; farmId?: string; type: HealthEventType; title: string; date: string
  dose?: string; product?: string; veterinarian?: string; withdrawalDays?: number
  famacha?: number; notes?: string; status?: HealthEventStatus
}
export interface CreateReproductionEventDto {
  animalId: string; farmId?: string; type: ReproductionEventType; date: string
  result?: ReproductionResult; bullId?: string; notes?: string
}
export interface CreateMilkStockMovementDto {
  farmId?: string; date: string; type: MilkStockMovementType; reason: MilkStockReason
  quantity: number; saleId?: string; notes?: string
}
export interface CreateShearingRecordDto {
  animalId: string; farmId?: string; date: string; woolWeight: number
  quality?: WoolQuality; serviceProvider?: string; costPerAnimal?: number; notes?: string
}

export interface IWeightRepository {
  findByAnimal(animalId: string): Promise<WeightRecord[]>
  findAll(farmIds?: string[]): Promise<WeightRecord[]>
  create(data: CreateWeightDto): Promise<WeightRecord>
}
export interface IHealthRepository {
  findAll(filters?: { farmIds?: string[]; animalId?: string }): Promise<HealthEvent[]>
  create(data: CreateHealthEventDto): Promise<HealthEvent>
  delete(id: string): Promise<void>
}
export interface IReproductionRepository {
  findByAnimal(animalId: string): Promise<ReproductionEvent[]>
  findAll(farmIds?: string[]): Promise<ReproductionEvent[]>
  create(data: CreateReproductionEventDto): Promise<ReproductionEvent>
}
export interface IMilkStockRepository {
  getBalance(farmIds?: string[]): Promise<number>
  findMovements(farmIds?: string[]): Promise<MilkStockMovement[]>
  addEntry(data: CreateMilkStockMovementDto): Promise<MilkStockMovement>
  addExit(data: CreateMilkStockMovementDto): Promise<MilkStockMovement>
}
export interface IShearingRepository {
  findByAnimal(animalId: string): Promise<ShearingRecord[]>
  findAll(farmIds?: string[]): Promise<ShearingRecord[]>
  create(data: CreateShearingRecordDto): Promise<ShearingRecord>
}
