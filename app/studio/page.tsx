import type { Metadata } from 'next'
import { OhMyAsciiStudio } from '@/components/studio/ohmyascii-studio'

const description =
  'The full ohmyascii editor: sources, looks, a world composer, a 3D modeller, AI generation, share links and code / PNG / video export.'

export const metadata: Metadata = {
  title: 'Studio',
  description,
  alternates: { canonical: '/studio' },
  openGraph: { title: 'ohmyascii studio', description, type: 'website', url: '/studio' },
  twitter: { card: 'summary_large_image', title: 'ohmyascii studio', description },
}

export default function Page() {
  return <OhMyAsciiStudio />
}
