import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'HealthNav',
    description: 'Find verified healthcare providers across California',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f4c81',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['health', 'medical'],
    shortcuts: [
      {
        name: 'Search Providers',
        url: '/search',
        description: 'Search for healthcare providers',
      },
      {
        name: 'Near Me',
        url: '/ca/near-me',
        description: 'Find providers near your location',
      },
      {
        name: 'Bookmarks',
        url: '/bookmarks',
        description: 'Your saved providers',
      },
    ],
  };
}
