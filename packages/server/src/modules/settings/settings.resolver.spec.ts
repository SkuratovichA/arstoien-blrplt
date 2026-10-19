import { Test } from '@nestjs/testing';
import {
  AuthProvider,
  type Prisma,
  type SystemSettings,
  type User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsResolver } from './settings.resolver.js';
import { SettingsService } from './settings.service.js';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const settings: SystemSettings = {
  id: 'default',
  supportEmail: 'help@example.com',
  otpAuthEnabled: false,
  updatedBy: null,
  createdAt,
  updatedAt: createdAt,
};

const superAdmin: User = {
  id: 'user-1',
  email: 'root@example.com',
  passwordHash: null,
  googleId: null,
  authProvider: AuthProvider.EMAIL,
  firstName: 'Root',
  lastName: 'Admin',
  phone: null,
  status: UserStatus.ACTIVE,
  role: UserRole.SUPER_ADMIN,
  avatar: null,
  bio: null,
  preferredLocale: 'cs',
  otpAuthEnabled: false,
  lastLoginAt: null,
  emailVerifiedAt: createdAt,
  approvedAt: null,
  approvedById: null,
  rejectionReason: null,
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
};

const prisma = {
  systemSettings: {
    findFirst: vi.fn<() => Promise<SystemSettings | null>>(),
    create: vi.fn<(args: Prisma.SystemSettingsCreateArgs) => Promise<SystemSettings>>(),
    update: vi.fn<(args: Prisma.SystemSettingsUpdateArgs) => Promise<SystemSettings>>(),
  },
};

// The resolver receives SettingsService, and the service receives PrismaService, only through the constructor parameter types that the compiler emits as decorator metadata.
async function createResolver(): Promise<SettingsResolver> {
  const moduleRef = await Test.createTestingModule({
    providers: [SettingsResolver, SettingsService, { provide: PrismaService, useValue: prisma }],
  }).compile();

  return moduleRef.get(SettingsResolver);
}

describe('SettingsResolver', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the stored settings through the injected service', async () => {
    prisma.systemSettings.findFirst.mockResolvedValue(settings);
    const resolver = await createResolver();

    await expect(resolver.systemSettings()).resolves.toEqual(settings);
    expect(prisma.systemSettings.create).not.toHaveBeenCalled();
  });

  it('creates the default settings when none are stored', async () => {
    prisma.systemSettings.findFirst.mockResolvedValue(null);
    prisma.systemSettings.create.mockResolvedValue(settings);
    const resolver = await createResolver();

    await expect(resolver.systemSettings()).resolves.toEqual(settings);
    expect(prisma.systemSettings.create).toHaveBeenCalledWith({
      data: { supportEmail: 'support@auction.com', otpAuthEnabled: false },
    });
  });

  it('updates only the provided fields and records who changed them', async () => {
    const updated = { ...settings, supportEmail: 'new@example.com', updatedBy: superAdmin.id };
    prisma.systemSettings.findFirst.mockResolvedValue(settings);
    prisma.systemSettings.update.mockResolvedValue(updated);
    const resolver = await createResolver();

    await expect(
      resolver.updateSystemSettings(superAdmin, { supportEmail: 'new@example.com' })
    ).resolves.toEqual(updated);
    expect(prisma.systemSettings.update).toHaveBeenCalledWith({
      where: { id: 'default' },
      data: { updatedBy: 'user-1', supportEmail: 'new@example.com' },
    });
  });
});
