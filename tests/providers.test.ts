import { describe, it, expect } from 'vitest'
import { detectProvider, PROVIDERS } from '../src/providers/registry'
import { YouTubeProvider } from '../src/providers/YouTubeProvider'
import { UdemyProvider } from '../src/providers/UdemyProvider'
import { CourseraProvider } from '../src/providers/CourseraProvider'
import { SkillshareProvider } from '../src/providers/SkillshareProvider'
import { NetflixProvider } from '../src/providers/NetflixProvider'
import { PrimeVideoProvider } from '../src/providers/PrimeVideoProvider'

describe('Video Providers & URL Matching', () => {
  it('should match YouTube URLs correctly', () => {
    const yt = new YouTubeProvider()
    expect(yt.matches('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(yt.matches('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(yt.matches('https://m.youtube.com/watch?v=123')).toBe(true)
    expect(yt.matches('https://vimeo.com/123')).toBe(false)
  })

  it('should match Udemy URLs correctly', () => {
    const udemy = new UdemyProvider()
    expect(udemy.matches('https://www.udemy.com/course/react-the-complete-guide/learn/lecture/12345')).toBe(true)
    expect(udemy.matches('https://youtube.com')).toBe(false)
  })

  it('should match Coursera URLs correctly', () => {
    const coursera = new CourseraProvider()
    expect(coursera.matches('https://www.coursera.org/learn/machine-learning/lecture/xyz')).toBe(true)
  })

  it('should match Skillshare, Netflix, and Prime Video URLs', () => {
    const skillshare = new SkillshareProvider()
    expect(skillshare.matches('https://www.skillshare.com/classes/Graphic-Design/123')).toBe(true)

    const netflix = new NetflixProvider()
    expect(netflix.matches('https://www.netflix.com/watch/80012345')).toBe(true)

    const prime = new PrimeVideoProvider()
    expect(prime.matches('https://www.primevideo.com/detail/0XYZ')).toBe(true)
    expect(prime.matches('https://www.amazon.com/gp/video/detail/0XYZ')).toBe(true)
  })

  it('detectProvider should resolve correct provider by URL', () => {
    const yt = detectProvider('https://www.youtube.com/watch?v=abc')
    expect(yt?.siteId).toBe('youtube')

    const ud = detectProvider('https://www.udemy.com/course/abc/123')
    expect(ud?.siteId).toBe('udemy')

    const cr = detectProvider('https://www.coursera.org/learn/abc')
    expect(cr?.siteId).toBe('coursera')
  })
})
