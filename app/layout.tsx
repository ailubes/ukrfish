import type { Metadata } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'UKRFISH',
  description: 'Громадська спілка "Риба України"',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
