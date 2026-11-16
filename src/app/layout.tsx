import './globals.css';
import type { Metadata } from 'next';
import StorefrontLayoutWrapper from '@/components/ui/StorefrontLayoutWrapper';
import { createSupabasePublicClient } from '@/lib/supabase-public';
import type { StoreCategory } from '@/components/ui/Header';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kakos.store';
const description = 'Mode, chaussures, sacs, parfums et essentiels au meilleur prix. Commandez KAKOS en ligne avec livraison au Cameroun.';

export const metadata: Metadata = {
  title: { default: 'KAKOS | Shopping & mode au Cameroun', template: '%s | KAKOS' },
  description,
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  keywords: ['shopping Cameroun', 'mode Cameroun', 'chaussures femme', 'sacs', 'parfums', 'vêtements', 'KAKOS'],
  openGraph: {
    title: 'KAKOS | Shopping & mode au Cameroun',
    description,
    url: siteUrl,
    siteName: 'KAKOS',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 675,
        alt: 'KAKOS — shopping et mode au Cameroun',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAKOS | Shopping & mode au Cameroun',
    description,
    images: ['/og-image.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: StoreCategory[] = [];
  try {
    const supabase = createSupabasePublicClient();
    const { data } = await supabase.from('categories').select('name, slug').order('name');
    categories = data || [];
  } catch (error) {
    console.error('Failed to load navigation categories:', error);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'KAKOS',
    url: siteUrl,
    description,
    telephone: '+237697259094',
    areaServed: 'CM',
  };

  return (
    <html lang="fr" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-sans antialiased min-h-screen flex flex-col selection:bg-[#00F0FF] selection:text-primary">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <StorefrontLayoutWrapper categories={categories}>
          {children}
        </StorefrontLayoutWrapper>
      </body>
    </html>
  );
}
