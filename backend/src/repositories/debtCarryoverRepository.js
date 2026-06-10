const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const DebtCarryoverRecord = require('../models/DebtCarryoverRecord');
const Debt = require('../models/Debt');

const DEBT_DB_FILE = path.join(__dirname, '..', '..', 'data', 'debt-carryover-db.json');
const EMPTY_DEBT_DB = { debtCarryovers: [], debts: [] };

let cachedPrisma = null;
let prismaUnavailableReason = '';

function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  if (cachedPrisma) return cachedPrisma;

  try {
    cachedPrisma = require('../../lib/prisma').prisma;
    return cachedPrisma;
  } catch (error) {
    prismaUnavailableReason = error.message;
    return null;
  }
}

function hasTask4PrismaModels(prisma) {
  return Boolean(prisma && prisma.debtCarryoverRecord && prisma.debt && prisma.user && prisma.budget);
}

function canUseRelationalDb() {
  const prisma = getPrisma();
  return hasTask4PrismaModels(prisma);
}

function canUseMongo() {
  return Boolean(process.env.MONGO_URI) && mongoose.connection.readyState === 1;
}

function getDebtStorageSource() {
  if (canUseRelationalDb()) return 'mysql-prisma-relational-tables';
  if (canUseMongo()) return 'mongodb';
  return 'separate-json-file-fallback';
}

function ensureDebtDbFile() {
  const dir = path.dirname(DEBT_DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DEBT_DB_FILE)) {
    fs.writeFileSync(DEBT_DB_FILE, JSON.stringify(EMPTY_DEBT_DB, null, 2));
  }
}

function readDebtDbFile() {
  ensureDebtDbFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(DEBT_DB_FILE, 'utf8'));
    return {
      debtCarryovers: Array.isArray(parsed.debtCarryovers) ? parsed.debtCarryovers : [],
      debts: Array.isArray(parsed.debts) ? parsed.debts : []
    };
  } catch (error) {
    console.warn('Cannot read separate debt carry-over database. Recreating file.', error.message);
    fs.writeFileSync(DEBT_DB_FILE, JSON.stringify(EMPTY_DEBT_DB, null, 2));
    return { ...EMPTY_DEBT_DB };
  }
}

function writeDebtDbFile(db) {
  ensureDebtDbFile();
  fs.writeFileSync(DEBT_DB_FILE, JSON.stringify({
    debtCarryovers: Array.isArray(db.debtCarryovers) ? db.debtCarryovers : [],
    debts: Array.isArray(db.debts) ? db.debts : []
  }, null, 2));
}

function roundMoney(value) {
  return Math.max(Math.round(Number(value || 0)), 0);
}

function decimalToNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber();
  return Number(value || 0);
}

function normalizePeriod(value = '') {
  return String(value || 'MONTH').toUpperCase().includes('WEEK') || String(value || '').toLowerCase().includes('tuần')
    ? 'WEEK'
    : String(value || '').toUpperCase().includes('YEAR') || String(value || '').toLowerCase().includes('năm')
      ? 'YEAR'
      : 'MONTH';
}

function safeDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getUserIdFromContext(context = {}, record = {}) {
  return String(context.user?.id || record.userId || '').trim();
}

function getUserEmail(user = {}, userId = '') {
  const email = String(user.email || '').trim().toLowerCase();
  if (email) return email;
  return `${userId || uuidv4()}@smartspend.local`;
}

function getGoalSavedAmount(goal = {}) {
  return roundMoney(goal.currentAmount ?? goal.savedAmount ?? goal.saved ?? 0);
}

function normalizeDebtCarryoverRecord(record = {}) {
  const now = new Date().toISOString();
  return {
    id: String(record.id || uuidv4()),
    userId: String(record.userId || ''),
    budgetId: String(record.budgetId || ''),
    goalId: String(record.goalId || ''),
    debtId: String(record.debtId || `debt-${record.userId}-${record.periodKey || record.period || ''}`),
    periodKey: String(record.periodKey || record.period || ''),
    period: String(record.period || record.periodKey || ''),
    periodLabel: String(record.periodLabel || ''),
    periodType: String(record.periodType || 'month'),
    strategy: String(record.strategy || ''),
    status: String(record.status || ''),
    baseBudgetAmount: roundMoney(record.baseBudgetAmount),
    periodIncome: roundMoney(record.periodIncome),
    periodExpense: roundMoney(record.periodExpense),
    grossBudget: roundMoney(record.grossBudget),
    availableBudget: roundMoney(record.availableBudget),
    surplusAmount: roundMoney(record.surplusAmount),
    budgetCarryAmount: roundMoney(record.budgetCarryAmount),
    savingGoalContributionAmount: roundMoney(record.savingGoalContributionAmount),
    debtAmount: roundMoney(record.debtAmount),
    debtRepaymentAmount: roundMoney(record.debtRepaymentAmount),
    remainingDebtAmount: roundMoney(record.remainingDebtAmount),
    budgetAdjustmentAmount: Math.round(Number(record.budgetAdjustmentAmount || 0)),
    nextBudgetAmount: roundMoney(record.nextBudgetAmount),
    warning: String(record.warning || record.warningMessage || ''),
    isLimitedDebtRepayment: Boolean(record.isLimitedDebtRepayment),
    createdAt: record.createdAt || now,
    updatedAt: now
  };
}

