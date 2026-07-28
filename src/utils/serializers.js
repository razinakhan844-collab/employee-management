/**
 * Serializers convert Prisma records into API-safe shapes.
 *
 * Two responsibilities:
 *  1. Strip fields that must never leave the server (password hashes).
 *  2. Convert Prisma `Decimal` into a plain number and `Date`-only columns into
 *     `YYYY-MM-DD` strings, so clients get predictable JSON.
 */

/** Converts a Prisma Decimal (or null) into a number (or null). */
const toNumber = (decimal) =>
  decimal === null || decimal === undefined ? null : Number(decimal);

/** Formats a Date column as `YYYY-MM-DD`, dropping the meaningless time part. */
const toDateOnly = (date) =>
  date === null || date === undefined ? null : date.toISOString().slice(0, 10);

/**
 * Serializes a user, always omitting the password hash.
 *
 * @param {object|null} user Prisma `User` record
 * @param {{includeSalary?: boolean}} [options] Set `includeSalary: false` to hide salary
 */
export const serializeUser = (user, { includeSalary = true } = {}) => {
  if (!user) return null;
  // Destructure the password out so it can never be forwarded accidentally.
  const { password, salary, ...rest } = user;
  return {
    ...rest,
    ...(includeSalary ? { salary: toNumber(salary) } : {}),
  };
};

/** Serializes a list of users. */
export const serializeUsers = (users, options) =>
  users.map((user) => serializeUser(user, options));

/** Serializes a task, including the nested assignee/assigner when loaded. */
export const serializeTask = (task) => {
  if (!task) return null;
  const { assignee, assigner, ...rest } = task;
  return {
    ...rest,
    ...(assignee ? { assignee: serializeUser(assignee, { includeSalary: false }) } : {}),
    ...(assigner ? { assigner: serializeUser(assigner, { includeSalary: false }) } : {}),
  };
};

/** Serializes a list of tasks. */
export const serializeTasks = (tasks) => tasks.map(serializeTask);

/** Serializes a project, including the nested employee when loaded. */
export const serializeProject = (project) => {
  if (!project) return null;
  const { employee, ...rest } = project;
  return {
    ...rest,
    ...(employee ? { employee: serializeUser(employee, { includeSalary: false }) } : {}),
  };
};

/** Serializes a list of projects. */
export const serializeProjects = (projects) => projects.map(serializeProject);

/** Serializes a schedule entry; `date` becomes a `YYYY-MM-DD` string. */
export const serializeSchedule = (schedule) => {
  if (!schedule) return null;
  const { employee, date, ...rest } = schedule;
  return {
    ...rest,
    date: toDateOnly(date),
    ...(employee ? { employee: serializeUser(employee, { includeSalary: false }) } : {}),
  };
};

/** Serializes a list of schedule entries. */
export const serializeSchedules = (schedules) => schedules.map(serializeSchedule);

/** Serializes a leave record; date range becomes `YYYY-MM-DD` strings. */
export const serializeLeave = (leave) => {
  if (!leave) return null;
  const { employee, fromDate, toDate, ...rest } = leave;
  return {
    ...rest,
    fromDate: toDateOnly(fromDate),
    toDate: toDateOnly(toDate),
    ...(employee ? { employee: serializeUser(employee, { includeSalary: false }) } : {}),
  };
};

/** Serializes a list of leave records. */
export const serializeLeaves = (leaves) => leaves.map(serializeLeave);
