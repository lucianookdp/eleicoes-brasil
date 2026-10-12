/**
 * Where Brazilians vote abroad and in which time zone. The results' files give only the city's
 * name; the country and the IANA time zone here are geography, kept by hand for the cities of the
 * 2026 election and checked one by one against the addresses of the polling stations (TSE,
 * "eleitorado por local de votação" 2026, file of 11 Oct 2026). Voting abroad runs from 8h to 17h
 * in each place's own time, so this is what tells when each one opens and closes in Brasília
 * time. A city missing here is simply listed without times.
 */
const PLACES: Record<string, [country: string, zone: string]> = {
  // Oceania and East Asia
  wellington: ['Nova Zelândia', 'Pacific/Auckland'],
  camberra: ['Austrália', 'Australia/Sydney'],
  sydney: ['Austrália', 'Australia/Sydney'],
  toquio: ['Japão', 'Asia/Tokyo'],
  nagoia: ['Japão', 'Asia/Tokyo'],
  hamamatsu: ['Japão', 'Asia/Tokyo'],
  seul: ['Coreia do Sul', 'Asia/Seoul'],
  dili: ['Timor-Leste', 'Asia/Dili'],
  pequim: ['China', 'Asia/Shanghai'],
  xangai: ['China', 'Asia/Shanghai'],
  cantao: ['China', 'Asia/Shanghai'],
  'hong kong': ['Hong Kong', 'Asia/Hong_Kong'],
  taipe: ['Taiwan', 'Asia/Taipei'],
  manila: ['Filipinas', 'Asia/Manila'],
  singapura: ['Singapura', 'Asia/Singapore'],
  'kuala lumpur': ['Malásia', 'Asia/Kuala_Lumpur'],
  jacarta: ['Indonésia', 'Asia/Jakarta'],
  bangkok: ['Tailândia', 'Asia/Bangkok'],
  hanoi: ['Vietnã', 'Asia/Ho_Chi_Minh'],
  // South Asia
  katmandu: ['Nepal', 'Asia/Kathmandu'],
  'nova delhi': ['Índia', 'Asia/Kolkata'],
  mumbai: ['Índia', 'Asia/Kolkata'],
  // Middle East
  'abu dhabi': ['Emirados Árabes Unidos', 'Asia/Dubai'],
  mascate: ['Omã', 'Asia/Muscat'],
  teera: ['Irã', 'Asia/Tehran'],
  doha: ['Catar', 'Asia/Qatar'],
  barein: ['Barein', 'Asia/Bahrain'],
  kuaite: ['Kuaite', 'Asia/Kuwait'],
  riade: ['Arábia Saudita', 'Asia/Riyadh'],
  ama: ['Jordânia', 'Asia/Amman'],
  damasco: ['Síria', 'Asia/Damascus'],
  beirute: ['Líbano', 'Asia/Beirut'],
  'tel aviv': ['Israel', 'Asia/Jerusalem'],
  ramallah: ['Palestina', 'Asia/Hebron'],
  nicosia: ['Chipre', 'Asia/Nicosia'],
  ancara: ['Turquia', 'Europe/Istanbul'],
  istambul: ['Turquia', 'Europe/Istanbul'],
  // Europe
  moscou: ['Rússia', 'Europe/Moscow'],
  kiev: ['Ucrânia', 'Europe/Kyiv'],
  helsinque: ['Finlândia', 'Europe/Helsinki'],
  talin: ['Estônia', 'Europe/Tallinn'],
  atenas: ['Grécia', 'Europe/Athens'],
  bucareste: ['Romênia', 'Europe/Bucharest'],
  sofia: ['Bulgária', 'Europe/Sofia'],
  estocolmo: ['Suécia', 'Europe/Stockholm'],
  oslo: ['Noruega', 'Europe/Oslo'],
  copenhague: ['Dinamarca', 'Europe/Copenhagen'],
  varsovia: ['Polônia', 'Europe/Warsaw'],
  praga: ['República Tcheca', 'Europe/Prague'],
  bratislava: ['Eslováquia', 'Europe/Bratislava'],
  budapeste: ['Hungria', 'Europe/Budapest'],
  viena: ['Áustria', 'Europe/Vienna'],
  belgrado: ['Sérvia', 'Europe/Belgrade'],
  zagreb: ['Croácia', 'Europe/Zagreb'],
  liubliana: ['Eslovênia', 'Europe/Ljubljana'],
  berlim: ['Alemanha', 'Europe/Berlin'],
  frankfurt: ['Alemanha', 'Europe/Berlin'],
  munique: ['Alemanha', 'Europe/Berlin'],
  amsterda: ['Países Baixos', 'Europe/Amsterdam'],
  bruxelas: ['Bélgica', 'Europe/Brussels'],
  paris: ['França', 'Europe/Paris'],
  marselha: ['França', 'Europe/Paris'],
  genebra: ['Suíça', 'Europe/Zurich'],
  zurique: ['Suíça', 'Europe/Zurich'],
  roma: ['Itália', 'Europe/Rome'],
  milao: ['Itália', 'Europe/Rome'],
  madri: ['Espanha', 'Europe/Madrid'],
  barcelona: ['Espanha', 'Europe/Madrid'],
  londres: ['Reino Unido', 'Europe/London'],
  edimburgo: ['Reino Unido', 'Europe/London'],
  dublin: ['Irlanda', 'Europe/Dublin'],
  lisboa: ['Portugal', 'Europe/Lisbon'],
  porto: ['Portugal', 'Europe/Lisbon'],
  faro: ['Portugal', 'Europe/Lisbon'],
  // Africa
  nairobi: ['Quênia', 'Africa/Nairobi'],
  'dar es salaam': ['Tanzânia', 'Africa/Dar_es_Salaam'],
  cairo: ['Egito', 'Africa/Cairo'],
  // Its voters vote at the embassy in Tunis, an hour behind Tripoli.
  tripoli: ['Líbia', 'Africa/Tunis'],
  maputo: ['Moçambique', 'Africa/Maputo'],
  pretoria: ['África do Sul', 'Africa/Johannesburg'],
  'cidade do cabo': ['África do Sul', 'Africa/Johannesburg'],
  windhoek: ['Namíbia', 'Africa/Windhoek'],
  luanda: ['Angola', 'Africa/Luanda'],
  lagos: ['Nigéria', 'Africa/Lagos'],
  tunis: ['Tunísia', 'Africa/Tunis'],
  argel: ['Argélia', 'Africa/Algiers'],
  rabat: ['Marrocos', 'Africa/Casablanca'],
  accra: ['Gana', 'Africa/Accra'],
  abidja: ['Costa do Marfim', 'Africa/Abidjan'],
  bissau: ['Guiné-Bissau', 'Africa/Bissau'],
  dacar: ['Senegal', 'Africa/Dakar'],
  praia: ['Cabo Verde', 'Atlantic/Cape_Verde'],
  // South America
  'buenos aires': ['Argentina', 'America/Argentina/Buenos_Aires'],
  cordoba: ['Argentina', 'America/Argentina/Cordoba'],
  mendoza: ['Argentina', 'America/Argentina/Mendoza'],
  'paso los libres': ['Argentina', 'America/Argentina/Cordoba'],
  'puerto iguazu': ['Argentina', 'America/Argentina/Cordoba'],
  montevideu: ['Uruguai', 'America/Montevideo'],
  artigas: ['Uruguai', 'America/Montevideo'],
  'rio branco': ['Uruguai', 'America/Montevideo'],
  assuncao: ['Paraguai', 'America/Asuncion'],
  'ciudad del este': ['Paraguai', 'America/Asuncion'],
  concepcion: ['Paraguai', 'America/Asuncion'],
  encarnacion: ['Paraguai', 'America/Asuncion'],
  'pedro juan caballero': ['Paraguai', 'America/Asuncion'],
  'salto del guaira': ['Paraguai', 'America/Asuncion'],
  santiago: ['Chile', 'America/Santiago'],
  paramaribo: ['Suriname', 'America/Paramaribo'],
  caiena: ['Guiana Francesa', 'America/Cayenne'],
  georgetown: ['Guiana', 'America/Guyana'],
  'la paz': ['Bolívia', 'America/La_Paz'],
  cochabamba: ['Bolívia', 'America/La_Paz'],
  'santa cruz de la sierra': ['Bolívia', 'America/La_Paz'],
  caracas: ['Venezuela', 'America/Caracas'],
  'ciudad guayana': ['Venezuela', 'America/Caracas'],
  bogota: ['Colômbia', 'America/Bogota'],
  quito: ['Equador', 'America/Guayaquil'],
  lima: ['Peru', 'America/Lima'],
  // Central America and the Caribbean
  'port of spain': ['Trinidad e Tobago', 'America/Port_of_Spain'],
  'sao domingos': ['República Dominicana', 'America/Santo_Domingo'],
  'porto principe': ['Haiti', 'America/Port-au-Prince'],
  nassau: ['Bahamas', 'America/Nassau'],
  havana: ['Cuba', 'America/Havana'],
  'kingston-jamaica': ['Jamaica', 'America/Jamaica'],
  panama: ['Panamá', 'America/Panama'],
  'sao jose': ['Costa Rica', 'America/Costa_Rica'],
  managua: ['Nicarágua', 'America/Managua'],
  tegucigalpa: ['Honduras', 'America/Tegucigalpa'],
  'sao salvador': ['El Salvador', 'America/El_Salvador'],
  guatemala: ['Guatemala', 'America/Guatemala'],
  mexico: ['México', 'America/Mexico_City'],
  // North America
  'nova york': ['Estados Unidos', 'America/New_York'],
  boston: ['Estados Unidos', 'America/New_York'],
  hartford: ['Estados Unidos', 'America/New_York'],
  washington: ['Estados Unidos', 'America/New_York'],
  atlanta: ['Estados Unidos', 'America/New_York'],
  miami: ['Estados Unidos', 'America/New_York'],
  orlando: ['Estados Unidos', 'America/New_York'],
  chicago: ['Estados Unidos', 'America/Chicago'],
  houston: ['Estados Unidos', 'America/Chicago'],
  'los angeles': ['Estados Unidos', 'America/Los_Angeles'],
  'sao francisco': ['Estados Unidos', 'America/Los_Angeles'],
  toronto: ['Canadá', 'America/Toronto'],
  ottawa: ['Canadá', 'America/Toronto'],
  montreal: ['Canadá', 'America/Toronto'],
  vancouver: ['Canadá', 'America/Vancouver'],
};

