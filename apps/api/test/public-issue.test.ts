import { describe, expect, it } from 'vitest';
import { publicIssue } from '../src/queries';

describe('publicIssue', () => {
  const internal = 'Falha interna da coleta; nova tentativa automática.';

  it('keeps the source’s own errors, which say what is going on', () => {
    expect(publicIssue('source.unavailable', 'blocked by source (HTTP 403)')).toBe(
      'blocked by source (HTTP 403)',
    );
    expect(publicIssue(null, 'circuit open until 2026-10-25T22:00:00.000Z')).toBe(
      'circuit open until 2026-10-25T22:00:00.000Z',
    );
    expect(publicIssue('source.unavailable', 'fetch failed: ECONNRESET')).toBe('fetch failed: ECONNRESET');
  });

  it('never shows our internal errors, such as a failed SQL query', () => {
    expect(publicIssue('collector.error', 'Error: connect ECONNREFUSED 10.0.0.5:5432')).toBe(internal);
    expect(
      publicIssue(
        null,
        'Error: Failed query: select "checksum", "counted_pct" from "area_results" where ...',
      ),
    ).toBe(internal);
    expect(publicIssue(null, 'PostgresError: terminating connection due to administrator command')).toBe(
      internal,
    );
  });

  it('nothing to show stays empty', () => {
    expect(publicIssue('source.schema', null)).toBeNull();
  });
});
