import './globals.css';
import type { Metadata } from 'next';
import StorefrontLayoutWrapper from '@/components/ui/StorefrontLayoutWrapper';

export const metadata: Metadata = {
  title: 'KAKOS MENSWEAR | Streetwear Urbain Cameroun',
  description: 'Streetwear premium et minimaliste pour l\'homme contemporain au Cameroun. Livraison express à Douala & Yaoundé. Paiement à la livraison.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kakos-store.vercel.app'),
  openGraph: {
    title: 'KAKOS MENSWEAR | Streetwear Urbain Cameroun',
    description: 'Streetwear premium et minimaliste pour l\'homme contemporain au Cameroun. Livraison express à Douala & Yaoundé. Paiement à la livraison.',
    url: 'https://kakos-store.vercel.app',
    siteName: 'KAKOS MENSWEAR',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 675,
        alt: 'KAKOS MENSWEAR Urban Monolith Streetwear',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAKOS MENSWEAR | Streetwear Urbain Cameroun',
    description: 'Streetwear premium pour l\'homme urbain contemporain au Cameroun.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-sans antialiased min-h-screen flex flex-col selection:bg-[#00F0FF] selection:text-primary">
        <StorefrontLayoutWrapper>
          {children}
        </StorefrontLayoutWrapper>
      </body>
    </html>
  );
}
