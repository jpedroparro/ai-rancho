import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { FarmProvider } from '@/contexts/FarmContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  return (
    <FarmProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header />
          <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {children}
          </main>
        </div>
      </div>
    </FarmProvider>
  )
}
