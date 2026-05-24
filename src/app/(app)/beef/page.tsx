import { redirect } from 'next/navigation'

// Bovinos são gerenciados pela página unificada de Animais
export default function BeefRedirect() {
  redirect('/animals?type=BEEF')
}
