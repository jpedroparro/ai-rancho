'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

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

interface FarmContextValue {
  farms: Farm[]
  selectedFarmId: string | null
  selectedFarm: Farm | null
  setSelectedFarmId: (id: string | null) => void
  reloadFarms: () => Promise<void>
  farmParam: string // query string fragment e.g. "?farmId=xxx" or ""
}

const FarmContext = createContext<FarmContextValue>({
  farms: [],
  selectedFarmId: null,
  selectedFarm: null,
  setSelectedFarmId: () => {},
  reloadFarms: async () => {},
  farmParam: '',
})

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(null)

  const reloadFarms = useCallback(async () => {
    try {
      const res = await fetch('/api/farms')
      if (!res.ok) return
      const data: Farm[] = await res.json()
      setFarms(data)
      // Restore persisted selection or default to first farm
      const stored = localStorage.getItem('selectedFarmId')
      if (stored && data.some(f => f.id === stored)) {
        setSelectedFarmIdState(stored)
      } else if (data.length > 0 && !stored) {
        setSelectedFarmIdState(data[0].id)
        localStorage.setItem('selectedFarmId', data[0].id)
      }
    } catch {}
  }, [])

  useEffect(() => { reloadFarms() }, [reloadFarms])

  const setSelectedFarmId = (id: string | null) => {
    setSelectedFarmIdState(id)
    if (id) localStorage.setItem('selectedFarmId', id)
    else localStorage.removeItem('selectedFarmId')
  }

  const selectedFarm = farms.find(f => f.id === selectedFarmId) ?? null
  const farmParam = selectedFarmId ? `?farmId=${selectedFarmId}` : ''

  return (
    <FarmContext.Provider value={{ farms, selectedFarmId, selectedFarm, setSelectedFarmId, reloadFarms, farmParam }}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm() {
  return useContext(FarmContext)
}
