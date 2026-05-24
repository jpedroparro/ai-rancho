'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Beef, Droplets, Milk, ShoppingCart, Receipt,
  Users, TrendingUp, BarChart3, ChevronLeft, ChevronRight, Tractor, CalendarDays,
  Package, Target, FlaskConical,
} from 'lucide-react'
import { RanchIcon } from '@/components/RanchIcon'
import { useState } from 'react'

const SECTIONS = [
  {
    label: 'VISÃO GERAL',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
      { href: '/farms',     icon: Tractor,          label: 'Fazendas'     },
    ],
  },
  {
    label: 'PRODUÇÃO',
    items: [
      { href: '/animals', icon: Beef,     label: 'Animais'   },
      { href: '/dairy',   icon: Milk,     label: 'Leiteira'  },
      { href: '/milk',    icon: Droplets, label: 'Produção'  },
    ],
  },
  {
    label: 'FINANCEIRO',
    items: [
      { href: '/sales',     icon: ShoppingCart, label: 'Vendas'     },
      { href: '/expenses',  icon: Receipt,      label: 'Despesas'   },
      { href: '/financial', icon: TrendingUp,   label: 'Financeiro' },
    ],
  },
  {
    label: 'GESTÃO',
    items: [
      { href: '/employees',       icon: Users,        label: 'Funcionários'  },
      { href: '/calendar',        icon: CalendarDays, label: 'Calendário'    },
      { href: '/inventory',       icon: Package,      label: 'Estoque'       },
      { href: '/production-cost', icon: FlaskConical, label: 'Custo Prod.'   },
      { href: '/goals',           icon: Target,       label: 'Metas'         },
      { href: '/reports',         icon: BarChart3,    label: 'Relatórios'    },
    ],
  },
]

const BRAND    = '#4ade80'
const BRAND_DIM = 'rgba(74,222,128,'

export default function Sidebar() {
  const pathname   = usePathname()
  const [col, setCol] = useState(false)

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <aside style={{
      width: col ? 58 : 222,
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      /* Subtle tech grid on dark green base */
      background: `
        linear-gradient(${BRAND_DIM}.035) 1px,transparent 1px),
        linear-gradient(90deg,${BRAND_DIM}.035) 1px,transparent 1px),
        #080f08
      `,
      backgroundSize: '26px 26px, 26px 26px, auto',
      borderRight: `1px solid ${BRAND_DIM}.1)`,
      overflow: 'hidden',
    }}>

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div style={{
        height: col ? 62 : 78,
        padding: col ? '0' : '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: col ? 'center' : 'flex-start',
        gap: 12,
        borderBottom: `1px solid ${BRAND_DIM}.08)`,
        transition: 'height .25s',
        flexShrink: 0,
      }}>
        {/* Leaf icon badge */}
        <div style={{
          width: 38, height: 38,
          background: 'linear-gradient(145deg,#14381a,#1e5c22)',
          borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 18px ${BRAND_DIM}.22), 0 0 6px ${BRAND_DIM}.15)`,
          border: `1px solid ${BRAND_DIM}.2)`,
        }}>
          <RanchIcon size={19} color={BRAND}/>
        </div>

        {!col && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#d0f0d0',
              lineHeight: 1.1,
            }}>
              AI.RANCHO
            </div>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.12em',
              color: `${BRAND_DIM}.35)`,
              marginTop: 2,
              fontWeight: 500,
            }}>
              GESTÃO RURAL INTELIGENTE
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: col ? '10px 0' : '8px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {SECTIONS.map(({ label, items }) => (
          <div key={label}>
            {/* Section label */}
            {!col ? (
              <div style={{
                padding: '14px 8px 4px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.13em',
                color: `${BRAND_DIM}.28)`,
                userSelect: 'none',
              }}>
                {label}
              </div>
            ) : (
              /* Collapsed: thin separator */
              <div style={{
                height: 1,
                margin: '8px 10px',
                background: `${BRAND_DIM}.1)`,
              }}/>
            )}

            {items.map(({ href, icon: Icon, label: lbl }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={col ? lbl : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: col ? '10px 0' : '8px 10px',
                    justifyContent: col ? 'center' : 'flex-start',
                    borderRadius: col ? 0 : 7,
                    color: active ? BRAND : `${BRAND_DIM}.42)`,
                    background: active ? `${BRAND_DIM}.1)` : 'transparent',
                    borderLeft: !col
                      ? `3px solid ${active ? BRAND : 'transparent'}`
                      : `2px solid ${active ? BRAND : 'transparent'}`,
                    textDecoration: 'none',
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                    boxShadow: active && !col ? `inset 0 0 24px ${BRAND_DIM}.05)` : 'none',
                    letterSpacing: active ? '0.01em' : '0',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = `${BRAND_DIM}.06)`
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <Icon
                    size={18}
                    style={{ flexShrink: 0, color: active ? BRAND : `${BRAND_DIM}.45)` }}
                  />
                  {!col && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</span>
                  )}
                  {/* Active dot indicator (expanded mode) */}
                  {active && !col && (
                    <div style={{
                      marginLeft: 'auto',
                      width: 5, height: 5,
                      borderRadius: '50%',
                      background: BRAND,
                      boxShadow: `0 0 6px ${BRAND}`,
                      flexShrink: 0,
                    }}/>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Status indicator ─────────────────────────────────────── */}
      <div style={{
        padding: col ? '10px 0' : '10px 14px',
        borderTop: `1px solid ${BRAND_DIM}.08)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: col ? 'center' : 'flex-start',
        gap: 7,
        flexShrink: 0,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: BRAND,
          boxShadow: `0 0 8px ${BRAND}, 0 0 3px ${BRAND}`,
          flexShrink: 0,
        }}/>
        {!col && (
          <span style={{ fontSize: 9.5, color: `${BRAND_DIM}.35)`, letterSpacing: '0.1em', fontWeight: 600 }}>
            SISTEMA ONLINE
          </span>
        )}
      </div>

      {/* ── Collapse toggle ──────────────────────────────────────── */}
      <button
        onClick={() => setCol(!col)}
        style={{
          margin: col ? '0 auto 12px' : '0 8px 12px',
          width: col ? 38 : '100%',
          height: 30,
          borderRadius: 7,
          background: `${BRAND_DIM}.06)`,
          border: `1px solid ${BRAND_DIM}.12)`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: col ? 'center' : 'flex-end',
          paddingRight: col ? 0 : 10,
          color: `${BRAND_DIM}.38)`,
          transition: 'all .2s',
          flexShrink: 0,
        }}
      >
        {col
          ? <ChevronRight size={13}/>
          : <><span style={{ fontSize: 9.5, marginRight: 6, letterSpacing: '0.08em', fontWeight: 600 }}>RECOLHER</span><ChevronLeft size={13}/></>
        }
      </button>
    </aside>
  )
}
