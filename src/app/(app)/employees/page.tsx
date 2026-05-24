'use client'
import { useEffect, useState } from 'react'
import { Plus, X, DollarSign } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const EMPTY_EMP = { name: '', role: '', salary: '', phone: '', startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE', notes: '' }
const EMPTY_PAY = { employeeId: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'SALARY', notes: '' }

export default function EmployeesPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [employees, setEmployees] = useState<any[]>([])
  const [showEmpModal, setShowEmpModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_EMP)
  const [payForm, setPayForm] = useState<any>(EMPTY_PAY)
  const [editId, setEditId] = useState<string | null>(null)

  const load = () => fetch('/api/employees' + farmParam).then(r => r.json()).then(setEmployees)
  useEffect(() => { load() }, [farmParam])

  const saveEmp = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, salary: parseFloat(form.salary), farmId: selectedFarmId }
    if (editId) await fetch('/api/employees/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    else await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setShowEmpModal(false); setForm(EMPTY_EMP); setEditId(null); load()
  }

  const savePay = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }) })
    setShowPayModal(false); setPayForm(EMPTY_PAY); load()
  }

  const deactivate = async (id: string) => {
    if (!confirm('Desativar funcionário?')) return
    await fetch('/api/employees/' + id, { method: 'DELETE' }); load()
  }

  const active = employees.filter(e => e.status === 'ACTIVE')
  const totalSalary = active.reduce((s, e) => s + e.salary, 0)

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Funcionários</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{active.length} ativos · Folha: R$ {totalSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowPayModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16} /> Registrar Pagamento
          </button>
          <button className="btn-primary" onClick={() => { setForm(EMPTY_EMP); setEditId(null); setShowEmpModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Novo Funcionário
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {employees.map(e => (
          <div key={e.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{e.role}</p>
              </div>
              <span className={`badge ${e.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{e.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              {e.phone && <p>📞 {e.phone}</p>}
              <p>💰 R$ {e.salary.toFixed(2)}/mês</p>
              <p>📅 Desde {new Date(e.startDate).toLocaleDateString('pt-BR')}</p>
              {e.payments?.length > 0 && <p style={{ color: 'var(--brand)' }}>✓ Último pagamento: {new Date(e.payments[0].date).toLocaleDateString('pt-BR')}</p>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: '0.875rem' }}>
              <button className="btn-secondary" onClick={() => { setForm({...e, salary: e.salary.toString(), startDate: e.startDate.split('T')[0]}); setEditId(e.id); setShowEmpModal(true) }} style={{ padding: '4px 10px', fontSize: 12, flex: 1 }}>Editar</button>
              {e.status === 'ACTIVE' && <button className="btn-danger" onClick={() => deactivate(e.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Desativar</button>}
            </div>
          </div>
        ))}
      </div>

      {showEmpModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{editId ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
              <button onClick={() => setShowEmpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={saveEmp} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Nome *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Cargo</label><input value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
                <div className="form-group"><label>Salário (R$)</label><input type="number" step="0.01" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} /></div>
                <div className="form-group"><label>Telefone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label>Data de Entrada</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEmpModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Registrar Pagamento</h2>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={savePay} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group"><label>Funcionário *</label>
                <select value={payForm.employeeId} onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value)
                  setPayForm({...payForm, employeeId: e.target.value, amount: emp?.salary?.toString() || ''})
                }} required>
                  <option value="">Selecionar...</option>
                  {active.map(e => <option key={e.id} value={e.id}>{e.name} — R$ {e.salary.toFixed(2)}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required /></div>
                <div className="form-group"><label>Data</label><input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} required /></div>
                <div className="form-group"><label>Tipo</label>
                  <select value={payForm.type} onChange={e => setPayForm({...payForm, type: e.target.value})}>
                    <option value="SALARY">Salário</option><option value="BONUS">Bônus</option><option value="ADVANCE">Adiantamento</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Notas</label><input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
