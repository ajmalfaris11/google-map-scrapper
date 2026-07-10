import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'X-Scraper',
    short_name: 'X-Scraper',
    description: 'Internal lead extraction engine',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffffff',
    theme_color: '#0052ff',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
