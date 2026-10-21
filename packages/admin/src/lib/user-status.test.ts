import { buildSchema, isEnumType } from 'graphql';
import { describe, expect, it } from 'vitest';
import schemaSource from '../../schema.graphql?raw';
import { isUserStatus, USER_STATUS_VARIANT, USER_STATUSES } from './user-status';

/** The values of the enum UserStatus in the schema snapshot that the code generation reads, which is the enum of the server */
function statusesOfSchema(): string[] {
  const type = buildSchema(schemaSource).getType('UserStatus');
  if (!isEnumType(type)) {
    throw new Error('UserStatus is not an enum in schema.graphql');
  }
  return type.getValues().map((value) => value.name);
}

describe('USER_STATUSES', () => {
  it('lists exactly the values of the enum UserStatus of the server schema', () => {
    expect([...USER_STATUSES].sort()).toEqual(statusesOfSchema().sort());
  });

  it('gives each status a badge variant', () => {
    expect(Object.keys(USER_STATUS_VARIANT).sort()).toEqual(statusesOfSchema().sort());
  });
});

describe('isUserStatus', () => {
  it.each(statusesOfSchema())('accepts %s', (status) => {
    expect(isUserStatus(status)).toBe(true);
  });

  it.each(['PENDING', 'BANNED', 'active', '', 'constructor'])('rejects %s', (status) => {
    expect(isUserStatus(status)).toBe(false);
  });
});
