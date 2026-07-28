/**
 * Database seed.
 *
 * Creates the three accounts the system ships with — one manager and two
 * employees — and nothing else. No sample tasks, projects, schedules or leaves
 * are inserted; those are created through the API.
 *
 * Idempotent: re-running upserts by email rather than creating duplicates.
 * Existing accounts keep their current password — delete the user first if you
 * need to reset it.
 *
 * Run with:  npm run seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

/** The accounts created by this seed. Emails are matched lowercase. */
const ACCOUNTS = [
  {
    name: 'Manager',
    email: 'manager@gmail.com',
    password: 'manager@123',
    role: 'MANAGER',
    department: 'Management',
  },
  {
    name: 'Razina Khan',
    email: 'razinakhan844@gmail.com',
    password: 'razina@123',
    role: 'EMPLOYEE',
  },
  {
    name: 'Mahek',
    email: 'mahek@gmail.com',
    password: 'mahek@123',
    role: 'EMPLOYEE',
  },
];

const main = async () => {
  console.log('[seed] Starting...');

  for (const account of ACCOUNTS) {
    const email = account.email.toLowerCase();
    const password = await bcrypt.hash(account.password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: account.name,
        email,
        password,
        role: account.role,
        department: account.department ?? null,
        status: 'ACTIVE',
      },
    });

    console.log(`[seed] ${user.role.padEnd(8)} ready: ${user.email}`);
  }

  console.log('[seed] Done.');
  console.log('');
  console.log('  Logins:');
  for (const account of ACCOUNTS) {
    console.log(`    ${account.role.padEnd(8)} ${account.email} / ${account.password}`);
  }
};

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
