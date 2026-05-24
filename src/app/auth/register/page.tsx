'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RanchIcon } from '@/components/RanchIcon'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', farmName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/auth/login?registered=1')
    } else {
      setError(data.error || 'Erro ao criar conta')
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name',     label: 'Nome completo',   type: 'text',     placeholder: 'João Silva',        required: true },
    { key: 'email',    label: 'Email',            type: 'email',    placeholder: 'joao@fazenda.com',  required: true },
    { key: 'farmName', label: 'Nome da Fazenda',  type: 'text',     placeholder: 'Fazenda São José',  required: false },
    { key: 'password', label: 'Senha',            type: 'password', placeholder: '••••••••',          required: true },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 52, height: 52, background: 'var(--brand)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <RanchIcon size={24} color="white" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#e8f0e8' }}>Criar conta</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4 }}>Comece a gerenciar sua fazenda</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.75rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {fields.map(f => (
            <div key={f.key} className="form-group">
              <label style={{ color: 'rgba(255,255,255,0.65)' }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e8f0e8' }}
              />
            </div>
          ))}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, background: 'var(--danger-pale)', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.7rem', marginTop: 4 }}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Já tem conta?{' '}
          <Link href="/auth/login" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
