export const SITE = {
  name: 'Meo Technologies',
  tagline: 'Software, built to move your business.',
  description:
    'Meo Technologies designs and builds custom software, mobile apps, web platforms and AI tools for ambitious businesses.',
  // Update these before going live.
  email: 'hello@meotechnologies.com',
  privacyEmail: 'privacy@meotechnologies.com',
  location: 'London, United Kingdom',
} as const;

export const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#process', label: 'Process' },
  { href: '/#products', label: 'Products' },
  { href: '/#contact', label: 'Contact' },
] as const;
