// @ts-check
import { afterEach, describe, expect, it } from 'vitest'
import { loadTideExtremes, resetTideServiceForTests } from '../../application/tideService.js'

describe('tideService (skeleton)', () => {
  afterEach(() => {
    resetTideServiceForTests()
  })

  it('resolves to an array', async () => {
    const extremes = await loadTideExtremes(Date.now())
    expect(Array.isArray(extremes)).toBe(true)
  })
})