/**
 * Cities of the TSE's list where nobody votes in 2026: with fewer than 30 voters no polling
 * station is set up (TRE-DF, Editais 46 e 50/2026). The first round's files agree: no section was
 * installed in any of them.
 */
const NO_POLLS = new Set([
  'abuja',
  'adis abeba',
  'astana',
  'bagda',
  'baku',
  'bamako',
  'belmopan',
  'brazzaville',
  'bridgetown',
  'castries',
  'chuy',
  'cobija',
  'colombo',
  'conacri',
  'cotonou',
  'dacca',
  'gaborone',
  'harare',
  'iaunde',
  'ierevan',
  'iquitos',
  'islamabade',
  'kinshasa',
  'libreville',
  'lilongue',
  'lome',
  'lusaca',
  'malabo',
  'puerto quijarro',
  'pyongyang',
  'rivera',
  'saint johns',
  'santa elena de uairen',
  'sao tome',
  'sarajevo',
  'st georges de loyapock',
  'tbilisi',
  'tirana',
  'uagadugu',
  'vaticano',
  'yangon',
]);

/**
 * A city abroad is a consular district, and five of them have polling stations in another time
 * zone than the seat's. Their votes are published under the city's name; the voters here are the
 * TSE's count for those stations (same file as above).
 */
