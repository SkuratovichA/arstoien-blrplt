import { ConfigService } from '@nestjs/config';
import type { Mock } from 'vitest';
import { LockService } from './lock.service.js';

// Only the Redis connection is replaced; Redlock is the real one, because what this pins is what Redlock does with the client it was given
const { created } = vi.hoisted(() => ({
  created: [] as Array<{ quit: Mock<() => Promise<string>> }>,
}));

vi.mock('ioredis', () => ({
  Redis: class {
    quit = vi.fn(async () => 'OK');

    constructor() {
      created.push(this);
    }
  },
}));

describe('LockService shutdown', () => {
  it('quits the Redis connection once, because Redlock already quits every client it was built with', async () => {
    created.length = 0;
    const service = new LockService(
      new ConfigService({ app: { redis: { url: 'redis://localhost:6390' } } })
    );

    await service.onModuleDestroy();

    expect(created).toHaveLength(1);
    expect(created[0]?.quit).toHaveBeenCalledTimes(1);
  });
});
