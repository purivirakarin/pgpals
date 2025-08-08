import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PGPals Bingo - Telegram Mini App",
  description: "Prince George's Park Pair Activities - A fun bingo game for PGP residents",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pgpals-bingo.vercel.app'),
  icons: {
    icon: '/pgpals-logo.png',
    apple: '/pgpals-logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PGPals Bingo',
  },
  openGraph: {
    title: 'PGPals Bingo - Telegram Mini App',
    description: 'Prince George\'s Park Pair Activities - A fun bingo game for PGP residents',
    images: ['/pgpals-logo.png'],
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#059669" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
