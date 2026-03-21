// @ts-check
import { describe, expect, it } from 'vitest'
import { buildDialFrame } from '../../geometry/dialGeometry.js'

describe('dialGeometry (skeleton)', () => {
  it('builds concentric frame radii', () => {
    const f = buildDialFrame(100, 120, 40)
    expect(f.cx).toBe(100)
    expect(f.cy).toBe(120)
    expect(f.outerR).toBe(40)
    expect(f.innerR).toBe(40 * 0.55)
  })
})
