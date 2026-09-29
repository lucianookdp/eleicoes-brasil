export const STATES = [
  { code: 'AC', name: 'Acre', region: 'Norte', ibge: '12' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste', ibge: '27' },
  { code: 'AP', name: 'Amapá', region: 'Norte', ibge: '16' },
  { code: 'AM', name: 'Amazonas', region: 'Norte', ibge: '13' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste', ibge: '29' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste', ibge: '23' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', ibge: '53' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste', ibge: '32' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste', ibge: '52' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste', ibge: '21' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', ibge: '51' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', ibge: '50' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste', ibge: '31' },
  { code: 'PA', name: 'Pará', region: 'Norte', ibge: '15' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste', ibge: '25' },
  { code: 'PR', name: 'Paraná', region: 'Sul', ibge: '41' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste', ibge: '26' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste', ibge: '22' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', ibge: '33' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', ibge: '24' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul', ibge: '43' },
  { code: 'RO', name: 'Rondônia', region: 'Norte', ibge: '11' },
  { code: 'RR', name: 'Roraima', region: 'Norte', ibge: '14' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul', ibge: '42' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste', ibge: '35' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste', ibge: '28' },
  { code: 'TO', name: 'Tocantins', region: 'Norte', ibge: '17' },
  /** Votes cast abroad. Only the presidential race has them. */
  { code: 'ZZ', name: 'Exterior', region: 'Exterior', ibge: '' },
] as const;

export type StateCode = (typeof STATES)[number]['code'];
export type State = (typeof STATES)[number];

const byCode = new Map<string, State>(STATES.map((s) => [s.code, s]));

export function isStateCode(value: string): value is StateCode {
  return byCode.has(value.toUpperCase());
}

export function getState(code: string): State | undefined {
  return byCode.get(code.toUpperCase());
}

export function stateName(code: string): string {
  return getState(code)?.name ?? code.toUpperCase();
}

/** The 26 states + DF, i.e. without the "abroad" pseudo-state. */
export const DOMESTIC_STATES = STATES.filter((s) => s.code !== 'ZZ');
