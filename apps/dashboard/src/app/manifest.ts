import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'X-Scraper',
    short_name: 'X-Scraper',
    description: 'Internal lead extraction engine',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#121212',
    icons: [
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
