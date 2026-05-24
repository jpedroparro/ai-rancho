'use client'
import { signOut, useSession } from 'next-auth/react'
import { Sun, Moon, LogOut, User, ChevronDown, Tractor } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useFarm } from '@/contexts/FarmContext'
import Link from 'next/link'

export default function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const { farms, selectedFarm, setSelectedFarmId } = useFarm()

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {title && <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>}

        {farms.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              value={selectedFarm?.id ?? ''}
              onChange={e => setSelectedFarmId(e.target.value || null)}
              style={{
                appearance: 'none',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '5px 30px 5px 10px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                minWidth: 140,
              }}
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        )}

        {farms.length === 0 && (
          <Link href="/farms" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--brand)', textDecoration: 'none', border: '1px dashed var(--brand)', borderRadius: 8, padding: '5px 10px' }}>
            <Tractor size={14} /> Criar fazenda
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="white" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
