import './globals.css';
import type { Metadata } from 'next';
import StorefrontLayoutWrapper from '@/components/ui/StorefrontLayoutWrapper';

export const metadata: Metadata = {
  title: 'KAKOS MENSWEAR | Urban Monolith',
  description: 'Streetwear premium et minimaliste pour l\'homme contemporain au Cameroun. Ventes exclusives, pulls, sweats, t-shirts, et ensembles.',
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
