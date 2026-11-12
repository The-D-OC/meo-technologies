export const SITE = {
  name: 'Meo Technologies',
  shortName: 'Meo',
  // Legal owner / data controller — must match the App Store & Google Play developer name.
  legalName: "D'arcy O'Connor",
  tagline: 'Software, built to move your business.',
  description:
    'Meo Technologies is a London software development company building custom software, iOS & Android apps, web platforms and AI automation for businesses.',
  // Update these before going live.
  email: 'info@tumbi.co.uk',
  privacyEmail: 'info@tumbi.co.uk',
  location: 'London, United Kingdom',
  locality: 'London',
  country: 'GB',
  locale: 'en_GB',
  // Social profiles — add full URLs (LinkedIn, X, GitHub…) to include them in structured data.
  sameAs: [] as string[],
  /**
   * Optional form endpoint (Formspree, Web3Forms, Basin, your own Worker…) that accepts a JSON POST.
   * Leave empty and the contact form opens the visitor's email app with their message pre-filled.
   */
  contactEndpoint: '',
} as const;

export const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#process', label: 'Process' },
  { href: '/#products', label: 'Products' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const SERVICES = [
  'Custom software development',
  'iOS and Android app development',
  'Web platform and SaaS development',
  'AI and workflow automation',
  'Cloud infrastructure and DevOps',
  'UX and product design',
] as const;
