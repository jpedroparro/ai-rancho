import { NextResponse } from 'next/server'
import { withAuth, notFound } from '@/lib/api-guard'
import { createAnimalService } from '@/lib/services/animal'
import { createMilkService } from '@/lib/services/milk'

type Ctx = { params: { id: string } }

export const GET = withAuth<Ctx>(async (_req, { params }) => {
  const animal = await createAnimalService().getAnimalById(params.id)
  if (!animal) return notFound()

  const records = await createMilkService().getRecordsByAnimal(params.id)
  return NextResponse.json(records)
})