const ELSEWHERE: Record<string, { name: string; zone: string; voters: number }[]> = {
  camberra: [{ name: 'Perth', zone: 'Australia/Perth', voters: 1878 }],
  sydney: [{ name: 'Brisbane', zone: 'Australia/Brisbane', voters: 4352 }],
  'los angeles': [{ name: 'Salt Lake City', zone: 'America/Denver', voters: 2762 }],
  vancouver: [{ name: 'Calgary', zone: 'America/Edmonton', voters: 3042 }],
  toronto: [{ name: 'Winnipeg', zone: 'America/Winnipeg', voters: 822 }],
};

/** Cities with no polling station of their own: their voters vote in another town of the list. */
const VOTES_IN: Record<string, string> = {
  'ciudad guayana': 'Caracas',
  tripoli: 'Túnis',
};

/** Polls abroad: 8h to 17h in each place's own time. */
const OPENS = 8;
const CLOSES = 17;

/** Accents and case apart: "México" and "Mexico" are the same name. */
export const sameName = (a: string, b: string) => key(a) === key(b);

const key = (city: string) => city.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Minutes ahead of UTC in `zone` at that instant (daylight saving included). */
function offsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const local = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return Math.round((local - at.getTime()) / 60_000);
}

/** The instant when it is `hour` o'clock in `zone` on the calendar day `date` ("2026-10-25"). */
function instantOf(date: string, hour: number, zone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const wall = Date.UTC(y, m - 1, d, hour);
  // The offset at the first guess, then at the corrected one (a daylight-saving change that same
  // day moves it once at most).
  let at = new Date(wall - offsetMinutes(zone, new Date(wall)) * 60_000);
  at = new Date(wall - offsetMinutes(zone, at) * 60_000);
  return at;
}

