// Plataformas de rideshare + mapa de logos redondos en /logos/
export const PLATFORMS = [
  'Uber',
  'Lyft',
  'Empower',
  'TBZI',
  'Gallant',
  'Aventus',
  'Classic',
  'EcoRide',
  'Aki',
  'Island City',
  'Transit Tax',
  'Throo',
  'Brakha',
  'Other'
];

// Mapa plataforma -> ruta del logo (PNG salvo donde solo existe JPG/SVG)
export const LOGO_SRC: Record<string, string> = {
  Uber: '/logos/uber.png',
  Lyft: '/logos/lyft.png',
  Empower: '/logos/empower.png',
  TBZI: '/logos/tbzi.jpg',
  Gallant: '/logos/gallant.png',
  Aventus: '/logos/aventus.png',
  Classic: '/logos/classic.png',
  EcoRide: '/logos/ecoride.png',
  Aki: '/logos/aki.png',
  'Island City': '/logos/islandcity.jpg',
  'Transit Tax': '/logos/transittax.png',
  Throo: '/logos/throo.jpg',
  Brakha: '/logos/brakha.jpg',
  Other: '/logos/other.svg'
};

export const logoFor = (platform: string | null | undefined): string =>
  LOGO_SRC[platform || ''] || LOGO_SRC.Other;