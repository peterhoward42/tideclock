// @ts-check
import { describe, expect, it } from 'vitest'
import { heightAt, nextHigh, trendAt } from '../../application/tideModel.js'

describe('tideModel (skeleton)', () => {
  it('returns neutral height with no extremes', () => {
    expect(heightAt(new Date(), [])).toBe(0)
  })

  it('returns neutral trend with no extremes', () => {
    expect(trendAt(new Date(), [])).toBe(0)
  })

  it('returns null next high with no extremes', () => {
    expect(nextHigh(new Date(), [])).toBeNull()
  })
})
