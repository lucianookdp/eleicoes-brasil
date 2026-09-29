import { z } from 'zod';

/**
 * Runtime schemas for the TSE 2026 result files (EA11, EA12, EA14, EA15, EA16, EA20).
 * Source: "Divulgação de Resultados — Especificação de Arquivo" PDFs published at
 * https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados
 * (EA11/EA20 of 23/06 and 10/07/2026, EA14/EA15 of 10/06/2026).
 *
 * Design rules:
 * - Objects are loose: new fields added by the TSE must not break ingestion.
 * - Only fields we actually read are declared; structural ones are required.
 * - The spec types every value as text ("{inteiro}", "{decimal}" with comma), but we accept
 *   numbers too and normalise in the adapter.
 */

const scalar = z.union([z.string(), z.number()]);
const opt = scalar.nullish();
const code = scalar.transform(String);

export const sectionsSchema = z.looseObject({
  ts: opt,
  st: opt,
  pst: opt,
  pstn: opt,
  snt: opt,
  si: opt,
  sni: opt,
  sa: opt,
  sna: opt,
});

export const electorateSchema = z.looseObject({
  te: opt,
  est: opt,
  esi: opt,
  esni: opt,
  c: opt,
  pc: opt,
  pcn: opt,
  a: opt,
  pa: opt,
  pan: opt,
});

// EA11 — ele-c.json
export const electionConfigFileSchema = z.looseObject({
  dg: z.string().nullish(),
  hg: z.string().nullish(),
  idg: opt,
  f: z.string().nullish(),
  arq: z.array(z.looseObject({ tp: z.string(), dir: z.string() })).nullish(),
  pl: z.array(
    z.looseObject({
      cd: code,
      cdpr: opt,
      c: z.string().nullish(),
      dt: z.string().nullish(),
      e: z.array(
        z.looseObject({
          cd: code,
          cdt2: opt,
          nm: z.string().nullish(),
          t: code,
          tp: code,
          abr: z.array(
            z.looseObject({
              cd: z.string(),
              mu: z.array(z.looseObject({ cd: code, cdi: opt })).nullish(),
              cp: z.array(z.looseObject({ cd: code, ds: z.string(), tp: code })).nullish(),
            }),
          ),
        }),
      ),
    }),
  ),
});
export type ElectionConfigFile = z.infer<typeof electionConfigFileSchema>;

// EA12 — mun-e<eleicao>-cm.json
export const cityConfigFileSchema = z.looseObject({
  dg: z.string().nullish(),
  hg: z.string().nullish(),
  idg: opt,
  abr: z.array(
    z.looseObject({
      cd: z.string(),
      ds: z.string().nullish(),
      mu: z.array(
        z.looseObject({
          cd: code,
          cdi: opt,
          nm: z.string(),
          c: z.string().nullish(),
          z: z.array(code).nullish(),
        }),
      ),
    }),
  ),
});
export type CityConfigFile = z.infer<typeof cityConfigFileSchema>;

// EA14 / EA15 — <br|uf>-e<eleicao>-ab.json
export const progressEntrySchema = z.looseObject({
  and: z.string().nullish(),
  tpabr: z.string(),
  cdabr: code,
  dt: z.string().nullish(),
  ht: z.string().nullish(),
  s: sectionsSchema.nullish(),
  e: electorateSchema.nullish(),
});
export const progressFileSchema = z.looseObject({
  ele: code,
  t: opt,
  f: z.string().nullish(),
  dg: z.string().nullish(),
  hg: z.string().nullish(),
  idg: opt,
  abr: z.array(progressEntrySchema),
});
export type ProgressFile = z.infer<typeof progressFileSchema>;
export type ProgressEntry = z.infer<typeof progressEntrySchema>;

// EA20 — resultado unificado
const runningMateSchema = z.looseObject({
  tp: z.string().nullish(),
  sqcand: opt,
  nm: z.string().nullish(),
  nmu: z.string().nullish(),
  sgp: z.string().nullish(),
});

export const candidateSchema = z.looseObject({
  n: code,
  sqcand: opt,
  nm: z.string().nullish(),
  nmu: z.string().nullish(),
  dvt: z.string().nullish(),
  seq: opt,
  e: z.string().nullish(),
  st: z.string().nullish(),
  vap: opt,
  pvap: opt,
  pvapn: opt,
  vs: z.array(runningMateSchema).nullish(),
});

export const partySchema = z.looseObject({
  n: code,
  sg: z.string().nullish(),
  nm: z.string().nullish(),
  nfed: opt,
  dvt: z.string().nullish(),
  tvtn: opt,
  tvtl: opt,
  tvan: opt,
  tval: opt,
  vag: opt,
  cand: z.array(candidateSchema).nullish(),
});

export const groupSchema = z.looseObject({
  n: opt,
  nm: z.string().nullish(),
  tp: z.string().nullish(),
  com: z.string().nullish(),
  vag: opt,
  par: z.array(partySchema).nullish(),
});

export const federationSchema = z.looseObject({
  n: opt,
  nm: z.string().nullish(),
  sg: z.string().nullish(),
  com: z.string().nullish(),
});

export const resultFileSchema = z.looseObject({
  ele: code,
  t: opt,
  f: z.string().nullish(),
  tpabr: z.string(),
  cdabr: code,
  dg: z.string().nullish(),
  hg: z.string().nullish(),
  idg: opt,
  dv: z.string().nullish(),
  dt: z.string().nullish(),
  ht: z.string().nullish(),
  tf: z.string().nullish(),
  and: z.string().nullish(),
  md: z.string().nullish(),
  esae: z.string().nullish(),
  mnae: z.array(z.string()).nullish(),
  carg: z
    .array(
      z.looseObject({
        cd: code,
        nmn: z.string().nullish(),
        nv: opt,
        fed: z.array(federationSchema).nullish(),
        agr: z.array(groupSchema).nullish(),
      }),
    )
    .nullish(),
  s: sectionsSchema.nullish(),
  e: electorateSchema.nullish(),
  v: z
    .looseObject({
      tv: opt,
      vvc: opt,
      vv: opt,
      vnom: opt,
      vl: opt,
      van: opt,
      vansj: opt,
      vb: opt,
      tvn: opt,
      vn: opt,
      vnt: opt,
    })
    .nullish(),
});
export type ResultFile = z.infer<typeof resultFileSchema>;

// EA16 — <uf>-p<pleito>-cs.json
export const sectionConfigFileSchema = z.looseObject({
  dg: z.string().nullish(),
  hg: z.string().nullish(),
  abr: z.array(
    z.looseObject({
      cd: z.string(),
      mu: z.array(
        z.looseObject({
          cd: code,
          nm: z.string().nullish(),
          zon: z.array(
            z.looseObject({
              cd: code,
              sec: z.array(
                z.looseObject({
                  ns: code,
                  nsp: opt,
                  nsa: z.array(code).nullish(),
                  da: z.string().nullish(),
                  ha: z.string().nullish(),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  ),
});
export type SectionConfigFile = z.infer<typeof sectionConfigFileSchema>;

/** "1234" | 1234 → 1234. Anything else → null (never NaN). */
export function toInt(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const s = v.trim();
  return /^-?\d+$/.test(s) ? Number.parseInt(s, 10) : null;
}

/** "48,43" | "48.431234567" | 48.43 → 48.43. Anything else → null. */
export function toDec(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = v.trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number.parseFloat(s);
}
