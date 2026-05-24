import { RecordValidator } from './RecordValidator';
import type { NppesRow } from './types';

const validator = new RecordValidator();

function makeRow(overrides: Partial<NppesRow> = {}): NppesRow {
  return {
    npi: '1234567890',
    entityTypeCode: '1',
    organizationName: '',
    lastName: 'Smith',
    firstName: 'Jane',
    practiceAddress1: '123 Main St',
    practiceAddress2: '',
    practiceCity: 'San Francisco',
    practiceState: 'CA',
    practiceZip: '94102',
    practicePhone: '4155551234',
    taxonomies: [{ code: '207Q00000X', isPrimary: true }],
    deactivationDate: '',
    ...overrides,
  };
}

describe('RecordValidator', () => {
  describe('valid records', () => {
    it('returns a ProviderRecord for a valid individual', () => {
      const result = validator.validate(makeRow());
      expect(result).not.toBeNull();
      expect(result?.npi).toBe('1234567890');
      expect(result?.firstName).toBe('Jane');
      expect(result?.lastName).toBe('Smith');
    });

    it('returns a ProviderRecord for a valid organization', () => {
      const result = validator.validate(
        makeRow({
          entityTypeCode: '2',
          organizationName: 'UCSF Medical',
          lastName: '',
          firstName: '',
        })
      );
      expect(result).not.toBeNull();
      expect(result?.organizationName).toBe('UCSF Medical');
      expect(result?.firstName).toBeNull();
      expect(result?.lastName).toBeNull();
    });

    it('initializes specialtyId as null (resolved separately)', () => {
      const result = validator.validate(makeRow());
      expect(result?.specialtyId).toBeNull();
    });
  });

  describe('NPI validation', () => {
    it('rejects a 9-digit NPI', () => {
      expect(validator.validate(makeRow({ npi: '123456789' }))).toBeNull();
    });

    it('rejects an 11-digit NPI', () => {
      expect(validator.validate(makeRow({ npi: '12345678901' }))).toBeNull();
    });

    it('rejects an NPI with letters', () => {
      expect(validator.validate(makeRow({ npi: '123456789A' }))).toBeNull();
    });

    it('accepts exactly 10 digits', () => {
      expect(validator.validate(makeRow({ npi: '1234567890' }))).not.toBeNull();
    });
  });

  describe('deactivation', () => {
    it('rejects a row with a non-empty deactivation date', () => {
      expect(validator.validate(makeRow({ deactivationDate: '20240101' }))).toBeNull();
    });

    it('accepts a row with an empty deactivation date', () => {
      expect(validator.validate(makeRow({ deactivationDate: '' }))).not.toBeNull();
    });
  });

  describe('name requirements', () => {
    it('rejects an individual with no last or first name', () => {
      expect(
        validator.validate(makeRow({ entityTypeCode: '1', lastName: '', firstName: '' }))
      ).toBeNull();
    });

    it('accepts an individual with only a last name', () => {
      expect(validator.validate(makeRow({ entityTypeCode: '1', firstName: '' }))).not.toBeNull();
    });

    it('rejects an organization with no organization name', () => {
      expect(
        validator.validate(
          makeRow({ entityTypeCode: '2', organizationName: '', lastName: '', firstName: '' })
        )
      ).toBeNull();
    });
  });

  describe('city requirement', () => {
    it('rejects a row with a blank city', () => {
      expect(validator.validate(makeRow({ practiceCity: '' }))).toBeNull();
    });

    it('rejects a row with a whitespace-only city', () => {
      expect(validator.validate(makeRow({ practiceCity: '   ' }))).toBeNull();
    });
  });

  describe('data normalization', () => {
    it('title-cases the city name', () => {
      const result = validator.validate(makeRow({ practiceCity: 'SAN FRANCISCO' }));
      expect(result?.cityName).toBe('San Francisco');
    });

    it('uppercases the state', () => {
      const result = validator.validate(makeRow({ practiceState: 'ca' }));
      expect(result?.state).toBe('CA');
    });

    it('truncates a 9-digit ZIP to 5 digits', () => {
      const result = validator.validate(makeRow({ practiceZip: '941020001' }));
      expect(result?.zipCode).toBe('94102');
    });

    it('returns null for a blank ZIP', () => {
      const result = validator.validate(makeRow({ practiceZip: '' }));
      expect(result?.zipCode).toBeNull();
    });

    it('normalizes a 10-digit phone to digits only', () => {
      const result = validator.validate(makeRow({ practicePhone: '(415) 555-1234' }));
      expect(result?.phone).toBe('4155551234');
    });

    it('returns null for a too-short phone', () => {
      const result = validator.validate(makeRow({ practicePhone: '555-1234' }));
      expect(result?.phone).toBeNull();
    });

    it('picks the primary taxonomy code', () => {
      const result = validator.validate(
        makeRow({
          taxonomies: [
            { code: '207R00000X', isPrimary: false },
            { code: '207Q00000X', isPrimary: true },
          ],
        })
      );
      expect(result?.taxonomyCode).toBe('207Q00000X');
    });

    it('falls back to first code when none is primary', () => {
      const result = validator.validate(
        makeRow({
          taxonomies: [
            { code: '207R00000X', isPrimary: false },
            { code: '207N00000X', isPrimary: false },
          ],
        })
      );
      expect(result?.taxonomyCode).toBe('207R00000X');
    });

    it('returns null taxonomyCode when no taxonomies present', () => {
      const result = validator.validate(makeRow({ taxonomies: [] }));
      expect(result?.taxonomyCode).toBeNull();
    });
  });
});
