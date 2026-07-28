/**
 * Database seed.
 *
 * Creates the default manager account required to bootstrap the system, plus a
 * small set of demo employees and records so the dashboards have something to
 * render on a fresh install.
 *
 * Idempotent: re-running upserts by email rather than creating duplicates.
 *
 * Run with:  npm run seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const MANAGER = {
  name: process.env.SEED_MANAGER_NAME || 'System Manager',
  email: (process.env.SEED_MANAGER_EMAIL || 'manager@company.com').toLowerCase(),
  password: process.env.SEED_MANAGER_PASSWORD || 'Manager@123',
};

/** Demo employees — all share the same password for convenience. */
const DEMO_PASSWORD = 'Employee@123';

const EMPLOYEES = [
  { name: 'Ayesha Khan', email: 'ayesha@company.com', department: 'Engineering', salary: 95000 },
  { name: 'Daniel Reyes', email: 'daniel@company.com', department: 'Design', salary: 78000 },
  { name: 'Priya Nair', email: 'priya@company.com', department: 'Engineering', salary: 102000 },
  { name: 'Tom Fischer', email: 'tom@company.com', department: 'Marketing', salary: 64000 },
];

/** Returns a Date at UTC midnight, `days` from today. */
const daysFromToday = (days) => {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(base + days * 86_400_000);
};

const main = async () => {
  console.log('[seed] Starting...');

  // --- Default manager ------------------------------------------------------
  const managerHash = await bcrypt.hash(MANAGER.password, SALT_ROUNDS);

  const manager = await prisma.user.upsert({
    where: { email: MANAGER.email },
    update: {},
    create: {
      name: MANAGER.name,
      email: MANAGER.email,
      password: managerHash,
      role: 'MANAGER',
      department: 'Management',
      status: 'ACTIVE',
    },
  });

  console.log(`[seed] Manager ready: ${manager.email}`);

  // --- Demo employees -------------------------------------------------------
  const employeeHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const employees = [];
  for (const employee of EMPLOYEES) {
    const created = await prisma.user.upsert({
      where: { email: employee.email },
      update: {},
      create: {
        ...employee,
        password: employeeHash,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
    employees.push(created);
  }

  console.log(`[seed] ${employees.length} demo employees ready`);

  // Sample records are only inserted on a genuinely empty database, so re-running
  // the seed against a working system never pollutes real data.
  const existingTasks = await prisma.task.count();
  if (existingTasks > 0) {
    console.log('[seed] Sample data already present, skipping');
    console.log('[seed] Done.');
    return;
  }

  const [ayesha, daniel, priya] = employees;

  // --- Tasks ----------------------------------------------------------------
  await prisma.task.createMany({
    data: [
      {
        title: 'Build authentication module',
        description: 'Implement JWT login and role-based route protection.',
        assignedTo: ayesha.id,
        assignedBy: manager.id,
        dueDate: daysFromToday(7),
        status: 'IN_PROGRESS',
      },
      {
        title: 'Redesign employee dashboard',
        description: 'Update the profile and salary cards to the new layout.',
        assignedTo: daniel.id,
        assignedBy: manager.id,
        dueDate: daysFromToday(14),
        status: 'PENDING',
      },
      {
        title: 'Optimise database queries',
        description: 'Add indexes and remove N+1 queries on the listing endpoints.',
        assignedTo: priya.id,
        assignedBy: manager.id,
        dueDate: daysFromToday(-2),
        status: 'COMPLETED',
      },
    ],
  });

  // --- Projects -------------------------------------------------------------
  await prisma.project.createMany({
    data: [
      {
        name: 'Employee Management System',
        description: 'Internal HR platform for managing staff, tasks and leave.',
        employeeId: ayesha.id,
        status: 'IN_PROGRESS',
      },
      {
        name: 'Design System v2',
        description: 'Shared component library for all internal products.',
        employeeId: daniel.id,
        status: 'NOT_STARTED',
      },
      {
        name: 'Reporting Data Pipeline',
        description: 'Nightly aggregation jobs feeding the management dashboards.',
        employeeId: priya.id,
        status: 'IN_PROGRESS',
      },
    ],
  });

  // --- Schedules ------------------------------------------------------------
  await prisma.schedule.createMany({
    data: [
      {
        employeeId: ayesha.id,
        date: daysFromToday(1),
        startTime: '09:00',
        endTime: '17:00',
        description: 'Regular shift',
      },
      {
        employeeId: daniel.id,
        date: daysFromToday(1),
        startTime: '10:00',
        endTime: '18:00',
        description: 'Design review day',
      },
      {
        employeeId: priya.id,
        date: daysFromToday(2),
        startTime: '08:30',
        endTime: '16:30',
        description: 'Regular shift',
      },
    ],
  });

  // --- Leaves ---------------------------------------------------------------
  await prisma.leave.createMany({
    data: [
      {
        employeeId: ayesha.id,
        fromDate: daysFromToday(10),
        toDate: daysFromToday(12),
        reason: 'Family event',
        status: 'PENDING',
      },
      {
        employeeId: daniel.id,
        fromDate: daysFromToday(-20),
        toDate: daysFromToday(-18),
        reason: 'Medical leave',
        status: 'APPROVED',
      },
    ],
  });

  console.log('[seed] Sample tasks, projects, schedules and leaves created');
  console.log('[seed] Done.');
  console.log('');
  console.log('  Manager login  →', MANAGER.email, '/', MANAGER.password);
  console.log('  Employee login →', EMPLOYEES[0].email, '/', DEMO_PASSWORD);
};

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