function buildDebtSnapshot(record = {}) {
  const debtAmount = roundMoney(record.remainingDebtAmount || record.debtAmount || 0);
  return {
    id: String(record.debtId || `debt-${record.userId}-${record.periodKey}`),
    userId: String(record.userId || ''),
    carryoverRecordId: String(record.id || ''),
    periodKey: String(record.periodKey || record.period || ''),
    debtAmount,
    status: debtAmount <= 0 ? 'PAID' : record.debtRepaymentAmount > 0 ? 'PARTIAL' : 'OPEN',
    createdFrom: 'debt_carryover',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeRelationalRecord(record = {}) {
  return {
    id: String(record.id || record._id || ''),
    userId: String(record.userId || ''),
    budgetId: String(record.budgetId || ''),
    goalId: String(record.goalId || ''),
    debtId: String(record.debtId || ''),
    periodKey: String(record.period || record.periodKey || ''),
    period: String(record.period || record.periodKey || ''),
    strategy: String(record.strategy || ''),
    status: String(record.status || ''),
    baseBudgetAmount: decimalToNumber(record.baseBudgetAmount),
    periodIncome: decimalToNumber(record.periodIncome),
    periodExpense: decimalToNumber(record.periodExpense),
    surplusAmount: decimalToNumber(record.surplusAmount),
    debtAmount: decimalToNumber(record.debtAmount),
    debtRepaymentAmount: decimalToNumber(record.debtRepaymentAmount),
    remainingDebtAmount: decimalToNumber(record.remainingDebtAmount),
    budgetAdjustmentAmount: decimalToNumber(record.budgetAdjustmentAmount),
    savingGoalContributionAmount: decimalToNumber(record.savingGoalContributionAmount),
    warning: String(record.warningMessage || record.warning || ''),
    isLimitedDebtRepayment: Boolean(record.isLimitedDebtRepayment),
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt
  };
}

function normalizeRelationalDebt(record = {}) {
  return {
    id: String(record.id || record._id || ''),
    userId: String(record.userId || ''),
    periodKey: String(record.periodKey || ''),
    debtAmount: decimalToNumber(record.debtAmount),
    status: String(record.status || ''),
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt
  };
}

async function ensureRelationalUser(prisma, user = {}, userId = '') {
  const stableUserId = String(userId || user.id || '').trim();
  if (!stableUserId) return null;

  return prisma.user.upsert({
    where: { id: stableUserId },
    create: {
      id: stableUserId,
      email: getUserEmail(user, stableUserId),
      username: String(user.username || user.email || stableUserId).slice(0, 191),
      passwordHash: String(user.passwordHash || user.password || 'json-demo-password').slice(0, 255),
      fullName: String(user.fullName || user.username || 'SmartSpend User').slice(0, 191),
      birthday: safeDate(user.birthday),
      phone: user.phone ? String(user.phone).slice(0, 50) : undefined,
      avatar: user.avatar ? String(user.avatar).slice(0, 500) : undefined,
      wallet: roundMoney(user.wallet)
    },
    update: {
      email: getUserEmail(user, stableUserId),
      username: String(user.username || user.email || stableUserId).slice(0, 191),
      fullName: String(user.fullName || user.username || 'SmartSpend User').slice(0, 191),
      phone: user.phone ? String(user.phone).slice(0, 50) : undefined,
      avatar: user.avatar ? String(user.avatar).slice(0, 500) : undefined,
      wallet: roundMoney(user.wallet)
    }
  });
}

async function ensureRelationalBudget(prisma, budget = {}, userId = '') {
  if (!userId) return null;
  const budgetId = String(budget.id || `budget-${userId}`).slice(0, 191);
  const amount = roundMoney(budget.amount);
  return prisma.budget.upsert({
    where: { userId },
    create: {
      id: budgetId,
      userId,
      amount,
      remainingAmount: budget.remainingAmount !== undefined ? roundMoney(budget.remainingAmount) : amount,
      period: normalizePeriod(budget.period)
    },
    update: {
      amount,
      remainingAmount: budget.remainingAmount !== undefined ? roundMoney(budget.remainingAmount) : amount,
      period: normalizePeriod(budget.period)
    }
  });
}

async function ensureRelationalGoal(prisma, goals = [], goalId = '', userId = '') {
  if (!goalId || !userId) return null;
  const goal = (goals || []).find((item) => String(item.id) === String(goalId) && String(item.userId) === String(userId));
  if (!goal) return null;

  return prisma.goal.upsert({
    where: { id: String(goal.id) },
    create: {
      id: String(goal.id),
      userId,
      name: String(goal.name || goal.goalName || 'Saving goal').slice(0, 191),
      target: roundMoney(goal.target ?? goal.targetAmount),
      saved: getGoalSavedAmount(goal),
      deadline: safeDate(goal.deadline)
    },
    update: {
      name: String(goal.name || goal.goalName || 'Saving goal').slice(0, 191),
      target: roundMoney(goal.target ?? goal.targetAmount),
      saved: getGoalSavedAmount(goal),
      deadline: safeDate(goal.deadline)
    }
  });
}

async function persistWithRelationalDb(normalized, debtSnapshot, context = {}) {
  const prisma = getPrisma();
  const userId = getUserIdFromContext(context, normalized);
  normalized.userId = userId;
  debtSnapshot.userId = userId;
  if (!userId) throw new Error('Missing userId for relational debt carry-over persistence.');

  await ensureRelationalUser(prisma, context.user, userId);
  const relationalBudget = await ensureRelationalBudget(prisma, context.budget, userId);
  const relationalGoal = await ensureRelationalGoal(prisma, context.goals, normalized.goalId, userId);
  const debt = await prisma.debt.upsert({
    where: {
      userId_periodKey: {
        userId,
        periodKey: debtSnapshot.periodKey
      }
    },
    create: {
      id: debtSnapshot.id.slice(0, 191),
      userId,
      periodKey: debtSnapshot.periodKey,
      debtAmount: debtSnapshot.debtAmount,
      status: debtSnapshot.status
    },
    update: {
      debtAmount: debtSnapshot.debtAmount,
      status: debtSnapshot.status
    }
  });

  const savedRecord = await prisma.debtCarryoverRecord.upsert({
    where: {
      userId_period: {
        userId,
        period: normalized.periodKey
      }
    },
    create: {
      id: normalized.id.slice(0, 191),
      userId,
      budgetId: relationalBudget?.id || null,
      goalId: relationalGoal?.id || null,
      debtId: debt.id,
      period: normalized.periodKey,
      baseBudgetAmount: normalized.baseBudgetAmount,
      periodIncome: normalized.periodIncome,
      periodExpense: normalized.periodExpense,
      surplusAmount: normalized.surplusAmount,
      debtAmount: normalized.debtAmount,
      debtRepaymentAmount: normalized.debtRepaymentAmount,
      remainingDebtAmount: normalized.remainingDebtAmount,
      budgetAdjustmentAmount: normalized.budgetAdjustmentAmount,
      savingGoalContributionAmount: normalized.savingGoalContributionAmount,
      strategy: normalized.strategy || 'none',
      status: debtSnapshot.status,
      warningMessage: normalized.warning || null,
      isLimitedDebtRepayment: normalized.isLimitedDebtRepayment
    },
    update: {
      budgetId: relationalBudget?.id || null,
      goalId: relationalGoal?.id || null,
      debtId: debt.id,
      baseBudgetAmount: normalized.baseBudgetAmount,
      periodIncome: normalized.periodIncome,
      periodExpense: normalized.periodExpense,
      surplusAmount: normalized.surplusAmount,
      debtAmount: normalized.debtAmount,
      debtRepaymentAmount: normalized.debtRepaymentAmount,
      remainingDebtAmount: normalized.remainingDebtAmount,
      budgetAdjustmentAmount: normalized.budgetAdjustmentAmount,
      savingGoalContributionAmount: normalized.savingGoalContributionAmount,
      strategy: normalized.strategy || 'none',
      status: debtSnapshot.status,
      warningMessage: normalized.warning || null,
      isLimitedDebtRepayment: normalized.isLimitedDebtRepayment
    }
  });

  return {
    record: normalizeRelationalRecord(savedRecord),
    debt: normalizeRelationalDebt(debt),
    storage: getDebtStorageSource()
  };
}

function getUserDebtCarryoverRecordsSync(userId) {
  const db = readDebtDbFile();
  return db.debtCarryovers
    .filter((record) => record.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function getUserDebtsSync(userId) {
  const db = readDebtDbFile();
  return db.debts
    .filter((record) => record.userId === userId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

async function getUserDebtCarryoverRecords(userId) {
  if (canUseRelationalDb()) {
    try {
      const prisma = getPrisma();
      const records = await prisma.debtCarryoverRecord.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      return records.map(normalizeRelationalRecord);
    } catch (error) {
      console.warn('Relational debt carry-over history unavailable. Falling back.', error.message);
    }
  }

  if (canUseMongo()) {
    const records = await DebtCarryoverRecord.find({ userId }).sort({ updatedAt: -1 }).lean();
    return records.map((record) => ({ ...record, id: String(record._id) }));
  }
  return getUserDebtCarryoverRecordsSync(userId);
}

async function getUserDebts(userId) {
  if (canUseRelationalDb()) {
    try {
      const prisma = getPrisma();
      const records = await prisma.debt.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      return records.map(normalizeRelationalDebt);
    } catch (error) {
      console.warn('Relational debt table unavailable. Falling back.', error.message);
    }
  }

  if (canUseMongo()) {
    const records = await Debt.find({ userId }).sort({ updatedAt: -1 }).lean();
    return records.map((record) => ({ ...record, id: String(record._id) }));
  }
  return getUserDebtsSync(userId);
}

async function upsertDebtCarryoverRecord(record, context = {}) {
  const normalized = normalizeDebtCarryoverRecord(record);
  const debtSnapshot = buildDebtSnapshot(normalized);

  if (canUseRelationalDb()) {
    try {
      return await persistWithRelationalDb(normalized, debtSnapshot, context);
    } catch (error) {
      console.warn('Cannot write Task 4 data to MySQL/Prisma tables. Falling back to local JSON file.', error.message);
      if (process.env.REQUIRE_TASK4_RELATIONAL_DB === 'true') throw error;
    }
  }

  if (canUseMongo()) {
    const savedRecord = await DebtCarryoverRecord.findOneAndUpdate(
      { userId: normalized.userId, periodKey: normalized.periodKey },
      { $set: normalized, $setOnInsert: { createdAt: normalized.createdAt } },
      { new: true, upsert: true }
    ).lean();

    await Debt.findOneAndUpdate(
      { userId: debtSnapshot.userId, periodKey: debtSnapshot.periodKey },
      { $set: debtSnapshot, $setOnInsert: { createdAt: debtSnapshot.createdAt } },
      { new: true, upsert: true }
    );

    return {
      record: { ...savedRecord, id: String(savedRecord._id) },
      debt: debtSnapshot,
      storage: getDebtStorageSource()
    };
  }

  const db = readDebtDbFile();
  const recordIndex = db.debtCarryovers.findIndex((item) => item.userId === normalized.userId && item.periodKey === normalized.periodKey);
  if (recordIndex >= 0) {
    db.debtCarryovers.splice(recordIndex, 1, {
      ...db.debtCarryovers[recordIndex],
      ...normalized,
      createdAt: db.debtCarryovers[recordIndex].createdAt || normalized.createdAt
    });
  } else {
    db.debtCarryovers.unshift(normalized);
  }

  const debtIndex = db.debts.findIndex((item) => item.userId === debtSnapshot.userId && item.periodKey === debtSnapshot.periodKey);
  if (debtIndex >= 0) {
    db.debts.splice(debtIndex, 1, {
      ...db.debts[debtIndex],
      ...debtSnapshot,
      createdAt: db.debts[debtIndex].createdAt || debtSnapshot.createdAt
    });
  } else {
    db.debts.unshift(debtSnapshot);
  }

  writeDebtDbFile(db);
  return {
    record: normalized,
    debt: debtSnapshot,
    storage: getDebtStorageSource(),
    prismaUnavailableReason
  };
}

module.exports = {
  DEBT_DB_FILE,
  getDebtStorageSource,
  getUserDebtCarryoverRecordsSync,
  getUserDebtsSync,
  getUserDebtCarryoverRecords,
  getUserDebts,
  upsertDebtCarryoverRecord
};
