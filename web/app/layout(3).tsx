import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZoonoseApp — Dashboard',
  description: 'Painel de controle da vigilância de zoonoses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 font-sans">{children}</body>
    </html>
  )
}
