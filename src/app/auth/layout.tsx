export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      {/* Dark gradient overlay — melhora legibilidade sem matar a foto */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(160deg, rgba(5,8,3,0.62) 0%, rgba(8,14,5,0.45) 45%, rgba(4,10,3,0.72) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}
