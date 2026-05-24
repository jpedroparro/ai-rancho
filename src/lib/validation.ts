type ValidationResult = { ok: true } | { ok: false; error: string }

function required(value: any, field: string): string | null {
  if (value === undefined || value === null || value === '') return `${field} é obrigatório`
  return null
}

function isPositiveNumber(value: any, field: string): string | null {
  const n = Number(value)
  if (isNaN(n) || n < 0) return `${field} deve ser um número positivo`
  return null
}

function isValidDate(value: any, field: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${field} deve ser uma data válida (YYYY-MM-DD)`
  return null
}

function isOneOf(value: any, allowed: string[], field: string): string | null {
  if (!allowed.includes(value)) return `${field} inválido`
  return null
}

function firstError(...errors: (string | null)[]): ValidationResult {
  const err = errors.find(e => e !== null)
  return err ? { ok: false, error: err } : { ok: true }
}

// ── Validators ────────────────────────────────────────────────────────────────

export function validateAnimal(data: any): ValidationResult {
  return firstError(
    required(data.tag, 'Tag'),
    required(data.type, 'Tipo'),
    isOneOf(data.type, ['DAIRY', 'SHEEP', 'BEEF'], 'Tipo'),
    isOneOf(data.gender ?? 'FEMALE', ['MALE', 'FEMALE'], 'Gênero'),
    isOneOf(data.status ?? 'ACTIVE', ['ACTIVE', 'SOLD', 'DEAD'], 'Status'),
    data.weight != null ? isPositiveNumber(data.weight, 'Peso') : null
  )
}

export function validateMilkRecord(data: any): ValidationResult {
  return firstError(
    required(data.animalId, 'Animal'),
    required(data.date, 'Data'),
    isValidDate(data.date, 'Data'),
    data.morning != null ? isPositiveNumber(data.morning, 'Manhã') : null,
    data.evening != null ? isPositiveNumber(data.evening, 'Tarde') : null
  )
}

export function validateSale(data: any): ValidationResult {
  return firstError(
    required(data.type, 'Tipo'),
    isOneOf(data.type, ['MILK', 'ANIMAL', 'WOOL', 'MEAT'], 'Tipo'),
    required(data.date, 'Data'),
    isValidDate(data.date, 'Data'),
    required(data.quantity, 'Quantidade'),
    isPositiveNumber(data.quantity, 'Quantidade'),
    required(data.pricePerUnit, 'Preço unitário'),
    isPositiveNumber(data.pricePerUnit, 'Preço unitário')
  )
}

export function validateExpense(data: any): ValidationResult {
  return firstError(
    required(data.category, 'Categoria'),
    isOneOf(data.category, ['FEED', 'MEDICINE', 'EQUIPMENT', 'LABOR', 'OTHER'], 'Categoria'),
    required(data.description, 'Descrição'),
    required(data.date, 'Data'),
    isValidDate(data.date, 'Data'),
    required(data.amount, 'Valor'),
    isPositiveNumber(data.amount, 'Valor')
  )
}

export function validateEmployee(data: any): ValidationResult {
  return firstError(
    required(data.name, 'Nome'),
    required(data.startDate, 'Data de início'),
    isValidDate(data.startDate, 'Data de início'),
    data.salary != null ? isPositiveNumber(data.salary, 'Salário') : null
  )
}

export function validatePayment(data: any): ValidationResult {
  return firstError(
    required(data.employeeId, 'Funcionário'),
    required(data.amount, 'Valor'),
    isPositiveNumber(data.amount, 'Valor'),
    required(data.date, 'Data'),
    isValidDate(data.date, 'Data'),
    isOneOf(data.type ?? 'SALARY', ['SALARY', 'BONUS', 'ADVANCE'], 'Tipo')
  )
}

export function validateRegister(data: any): ValidationResult {
  return firstError(
    required(data.name, 'Nome'),
    required(data.email, 'Email'),
    required(data.password, 'Senha'),
    data.password?.length < 6 ? 'Senha deve ter no mínimo 6 caracteres' : null
  )
}
