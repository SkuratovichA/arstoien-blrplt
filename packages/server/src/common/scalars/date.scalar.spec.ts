import { Kind } from 'graphql';
import { DateScalar } from './date.scalar.js';

describe('DateScalar', () => {
  const scalar = new DateScalar();
  const timestamp = 1_700_000_000_000;
  const isoString = '2023-11-14T22:13:20.000Z';

  it('parses a timestamp and an ISO string sent by the client into a Date', () => {
    expect(scalar.parseValue(timestamp)).toEqual(new Date(timestamp));
    expect(scalar.parseValue(isoString)).toEqual(new Date(timestamp));
  });

  it('rejects a client value that is neither a number, a string nor a Date', () => {
    expect(scalar.parseValue({})).toBeNull();
    expect(scalar.parseValue(true)).toBeNull();
  });

  it('serializes a Date, a timestamp and an ISO string into a timestamp', () => {
    expect(scalar.serialize(new Date(timestamp))).toBe(timestamp);
    expect(scalar.serialize(timestamp)).toBe(timestamp);
    expect(scalar.serialize(isoString)).toBe(timestamp);
    expect(scalar.serialize({})).toBeNull();
  });

  it('parses INT and STRING literals and nothing else', () => {
    expect(scalar.parseLiteral({ kind: Kind.INT, value: String(timestamp) })).toEqual(
      new Date(timestamp)
    );
    expect(scalar.parseLiteral({ kind: Kind.STRING, value: isoString })).toEqual(
      new Date(timestamp)
    );
    expect(scalar.parseLiteral({ kind: Kind.BOOLEAN, value: true })).toBeNull();
  });
});
