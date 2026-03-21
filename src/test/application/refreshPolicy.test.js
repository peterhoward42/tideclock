// @ts-check
import { describe, expect, it } from 'vitest'
import { shouldRefresh } from '../../application/refreshPolicy.js'

describe('refreshPolicy (skeleton)', () => {
  it('requests refresh when nothing cached', () => {
    expect(shouldRefresh(null, 0)).toBe(true)
  })

  it('does not refresh once a cache timestamp exists', () => {
    expect(shouldRefresh(1, 999)).toBe(false)
  })
})
