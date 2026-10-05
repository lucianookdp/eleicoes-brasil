/** Pure helpers for the Bancadas page (kept apart from JSX so they are unit-tested). */

/** Senate size is fixed by the Constitution: 3 senators for each state and the Federal District. */
export const SENATORS = 81;

/**
 * How many votes each decision needs, straight from the Constitution (CF/88). Counted over each
 * chamber's full membership, so it does not change from one vote to the next.
 */
export function thresholds(deputies: number) {
  const majority = (n: number) => Math.floor(n / 2) + 1;
  const share = (n: number, num: number, den: number) => Math.ceil((n * num) / den);
  return [
    {
      what: 'Votar uma lei comum',
      note: 'presença mínima; aprova com a maioria dos presentes',
      camara: majority(deputies),
      senado: majority(SENATORS),
      source: 'CF, art. 47',
    },
    {
      what: 'Aprovar uma lei complementar',
      camara: majority(deputies),
      senado: majority(SENATORS),
      source: 'CF, art. 69',
    },
    {
      what: 'Derrubar um veto do presidente',
      camara: majority(deputies),
      senado: majority(SENATORS),
      source: 'CF, art. 66, § 4º',
    },
    {
      what: 'Abrir uma CPI (assinaturas)',
      camara: share(deputies, 1, 3),
      senado: share(SENATORS, 1, 3),
      source: 'CF, art. 58, § 3º',
    },
    {
      what: 'Mudar a Constituição (PEC), em dois turnos em cada Casa',
      camara: share(deputies, 3, 5),
      senado: share(SENATORS, 3, 5),
      source: 'CF, art. 60, § 2º',
    },
    {
      what: 'Impeachment do presidente: a Câmara autoriza, o Senado julga',
      camara: share(deputies, 2, 3),
      senado: share(SENATORS, 2, 3),
      source: 'CF, arts. 51, 52 e 86',
    },
  ];
}

export function seatPositions(n: number) {
  const rows = Math.max(2, Math.round(Math.sqrt(n / 4)));
  const inner = 0.38;
  const radii = Array.from({ length: rows }, (_, i) => inner + ((1 - inner) * i) / (rows - 1));
  const sum = radii.reduce((a, r) => a + r, 0);
  const counts = radii.map((r) => Math.floor((n * r) / sum));
  // Leftover seats go to the outer rows, which have the most room.
  for (
    let i = rows - 1, left = n - counts.reduce((a, c) => a + c, 0);
    left > 0;
    i = (i - 1 + rows) % rows, left--
  )
    counts[i]!++;
  const points = radii.flatMap((r, row) => {
    const k = counts[row]!;
    return Array.from({ length: k }, (_, j) => {
      const a = Math.PI * (k === 1 ? 0.5 : 1 - j / (k - 1));
      return { x: r * Math.cos(a), y: -r * Math.sin(a), a, r };
    });
  });
  // Sweep from the left end to the right end so each bench forms one wedge.
  points.sort((p, q) => q.a - p.a || q.r - p.r);
  const gapRow = (1 - inner) / (rows - 1);
  const gapArc = (Math.PI * 1) / Math.max(1, counts[rows - 1]! - 1);
  return { points, r: Math.min(gapRow, gapArc) * 0.42 };
}
