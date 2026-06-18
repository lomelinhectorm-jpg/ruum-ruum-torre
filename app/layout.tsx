import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Ruum Ruum Torre de Control | By MoviliaX',
  description: 'Plataforma administrativa para gestión de viajes, conductores y evidencias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} h-screen flex overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
