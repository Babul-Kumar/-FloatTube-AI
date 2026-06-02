import type { VideoProvider } from './VideoProvider'
import { YouTubeProvider } from './YouTubeProvider'
import { UdemyProvider } from './UdemyProvider'
import { CourseraProvider } from './CourseraProvider'
import { NetflixProvider } from './NetflixProvider'
import { PrimeVideoProvider } from './PrimeVideoProvider'
import { SkillshareProvider } from './SkillshareProvider'
import { GenericHTML5Provider } from './GenericHTML5Provider'

const PROVIDERS: VideoProvider[] = [
  new YouTubeProvider(),
  new UdemyProvider(),
  new CourseraProvider(),
  new NetflixProvider(),
  new PrimeVideoProvider(),
  new SkillshareProvider(),
  // GenericHTML5Provider is always last (fallback)
  new GenericHTML5Provider(),
]

export function detectProvider(url: string = window.location.href): VideoProvider | null {
  for (const provider of PROVIDERS) {
    if (provider.matches(url) && provider.siteId !== 'generic') {
      return provider
    }
  }
  // Try generic fallback: only if there is a video element
  const generic = new GenericHTML5Provider()
  if (generic.getVideo()) return generic
  return null
}

export function getSiteLabel(provider: VideoProvider | null): string {
  return provider?.name ?? 'Unknown Site'
}

export { PROVIDERS }
