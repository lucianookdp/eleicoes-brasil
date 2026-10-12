import { describe, expect, it } from 'vitest';
import { ABROAD_ZONES, votingSchedule } from '../lib/abroad';

/** The cities abroad of the 2026 runoff, as the TSE names them (from the API, 11 Oct 2026). */
const CITIES = [
  'Lisboa',
  'Boston',
  'Porto',
  'Nagóia',
  'Miami',
  'Nova York',
  'Londres',
  'Tóquio',
  'Paris',
  'Orlando',
  'Milão',
  'Madri',
  'Toronto',
  'Los Angeles',
  'Washington',
  'Barcelona',
  'Dublin',
  'Houston',
  'Atlanta',
  'São Francisco',
  'Zurique',
  'Berlim',
  'Roma',
  'Sydney',
  'Hamamatsu',
  'Munique',
  'Frankfurt',
  'Amsterdã',
  'Chicago',
  'Vancouver',
  'Genebra',
  'Buenos Aires',
  'Montreal',
  'Bruxelas',
  'Hartford',
  'Beirute',
  'Faro',
  'Camberra',
  'Ciudad Del Este',
  'Estocolmo',
  'Edimburgo',
  'Mexico',
  'Santiago',
  'Tel Aviv',
  'Viena',
  'Wellington',
  'Caiena',
  'Abu Dhabi',
  'Copenhague',
  'Santa Cruz de La Sierra',
  'Marselha',
  'Montevidéu',
  'Ottawa',
  'Assunção',
  'Oslo',
  'Ramallah',
  'Lima',
  'Bogotá',
  'Amã',
  'Paramaribo',
  'Panama',
  'Helsinque',
  'Atenas',
  'Caracas',
  'Quito',
  'Córdoba',
  'Salto Del Guairá',
  'Singapura',
  'Budapeste',
  'Damasco',
  'Doha',
  'Varsóvia',
  'Xangai',
  'Luanda',
  'São José',
  'Praga',
  'Hong Kong',
  'Pretória',
  'Pedro Juan Caballero',
  'Taipé',
  'Artigas',
  'Maputo',
  'Seul',
  'Cantão',
  'La Paz',
  'São Domingos',
  'Cochabamba',
  'Cidade do Cabo',
  'Pequim',
  'Istambul',
  'Talin',
  'Riade',
  'Bangkok',
  'Guatemala',
  'Encarnación',
  'Moscou',
  'Mendoza',
  'Manila',
  'Cairo',
  'Georgetown',
  'Jacarta',
  'Kuala Lumpur',
  'Liubliana',
  'São Salvador',
  'Tegucigalpa',
  'Praia',
  'Nova Delhi',
  'Kuaite',
  'Nicosia',
  'Zagreb',
  'Manágua',
  'Dacar',
  'Bratislava',
  'Bucareste',
  'Rabat',
  'Belgrado',
  'Nairóbi',
  'Kingston-Jamaica',
  'Sófia',
  'Mascate',
  'Havana',
  'Abidjã',
  'Díli',
  'Bissau',
  'Port Of Spain',
  'Hanói',
  'Lagos',
  'Concepción',
  'Ancara',
  'Ciudad Guayana',
  'Barein',
  'Nassau',
  'Kiev',
  'Puerto Iguazú',
  'Rio Branco',
  'Mumbai',
  'Argel',
  'Tunis',
  'Teerã',
  'Accra',
  'Paso Los Libres',
  'Windhoek',
  'Dar Es Salaam',
  'Porto Príncipe',
  'Katmandu',
  'Trípoli',
  'Tbilisi',
  'Chuy',
  'Kinshasa',
  'Lusaca',
  'Bridgetown',
  'Rivera',
  'Islamabade',
  'Libreville',
  'São Tomé',
  'Iquitos',
  'Iaundê',
  'Astana',
  'Belmopan',
  'Ierevan',
  'Colombo',
  'Sarajevo',
  'Bagdá',
  'Gaborone',
  'St Georges de Loyapock',
  'Tirana',
  'Cotonou',
  'Puerto Quijarro',
  'Castries',
  'Harare',
  'Lomé',
  'Lilongue',
  'Uagadugu',
  'Yangon',
  'Baku',
  'Bamako',
  'Conacri',
  'Malabo',
  'Abuja',
  'Adis Abeba',
  'Brazzaville',
  'Cobija',
  'Dacca',
  'Pyongyang',
  'Saint Johns',
  'Santa Elena de Uairén',
  'Vaticano',
];

const brasilia = (at: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Sao_Paulo',
  }).format(at);

