// @ts-check
import { describe, expect, it } from 'vitest'
import { resolveBuildCommitShort } from './resolveBuildCommitShort.mjs'

describe('resolveBuildCommitShort', () => {
  it('prefers VERCEL_GIT_COMMIT_SHA and truncates to seven lowercase hex chars', () => {
    expect(
      resolveBuildCommitShort({
        env: {
          VERCEL_GIT_COMMIT_SHA: 'ABCDEF1234567890',
          GITHUB_SHA: '0000000',
        },
        revParseShort: () => 'deadbeef',
      }),
    ).toBe('abcdef1')
  })

  it('accepts a seven-character CI SHA as-is', () => {
    expect(
      resolveBuildCommitShort({
        env: { VERCEL_GIT_COMMIT_SHA: 'AbCdEf1' },
        revParseShort: () => 'should-not-run',
      }),
    ).toBe('abcdef1')
  })

  it('falls through to CF_PAGES_COMMIT_SHA then GITHUB_SHA', () => {
    expect(
      resolveBuildCommitShort({
        env: {
          CF_PAGES_COMMIT_SHA: 'fedcba9876543210fedcba9876543210fedcba98',
        },
        revParseShort: () => 'ignored',
      }),
    ).toBe('fedcba9')

    expect(
      resolveBuildCommitShort({
        env: { GITHUB_SHA: '1234567890abcdef1234567890abcdef12345678' },
        revParseShort: () => 'ignored',
      }),
    ).toBe('1234567')
  })

  it('ignores invalid CI values and uses revParseShort', () => {
    expect(
      resolveBuildCommitShort({
        env: { VERCEL_GIT_COMMIT_SHA: 'not-a-sha' },
        revParseShort: () => 'a1b2c3d',
      }),
    ).toBe('a1b2c3d')
  })

  it('returns empty string when CI and git are unavailable', () => {
    expect(
      resolveBuildCommitShort({
        env: {},
        revParseShort: () => '',
      }),
    ).toBe('')
  })
})
