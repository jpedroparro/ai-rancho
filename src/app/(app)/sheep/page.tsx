import { redirect } from 'next/navigation'

// Ovinos são gerenciados pela página unificada de Animais
export default function SheepRedirect() {
  redirect('/animals?type=SHEEP')
}
