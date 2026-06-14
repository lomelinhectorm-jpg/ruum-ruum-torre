import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'  // ← Esta línea es CRUCIAL

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Ruum Ruum Admin | By MoviliaX',
  description: 'Plataforma administrativa para gestión de viajes, conductores y evidencias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${inter.className} h-screen flex overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}