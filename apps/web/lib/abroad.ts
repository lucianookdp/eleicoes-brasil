/**
 * Where Brazilians vote abroad and in which time zone. The TSE's files give only the city's name;
 * the country and the IANA time zone here are geography, kept by hand for the cities of the 2026
 * election. Voting abroad runs from 8h to 17h in each place's own time, so this is what tells
 * when each one opens and closes in Brasília time. A city missing here is simply listed without
 * times.
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
  pyongyang: ['Coreia do Norte', 'Asia/Pyongyang'],
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
  yangon: ['Mianmar', 'Asia/Yangon'],
  // South and Central Asia
  dacca: ['Bangladesh', 'Asia/Dhaka'],
  katmandu: ['Nepal', 'Asia/Kathmandu'],
  'nova delhi': ['Índia', 'Asia/Kolkata'],
  mumbai: ['Índia', 'Asia/Kolkata'],
  colombo: ['Sri Lanka', 'Asia/Colombo'],
  islamabade: ['Paquistão', 'Asia/Karachi'],
  astana: ['Cazaquistão', 'Asia/Almaty'],
  // Middle East and the Caucasus
  'abu dhabi': ['Emirados Árabes Unidos', 'Asia/Dubai'],
  mascate: ['Omã', 'Asia/Muscat'],
  baku: ['Azerbaijão', 'Asia/Baku'],
  ierevan: ['Armênia', 'Asia/Yerevan'],
  tbilisi: ['Geórgia', 'Asia/Tbilisi'],
  teera: ['Irã', 'Asia/Tehran'],
  doha: ['Catar', 'Asia/Qatar'],
  barein: ['Barein', 'Asia/Bahrain'],
  kuaite: ['Kuaite', 'Asia/Kuwait'],
  riade: ['Arábia Saudita', 'Asia/Riyadh'],
  bagda: ['Iraque', 'Asia/Baghdad'],
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
  sarajevo: ['Bósnia e Herzegovina', 'Europe/Sarajevo'],
  zagreb: ['Croácia', 'Europe/Zagreb'],
  liubliana: ['Eslovênia', 'Europe/Ljubljana'],
  tirana: ['Albânia', 'Europe/Tirane'],
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
  vaticano: ['Vaticano', 'Europe/Rome'],
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
  'adis abeba': ['Etiópia', 'Africa/Addis_Ababa'],
  'dar es salaam': ['Tanzânia', 'Africa/Dar_es_Salaam'],
  cairo: ['Egito', 'Africa/Cairo'],
  tripoli: ['Líbia', 'Africa/Tripoli'],
  maputo: ['Moçambique', 'Africa/Maputo'],
  harare: ['Zimbábue', 'Africa/Harare'],
  lusaca: ['Zâmbia', 'Africa/Lusaka'],
  lilongue: ['Malaui', 'Africa/Blantyre'],
  gaborone: ['Botsuana', 'Africa/Gaborone'],
  pretoria: ['África do Sul', 'Africa/Johannesburg'],
  'cidade do cabo': ['África do Sul', 'Africa/Johannesburg'],
  windhoek: ['Namíbia', 'Africa/Windhoek'],
  kinshasa: ['República Democrática do Congo', 'Africa/Kinshasa'],
  brazzaville: ['República do Congo', 'Africa/Brazzaville'],
  luanda: ['Angola', 'Africa/Luanda'],
  libreville: ['Gabão', 'Africa/Libreville'],
  malabo: ['Guiné Equatorial', 'Africa/Malabo'],
  iaunde: ['Camarões', 'Africa/Douala'],
  abuja: ['Nigéria', 'Africa/Lagos'],
  lagos: ['Nigéria', 'Africa/Lagos'],
  cotonou: ['Benin', 'Africa/Porto-Novo'],
  tunis: ['Tunísia', 'Africa/Tunis'],
  argel: ['Argélia', 'Africa/Algiers'],
  rabat: ['Marrocos', 'Africa/Casablanca'],
  lome: ['Togo', 'Africa/Lome'],
  accra: ['Gana', 'Africa/Accra'],
  uagadugu: ['Burkina Faso', 'Africa/Ouagadougou'],
  abidja: ['Costa do Marfim', 'Africa/Abidjan'],
  bamako: ['Mali', 'Africa/Bamako'],
  conacri: ['Guiné', 'Africa/Conakry'],
  bissau: ['Guiné-Bissau', 'Africa/Bissau'],
  dacar: ['Senegal', 'Africa/Dakar'],
  'sao tome': ['São Tomé e Príncipe', 'Africa/Sao_Tome'],
  praia: ['Cabo Verde', 'Atlantic/Cape_Verde'],
  // South America
  'buenos aires': ['Argentina', 'America/Argentina/Buenos_Aires'],
  cordoba: ['Argentina', 'America/Argentina/Cordoba'],
  mendoza: ['Argentina', 'America/Argentina/Mendoza'],
  'paso los libres': ['Argentina', 'America/Argentina/Cordoba'],
  'puerto iguazu': ['Argentina', 'America/Argentina/Cordoba'],
  montevideu: ['Uruguai', 'America/Montevideo'],
  artigas: ['Uruguai', 'America/Montevideo'],
  chuy: ['Uruguai', 'America/Montevideo'],
  rivera: ['Uruguai', 'America/Montevideo'],
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
  'st georges de loyapock': ['Guiana Francesa', 'America/Cayenne'],
  georgetown: ['Guiana', 'America/Guyana'],
  'la paz': ['Bolívia', 'America/La_Paz'],
  cochabamba: ['Bolívia', 'America/La_Paz'],
  'santa cruz de la sierra': ['Bolívia', 'America/La_Paz'],
  cobija: ['Bolívia', 'America/La_Paz'],
  'puerto quijarro': ['Bolívia', 'America/La_Paz'],
  caracas: ['Venezuela', 'America/Caracas'],
  'ciudad guayana': ['Venezuela', 'America/Caracas'],
  'santa elena de uairen': ['Venezuela', 'America/Caracas'],
  bogota: ['Colômbia', 'America/Bogota'],
  quito: ['Equador', 'America/Guayaquil'],
  lima: ['Peru', 'America/Lima'],
  iquitos: ['Peru', 'America/Lima'],
  // Central America and the Caribbean
  'port of spain': ['Trinidad e Tobago', 'America/Port_of_Spain'],
  bridgetown: ['Barbados', 'America/Barbados'],
  castries: ['Santa Lúcia', 'America/St_Lucia'],
  'saint johns': ['Antígua e Barbuda', 'America/Antigua'],
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
  belmopan: ['Belize', 'America/Belize'],
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

/**
 * The cities abroad grouped by when their polls open, earliest first: the order in which voting
 * goes round the world on election day. Cities this table does not know come back in `unknown`.
 */
