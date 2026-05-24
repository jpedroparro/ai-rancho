export function RanchIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* ── Linhas de campo em perspectiva ── */}
      {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(x => (
        <line key={x} x1={12} y1={15} x2={x} y2={24} />
      ))}

      {/* ── Cerca esquerda (3 trilhos + 2 mourões) ── */}
      <line x1="0"   y1="11"   x2="3.5" y2="11"  />
      <line x1="0"   y1="12.5" x2="3.5" y2="12.5"/>
      <line x1="0"   y1="14"   x2="3.5" y2="14"  />
      <line x1="1"   y1="10"   x2="1"   y2="15"  />
      <line x1="3"   y1="10"   x2="3"   y2="15"  />

      {/* ── Cerca direita (3 trilhos + 2 mourões) ── */}
      <line x1="20.5" y1="11"   x2="24" y2="11"  />
      <line x1="20.5" y1="12.5" x2="24" y2="12.5"/>
      <line x1="20.5" y1="14"   x2="24" y2="14"  />
      <line x1="21"   y1="10"   x2="21" y2="15"  />
      <line x1="23"   y1="10"   x2="23" y2="15"  />

      {/* ── Ala esquerda do celeiro (menor) ── */}
      <rect x="3" y="10" width="9" height="5" />
      {/* Telhado levemente inclinado subindo para a direita */}
      <polyline points="2.5,10.5 3,9.5 12,9" />
      {/* Janela dupla */}
      <rect x="4" y="11" width="7" height="3" rx="0.3" />
      <line x1="7.5" y1="11" x2="7.5" y2="14" />

      {/* ── Celeiro principal / ala direita (mais alto) ── */}
      <rect x="11" y="8" width="10" height="7" />
      {/* Telhado gambrel — dois planos em cada lado */}
      <polyline points="10,8 12.5,5 16,3 19.5,5 22,8" />
      {/* Linha de quebra do gambrel */}
      <line x1="12.5" y1="5" x2="19.5" y2="5" />
      {/* Janela na trapeira */}
      <rect x="14" y="5.5" width="4" height="2" rx="0.3" />
      {/* Porta dupla */}
      <rect x="13.5" y="10.5" width="5" height="4.5" rx="0.3" />
      <line x1="16" y1="10.5" x2="16" y2="15" />
    </svg>
  )
}
