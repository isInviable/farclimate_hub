import { describe, expect, it } from 'vitest'
import { siteNavHomeItem, siteNavItems } from '~/constants/siteNav'

describe('siteNav', () => {
  it('lists the six sections in design order with their colors and routes', () => {
    expect(siteNavItems.map(item => item.key)).toEqual([
      'solutions',
      'howTo',
      'stories',
      'training',
      'network',
      'about',
    ])
    expect(siteNavItems.map(item => item.to)).toEqual([
      '/explorer/',
      '/how-to',
      '/stories',
      '/skills',
      '/connected',
      '/about',
    ])
    expect(siteNavItems.map(item => item.bgClass)).toEqual([
      'bg-adapt-orange',
      'bg-adapt-blue',
      'bg-adapt-aqua',
      'bg-adapt-brown',
      'bg-adapt-yellow',
      'bg-adapt-mist',
    ])
  })

  it('points the home item at the root', () => {
    expect(siteNavHomeItem.to).toBe('/')
    expect(siteNavHomeItem.labelKey).toBe('siteNav.home')
  })
})