export function votingSchedule(
  cities: { name: string; voters?: number | null }[],
  date: string,
): { slots: VotingSlot[]; unknown: string[] } {
  const slots = new Map<number, VotingSlot & { byCountry: Map<string, string[]> }>();
  const unknown: string[] = [];
  for (const city of cities) {
    const place = PLACES[key(city.name)];
    if (!place) {
      unknown.push(city.name);
      continue;
    }
    const [country, zone] = place;
    const opens = instantOf(date, OPENS, zone);
    let slot = slots.get(opens.getTime());
    if (!slot) {
      slot = { opens, closes: instantOf(date, CLOSES, zone), places: [], voters: 0, byCountry: new Map() };
      slots.set(opens.getTime(), slot);
    }
    slot.voters += city.voters ?? 0;
    slot.byCountry.set(country, [...(slot.byCountry.get(country) ?? []), city.name]);
  }
  return {
    slots: [...slots.values()]
      .sort((a, b) => a.opens.getTime() - b.opens.getTime())
      .map(({ byCountry, ...slot }) => ({
        ...slot,
        places: [...byCountry]
          .map(([country, list]) => ({ country, cities: list.sort((a, b) => a.localeCompare(b, 'pt-BR')) }))
          .sort((a, b) => a.country.localeCompare(b.country, 'pt-BR')),
      })),
    unknown: unknown.sort((a, b) => a.localeCompare(b, 'pt-BR')),
  };
}

/** Every time zone named above, for a test to check against the runtime's own list. */
export const ABROAD_ZONES = [...new Set(Object.values(PLACES).map(([, zone]) => zone))];
export const ABROAD_CITIES = Object.keys(PLACES);
