import type { AreaResult, CountingProgress } from './domain';

export interface QualityIssue {
  code: string;
  message: string;
  severity: 'warning' | 'error';
}

function checkNumber(issues: QualityIssue[], label: string, v: number | null) {
  if (v == null) return;
  if (!Number.isFinite(v))
    issues.push({ code: 'not-finite', message: `${label} is not a finite number`, severity: 'error' });
  else if (v < 0)
    issues.push({ code: 'negative', message: `${label} is negative (${v})`, severity: 'error' });
}

function checkPct(issues: QualityIssue[], label: string, v: number | null) {
  if (v == null) return;
  if (!Number.isFinite(v) || v < 0 || v > 100.0001) {
    issues.push({ code: 'percent-range', message: `${label} out of range (${v})`, severity: 'error' });
  }
}

export function checkProgress(p: CountingProgress): QualityIssue[] {
  const issues: QualityIssue[] = [];
  checkNumber(issues, 'sectionsTotal', p.sectionsTotal);
  checkNumber(issues, 'sectionsCounted', p.sectionsCounted);
  checkNumber(issues, 'electorateTotal', p.electorateTotal);
  checkNumber(issues, 'turnout', p.turnout);
  checkNumber(issues, 'abstention', p.abstention);
  checkPct(issues, 'sectionsCountedPct', p.sectionsCountedPct);
  checkPct(issues, 'turnoutPct', p.turnoutPct);
  if (p.sectionsTotal != null && p.sectionsCounted != null && p.sectionsCounted > p.sectionsTotal) {
    issues.push({
      code: 'counted-exceeds-total',
      message: `sections counted (${p.sectionsCounted}) > total (${p.sectionsTotal})`,
      severity: 'error',
    });
  }
  if (p.electorateTotal != null && p.turnout != null && p.turnout > p.electorateTotal) {
    issues.push({ code: 'turnout-exceeds-electorate', message: 'turnout > electorate', severity: 'error' });
  }
  if (p.status !== 'not-started' && p.totalizedAt == null) {
    issues.push({
      code: 'missing-timestamp',
      message: 'in progress but no totalization time',
      severity: 'warning',
    });
  }
  return issues;
}

export function checkResult(r: AreaResult): QualityIssue[] {
  const issues = checkProgress(r.progress);
  for (const [k, v] of Object.entries(r.votes)) checkNumber(issues, `votes.${k}`, v);
  const seen = new Set<string>();
  let sum = 0;
  for (const c of r.candidates) {
    checkNumber(issues, `candidate ${c.number} votes`, c.votes);
    checkPct(issues, `candidate ${c.number} percent`, c.percent);
    if (!c.key)
      issues.push({
        code: 'candidate-without-id',
        message: `candidate ${c.number} has no id`,
        severity: 'error',
      });
    if (seen.has(c.key))
      issues.push({ code: 'duplicate-candidate', message: `duplicate ${c.key}`, severity: 'error' });
    seen.add(c.key);
    sum += c.votes;
  }
  if (r.votes.total != null && sum > r.votes.total) {
    issues.push({
      code: 'candidate-sum-exceeds-total',
      message: `candidate votes (${sum}) > total votes (${r.votes.total})`,
      severity: 'error',
    });
  }
  return issues;
}

export const hasErrors = (issues: QualityIssue[]) => issues.some((i) => i.severity === 'error');