describe('voting hours abroad', () => {
  const { slots, unknown, noPolls, elsewhere, away } = votingSchedule(
    CITIES.map((name) => ({ name, voters: 10 })),
    '2026-10-25',
  );
  const slotOf = (city: string) => slots.find((sl) => sl.places.some((pl) => pl.cities.includes(city)))!;

  it('knows every city of the 2026 list, in time zones the runtime has', () => {
    expect(unknown).toEqual([]);
    expect(CITIES).toHaveLength(187);
    const known = new Set(Intl.supportedValuesOf('timeZone'));
    // Some runtimes list only the canonical name of a zone: resolving it is what must work.
    for (const zone of ABROAD_ZONES) {
      expect(
        known.has(zone) || new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone,
        zone,
      ).toBeTruthy();
    }
    // Every city is either in a slot or among those with no polling station.
    expect(slots.reduce((n, sl) => n + sl.voters, 0)).toBe((187 - noPolls.length) * 10);
  });

  it('leaves out the cities where no polling station is set up (fewer than 30 voters)', () => {
    // TRE-DF, Editais 46 e 50/2026: 46 places, 41 of them in the list of cities.
    expect(noPolls).toHaveLength(41);
    for (const city of ['Tbilisi', 'Chuy', 'Rivera', 'Islamabade', 'Astana', 'Pyongyang', 'Vaticano']) {
      expect(noPolls).toContain(city);
      expect(slotOf(city)).toBeUndefined();
    }
    // 30 voters is enough: Tripoli's vote, but at the embassy in Tunis and on its time.
    expect(noPolls).not.toContain('Trípoli');
    expect(slotOf('Trípoli')).toBe(slotOf('Tunis'));
    expect(brasilia(slotOf('Trípoli').opens)).toBe('dom., 04:00');
    expect(away).toEqual([
      { city: 'Ciudad Guayana', votesIn: 'Caracas' },
      { city: 'Trípoli', votesIn: 'Túnis' },
    ]);
  });

  it('gives the polling stations in another time zone their own hours', () => {
    expect(elsewhere).toEqual([
      { place: 'Brisbane', city: 'Sydney' },
      { place: 'Calgary', city: 'Vancouver' },
      { place: 'Perth', city: 'Camberra' },
      { place: 'Salt Lake City', city: 'Los Angeles' },
      { place: 'Winnipeg', city: 'Toronto' },
    ]);
    // Sydney and Canberra are on daylight saving time (UTC+11); Brisbane (UTC+10) and Perth
    // (UTC+8) are not.
    expect(brasilia(slotOf('Sydney').opens)).toBe('sáb., 18:00');
    expect(slotOf('Camberra')).toBe(slotOf('Sydney'));
    expect(brasilia(slotOf('Brisbane').opens)).toBe('sáb., 19:00');
    expect(brasilia(slotOf('Perth').opens)).toBe('sáb., 21:00');
    expect(slotOf('Perth')).toBe(slotOf('Pequim'));
    // The Rockies are an hour ahead of the Pacific coast, the prairies an hour behind Toronto.
    expect(brasilia(slotOf('Salt Lake City').opens)).toBe('dom., 11:00');
    expect(slotOf('Calgary')).toBe(slotOf('Salt Lake City'));
    expect(slotOf('Winnipeg')).toBe(slotOf('Chicago'));
    // Listed under the city's own country.
    expect(slotOf('Perth').places.find((p) => p.country === 'Austrália')!.cities).toEqual(['Perth']);
  });

  it('splits the voters of a city between its stations, and never invents any', () => {
    const real = votingSchedule([{ name: 'Camberra', voters: 6261 }], '2026-10-25');
    expect(real.slots.map((sl) => [sl.places[0]!.cities[0], sl.voters])).toEqual([
      ['Camberra', 4383],
      ['Perth', 1878],
    ]);
    const small = votingSchedule([{ name: 'Camberra', voters: 500 }, { name: 'Sydney' }], '2026-10-25');
    expect(small.slots.reduce((n, sl) => n + sl.voters, 0)).toBe(500);
  });

  it('goes round the world in order: New Zealand first, the Pacific coast of North America last', () => {
    expect(slots[0]!.places.map((p) => p.country)).toEqual(['Nova Zelândia']);
    expect(slots.at(-1)!.places.flatMap((p) => p.cities)).toEqual([
      'Vancouver',
      'Los Angeles',
      'São Francisco',
    ]);
    const opens = slots.map((sl) => sl.opens.getTime());
    expect(opens).toEqual([...opens].sort((a, b) => a - b));
    // Nine hours of voting everywhere.
    for (const sl of slots) expect(sl.closes.getTime() - sl.opens.getTime()).toBe(9 * 3_600_000);
  });

  it('gives each place its hours in Brasília time, daylight saving included', () => {
    // 8h in Wellington (UTC+13 in October) is still Saturday afternoon in Brasília.
    expect(brasilia(slotOf('Wellington').opens)).toBe('sáb., 16:00');
    expect(brasilia(slotOf('Tóquio').opens)).toBe('sáb., 20:00');
    expect(brasilia(slotOf('Tóquio').closes)).toBe('dom., 05:00');
    // India is half an hour off the full hours.
    expect(brasilia(slotOf('Nova Delhi').opens)).toBe('sáb., 23:30');
    // Europe leaves daylight saving that very night: Lisbon is on UTC at 8h, Berlin on UTC+1.
    expect(brasilia(slotOf('Lisboa').opens)).toBe('dom., 05:00');
    expect(brasilia(slotOf('Berlim').opens)).toBe('dom., 04:00');
    // North America is still on daylight saving time (until 1 November).
    expect(brasilia(slotOf('Nova York').opens)).toBe('dom., 09:00');
    expect(brasilia(slotOf('Los Angeles').closes)).toBe('dom., 21:00');
    // Neighbours on Brasília's own time.
    expect(brasilia(slotOf('Buenos Aires').opens)).toBe('dom., 08:00');
    expect(slotOf('Montevidéu')).toBe(slotOf('Buenos Aires'));
  });

  it('groups by country, and a city it does not know is listed apart', () => {
    const japan = slotOf('Tóquio').places.find((p) => p.country === 'Japão')!;
    expect(japan.cities).toEqual(['Hamamatsu', 'Nagóia', 'Tóquio']);
    const odd = votingSchedule([{ name: 'Cidade Nova' }, { name: 'Lisboa' }], '2026-10-25');
    expect(odd.unknown).toEqual(['Cidade Nova']);
    expect(odd.slots).toHaveLength(1);
  });
});
