/**
 * Supreme Court (STF) composition, kept by hand: it changes only when a minister leaves or a new
 * one takes office. Names, roles, posse dates and the two panels (turmas) come from the STF's own
 * page; who appointed each minister is public record (the STF's "Linha Sucessória" table).
 * When it changes: update this list and `checkedAt`.
 */
export const STF_CHECKED_AT = '2026-10-05';
export const STF_SOURCE = 'https://portal.stf.jus.br/ostf/';

export interface Minister {
  name: string;
  /** President of the Republic who appointed them. */
  appointedBy: string;
  /** Date they took office at the STF (dd/mm/aaaa, as the STF publishes it). */
  since: string;
  role?: 'Presidente' | 'Vice-presidente' | 'Decano';
  /** The STF's President chairs the plenary and sits on neither panel. */
  panel: '1ª Turma' | '2ª Turma' | null;
  panelChair?: boolean;
}

/**
 * Photos: public, freely licensed portraits from Wikimedia Commons (mostly by the STF and Agência
 * Brasil), saved as small thumbnails in /public/stf. Each one is credited on the page.
 */
export const PHOTOS: Record<string, { author: string; license: string; page: string }> = {
  'gilmar-mendes': {
    author: 'Fabio Rodrigues Pozzebom/ABr',
    license: 'CC BY 3.0 br',
    page: 'https://commons.wikimedia.org/wiki/File:Gilmar_Mendes_(cropped).jpg',
  },
  'carmen-lucia': {
    author: 'Marcelo Camargo/Agência Brasil',
    license: 'CC BY 3.0 br',
    page: 'https://commons.wikimedia.org/wiki/File:C%C3%A1rmen_L%C3%BAcia_em_2016_02_(cropped_3x4).jpg',
  },
  'dias-toffoli': {
    author: 'Geraldo Magela/Agência Senado',
    license: 'CC BY 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Toffoli_aniversario_da_constitui%C3%A7%C3%A3o.jpg',
  },
  'luiz-fux': {
    author: 'Rosinei Coutinho/STF',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:19.12.2025_-_Luiz_Fux.jpg',
  },
  'edson-fachin': {
    author: 'Marcelo Camargo/Agência Brasil',
    license: 'CC BY 3.0 br',
    page: 'https://commons.wikimedia.org/wiki/File:Luiz_Edson_Fachin-12-05.2015.jpg',
  },
  'alexandre-de-moraes': {
    author: 'Isac Nóbrega',
    license: 'CC BY 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Ministro_Alexandre_de_Moraes_como_presidente_do_TSE.jpg',
  },
  'nunes-marques': {
    author: 'TSE - Tribunal Superior Eleitoral',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Nunes_Marques,_February_2025_(cropped).jpg',
  },
  'andre-mendonca': {
    author: 'Rosinei Coutinho/STF',
    license: 'Attribution',
    page: 'https://commons.wikimedia.org/wiki/File:Ministro_Andr%C3%A9_Mendon%C3%A7a_em_outubro_de_2025_(3x4).jpg',
  },
  'cristiano-zanin': {
    author: 'Rosinei Coutinho/STF',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:17.06.2026_-_Cristiano_Zanin_(cropped).jpg',
  },
  'flavio-dino': {
    author: 'Gustavo Moreno/STF',
    license: 'Attribution',
    page: 'https://commons.wikimedia.org/wiki/File:Fl%C3%A1vio_Dino_no_voto_da_A%C3%A7%C3%A3o_Penal_(AP)_2668_(cropped).jpg',
  },
};

/** File name of a minister's photo: "Cármen Lúcia" → "carmen-lucia". */
export const photoSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '-');

/** In order of seniority (date of posse), as the STF lists them. */
export const MINISTERS: Minister[] = [
  {
    name: 'Gilmar Mendes',
    appointedBy: 'Fernando Henrique Cardoso',
    since: '20/06/2002',
    role: 'Decano',
    panel: '2ª Turma',
  },
  { name: 'Cármen Lúcia', appointedBy: 'Lula', since: '21/06/2006', panel: '1ª Turma' },
  { name: 'Dias Toffoli', appointedBy: 'Lula', since: '23/10/2009', panel: '2ª Turma' },
  {
    name: 'Luiz Fux',
    appointedBy: 'Dilma Rousseff',
    since: '03/03/2011',
    panel: '2ª Turma',
    panelChair: true,
  },
  {
    name: 'Edson Fachin',
    appointedBy: 'Dilma Rousseff',
    since: '16/06/2015',
    role: 'Presidente',
    panel: null,
  },
  {
    name: 'Alexandre de Moraes',
    appointedBy: 'Michel Temer',
    since: '22/03/2017',
    role: 'Vice-presidente',
    panel: '1ª Turma',
  },
  { name: 'Nunes Marques', appointedBy: 'Jair Bolsonaro', since: '05/11/2020', panel: '2ª Turma' },
  { name: 'André Mendonça', appointedBy: 'Jair Bolsonaro', since: '16/12/2021', panel: '2ª Turma' },
  { name: 'Cristiano Zanin', appointedBy: 'Lula', since: '03/08/2023', panel: '1ª Turma' },
  { name: 'Flávio Dino', appointedBy: 'Lula', since: '22/02/2024', panel: '1ª Turma', panelChair: true },
];

/** Open seats: the Constitution sets 11 ministers. */
export const VACANCIES = [{ reason: 'aposentadoria do ministro Luís Roberto Barroso, em outubro de 2025' }];

/** How many current ministers each President appointed, most first. */
export function byPresident(list = MINISTERS) {
  const counts = new Map<string, number>();
  for (const m of list) counts.set(m.appointedBy, (counts.get(m.appointedBy) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
