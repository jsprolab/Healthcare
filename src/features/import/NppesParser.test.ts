import { Readable } from 'node:stream';
import { parseNppesStream } from './NppesParser';

/** Builds a minimal NPPES-format CSV string with the required column names. */
function buildCsv(rows: string[]): string {
  const header = [
    'NPI',
    'Entity Type Code',
    'Provider Organization Name (Legal Business Name)',
    'Provider Last Name (Legal Name)',
    'Provider First Name',
    'Provider First Line Business Practice Location Address',
    'Provider Second Line Business Practice Location Address',
    'Provider Business Practice Location Address City Name',
    'Provider Business Practice Location Address State Name',
    'Provider Business Practice Location Address Postal Code',
    'Provider Business Practice Location Address Telephone Number',
    'Healthcare Provider Taxonomy Code_1',
    'Healthcare Provider Primary Taxonomy Switch_1',
    'Healthcare Provider Taxonomy Code_2',
    'Healthcare Provider Primary Taxonomy Switch_2',
    'NPI Deactivation Date',
  ].join(',');
  return [header, ...rows].join('\n');
}

const SAMPLE_ROW =
  '1234567890,1,,Smith,Jane,123 Main St,,San Francisco,CA,94102,4155551234,207Q00000X,Y,,,';

async function collectAll(csv: string) {
  const source = Readable.from([csv]);
  const records = [];
  for await (const row of parseNppesStream(source)) {
    records.push(row);
  }
  return records;
}

describe('NppesParser / parseNppesStream', () => {
  it('parses a single row into an NppesRow', async () => {
    const csv = buildCsv([SAMPLE_ROW]);
    const records = await collectAll(csv);

    expect(records).toHaveLength(1);
    expect(records[0].npi).toBe('1234567890');
  });

  it('maps all scalar fields correctly', async () => {
    const [row] = await collectAll(buildCsv([SAMPLE_ROW]));

    expect(row.entityTypeCode).toBe('1');
    expect(row.lastName).toBe('Smith');
    expect(row.firstName).toBe('Jane');
    expect(row.practiceAddress1).toBe('123 Main St');
    expect(row.practiceCity).toBe('San Francisco');
    expect(row.practiceState).toBe('CA');
    expect(row.practiceZip).toBe('94102');
    expect(row.practicePhone).toBe('4155551234');
  });

  it('extracts taxonomy entries from numbered columns', async () => {
    const [row] = await collectAll(buildCsv([SAMPLE_ROW]));

    expect(row.taxonomies).toHaveLength(1);
    expect(row.taxonomies[0].code).toBe('207Q00000X');
    expect(row.taxonomies[0].isPrimary).toBe(true);
  });

  it('marks non-Y taxonomy entries as not primary', async () => {
    const row = '9876543210,1,,Jones,Bob,456 Elm,,Los Angeles,CA,90001,2135559999,207R00000X,N,,,';
    const [record] = await collectAll(buildCsv([row]));

    expect(record.taxonomies[0].isPrimary).toBe(false);
  });

  it('maps the deactivation date column', async () => {
    const row = '1111111111,1,,Doe,John,1 A St,,Fresno,CA,93701,5595550000,207Q00000X,Y,,,20200101';
    const [record] = await collectAll(buildCsv([row]));
    expect(record.deactivationDate).toBe('20200101');
  });

  it('yields an empty deactivation date for active providers', async () => {
    const [row] = await collectAll(buildCsv([SAMPLE_ROW]));
    expect(row.deactivationDate).toBe('');
  });

  it('returns an empty array for a header-only CSV', async () => {
    const records = await collectAll(buildCsv([]));
    expect(records).toHaveLength(0);
  });

  it('parses multiple rows', async () => {
    const row2 =
      '9876543210,2,UCSF Medical,,,,123 Parnassus,,San Francisco,CA,94143,4155550000,207RC0000X,Y,,,';
    const records = await collectAll(buildCsv([SAMPLE_ROW, row2]));
    expect(records).toHaveLength(2);
    expect(records[1].organizationName).toBe('UCSF Medical');
  });

  it('calls onProgress at the configured interval', async () => {
    const rows = Array.from(
      { length: 5 },
      (_, i) => `123456789${i},1,,Last${i},First${i},Addr,,City,CA,90001,5555550000,207Q00000X,Y,,,`
    );
    const csv = buildCsv(rows);
    const source = Readable.from([csv]);
    const onProgress = jest.fn();

    const records = [];
    for await (const row of parseNppesStream(source, { onProgress, progressInterval: 3 })) {
      records.push(row);
    }

    expect(records).toHaveLength(5);
    expect(onProgress).toHaveBeenCalledTimes(1); // called at record 3
    expect(onProgress).toHaveBeenCalledWith(3);
  });
});
