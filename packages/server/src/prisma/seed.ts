import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@auctions.cz' },
    update: {},
    create: {
      email: 'admin@auctions.cz',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      authProvider: 'EMAIL',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Admin user created:', admin.email);

  // Create test company
  const company = await prisma.company.upsert({
    where: { ico: '12345678' },
    update: {},
    create: {
      ico: '12345678',
      name: 'Test Company s.r.o.',
      address: {
        create: {
          street: 'Testovací 123',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
        },
      },
      verifiedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Test company created:', company.name);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'autobusy' },
      update: {},
      create: {
        name: 'Autobusy',
        slug: 'autobusy',
        description: 'Městské a meziměstské autobusy',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'minibusy' },
      update: {},
      create: {
        name: 'Minibusy',
        slug: 'minibusy',
        description: 'Malé autobusy do 30 míst',
      },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log('✅ Categories created:', categories.length);

  // Create Euro Classes
  const euroClasses = await Promise.all([
    prisma.euroClass.upsert({
      where: { code: 'Euro 3' },
      update: {},
      create: {
        code: 'Euro 3',
        name: 'Euro 3',
        sortOrder: 1,
        active: true,
      },
    }),
    prisma.euroClass.upsert({
      where: { code: 'Euro 4' },
      update: {},
      create: {
        code: 'Euro 4',
        name: 'Euro 4',
        sortOrder: 2,
        active: true,
      },
    }),
    prisma.euroClass.upsert({
      where: { code: 'Euro 5' },
      update: {},
      create: {
        code: 'Euro 5',
        name: 'Euro 5',
        sortOrder: 3,
        active: true,
      },
    }),
    prisma.euroClass.upsert({
      where: { code: 'Euro 6' },
      update: {},
      create: {
        code: 'Euro 6',
        name: 'Euro 6',
        sortOrder: 4,
        active: true,
      },
    }),
    prisma.euroClass.upsert({
      where: { code: 'EEV' },
      update: {},
      create: {
        code: 'EEV',
        name: 'Enhanced Environmentally Friendly Vehicle (EEV)',
        sortOrder: 5,
        active: true,
      },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log('✅ Euro Classes created:', euroClasses.length);
  // eslint-disable-next-line no-console
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