export interface VotingWindow {
  country: string;
  cities: string[];
}

export interface VotingSlot {
  /** When the polls there open and close (instants). */
  opens: Date;
  closes: Date;
  places: VotingWindow[];
  voters: number;
}

export interface VotingSchedule {
  slots: VotingSlot[];
  /** Cities this table does not know. */
  unknown: string[];
  /** Cities of the list where no polling station is set up. */
  noPolls: string[];
  /** Polling stations in another time zone than their city's, listed under their own name. */
  elsewhere: { place: string; city: string }[];
  /** Cities whose voters vote in another town. */
  away: { city: string; votesIn: string }[];
}

/**
 * The places abroad grouped by when their polls open, earliest first: the order in which voting
 * goes round the world on election day.
 */
export function votingSchedule(
  cities: { name: string; voters?: number | null }[],
  date: string,
): VotingSchedule {
  const slots = new Map<number, VotingSlot & { byCountry: Map<string, string[]> }>();
  const unknown: string[] = [];
  const noPolls: string[] = [];
  const elsewhere: VotingSchedule['elsewhere'] = [];
  const away: VotingSchedule['away'] = [];
  const add = (zone: string, country: string, name: string, voters: number) => {
    const opens = instantOf(date, OPENS, zone);
    let slot = slots.get(opens.getTime());
    if (!slot) {
      slot = { opens, closes: instantOf(date, CLOSES, zone), places: [], voters: 0, byCountry: new Map() };
      slots.set(opens.getTime(), slot);
    }
    slot.voters += voters;
    slot.byCountry.set(country, [...(slot.byCountry.get(country) ?? []), name]);
  };
  for (const city of cities) {
    const id = key(city.name);
    if (NO_POLLS.has(id)) {
      noPolls.push(city.name);
      continue;
    }
    const place = PLACES[id];
    if (!place) {
      unknown.push(city.name);
      continue;
    }
    const [country, zone] = place;
    let voters = city.voters ?? 0;
    for (const far of ELSEWHERE[id] ?? []) {
      // Never more than the city has: the sum of the slots stays the city's own number.
      const theirs = Math.min(far.voters, voters);
      voters -= theirs;
      add(far.zone, country, far.name, theirs);
      elsewhere.push({ place: far.name, city: city.name });
    }
    add(zone, country, city.name, voters);
    const votesIn = VOTES_IN[id];
    if (votesIn) away.push({ city: city.name, votesIn });
  }
  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  return {
    slots: [...slots.values()]
      .sort((a, b) => a.opens.getTime() - b.opens.getTime())
      .map(({ byCountry, ...slot }) => ({
        ...slot,
        places: [...byCountry]
          .map(([country, list]) => ({ country, cities: list.sort((a, b) => a.localeCompare(b, 'pt-BR')) }))
          .sort((a, b) => a.country.localeCompare(b.country, 'pt-BR')),
      })),
    unknown: unknown.sort(byName),
    noPolls: noPolls.sort(byName),
    elsewhere: elsewhere.sort((a, b) => byName(a.place, b.place)),
    away: away.sort((a, b) => byName(a.city, b.city)),
  };
}

/** Every time zone named above, for a test to check against the runtime's own list. */
export const ABROAD_ZONES = [
  ...new Set([
    ...Object.values(PLACES).map(([, zone]) => zone),
    ...Object.values(ELSEWHERE).flatMap((list) => list.map((far) => far.zone)),
  ]),
];
export const ABROAD_CITIES = Object.keys(PLACES);
