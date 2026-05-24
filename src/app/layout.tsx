import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Find California Healthcare Providers`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Search NPI-verified healthcare providers across California. Filter by specialty, city, Medicare, and telehealth. Data sourced from CMS NPPES.',
  keywords: [
    'California healthcare providers',
    'find doctors California',
    'NPI provider directory',
    'Medicare doctors California',
    'telehealth providers CA',
    'CMS NPPES California',
  ],
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>

        <main id="main-content">{children}</main>

        {/* Global disclaimer footer */}
        <div
          role="contentinfo"
          aria-label="Medical disclaimer"
          className="border-t border-gray-100 bg-gray-50 px-6 py-4"
        >
          <p className="mx-auto max-w-6xl text-center text-xs leading-relaxed text-gray-400">
            <strong className="font-semibold text-gray-500">Medical Disclaimer:</strong> This
            directory is for informational purposes only and is not a substitute for professional
            medical advice, diagnosis, or treatment.{' '}
            <strong className="font-semibold text-gray-500">
              Always call the provider to confirm availability, insurance acceptance, and
              appointment details
            </strong>{' '}
            before visiting. Provider data sourced from the{' '}
            <abbr title="Centers for Medicare & Medicaid Services National Provider Identifier">
              CMS NPPES
            </abbr>{' '}
            registry and may not reflect the most current information. &copy;{' '}
            {new Date().getFullYear()} {SITE_NAME}.
          </p>
        </div>
      </body>
    </html>
  );
}
