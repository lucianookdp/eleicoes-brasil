import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aggregateOpenData, splitCsvLine } from '../src/history/open-data';

const dir = join(import.meta.dirname, 'fixtures', 'open-data');
const files = (prefix: string) => ['SP', 'BA'].map((uf) => join(dir, `${prefix}_1998_${uf}.csv`));

describe('open data importer', () => {
  it('splits quoted ";" lines', () => {
    expect(splitCsvLine('"a";"b;c";"d ""x"""')).toEqual(['a', 'b;c', 'd "x"']);
  });

  it('aggregates zones into city, state and country, per round', async () => {
    const [r1, r2] = await aggregateOpenData(
      files('votacao_candidato_munzona'),
      files('detalhe_votacao_munzona'),
    );
    expect(r1!.round).toBe(1);
    expect(r1!.date).toBe('1998-10-04');
    expect(r2!.round).toBe(2);

    const br = r1!.results.get('1|br')!;
    const ana = br.candidates.find((c) => c.number === '91')!;
    expect(ana.votes).toBe(1200); // 600 + 400 (SP) + 200 (BA)
    expect(ana.ballotName).toBe('ANA EXEMPLO'); // Latin-1 decoded
    expect(ana.status).toBe('2º Turno');
    expect(ana.elected).toBe(true);
    expect(br.votes.valid).toBe(2000); // from the detail file
    expect(br.votes.blank).toBe(80);
    expect(ana.percent).toBeCloseTo(60);

    expect(r1!.results.get('1|sp-71072')!.candidates.find((c) => c.number === '91')!.votes).toBe(1000);
    expect(r1!.cities.get('SP-71072')?.name).toBe('SÃO PAULO');

    const progress = r1!.progress.get('br')!.progress;
    expect(progress).toMatchObject({
      status: 'finished',
      sectionsTotal: 9,
      electorateTotal: 2600,
      turnout: 2180,
    });
  });

  it('ignores supplementary elections and keeps governors out of national totals', async () => {
    const [r1] = await aggregateOpenData(files('votacao_candidato_munzona'), []);
    const gov = r1!.results.get('3|sp')!;
    expect(gov.candidates.map((c) => c.ballotName)).toEqual(['CARLA TESTE']);
    expect(r1!.results.has('3|br')).toBe(false);
    expect(r1!.offices.map((o) => o.slug)).toEqual(['presidente', 'governador']);
  });
});
