const { prisma } = require('../lib/prisma');

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

async function getCurrentUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  return prisma.user.findUnique({
    where: { sessionToken: token },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true
    }
  });
}

function validateExpenseInput(body = {}) {
  const errors = {};
  const title = String(body.title || '').trim();
  const amount = Number(body.amount);
  const categoryId = body.categoryId ? String(body.categoryId).trim() : null;
  const date = body.date ? new Date(body.date) : new Date();
  const note = body.note ? String(body.note).trim() : null;

  if (!title) errors.title = 'Title is required.';
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Amount must be greater than 0.';
  if (Number.isNaN(date.getTime())) errors.date = 'Date is invalid.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { title, amount, categoryId, date, note }
  };
}

function serializeExpense(expense) {
  return {
    id: expense.id,
    title: expense.title,
    amount: Number(expense.amount),
    date: expense.date.toISOString().slice(0, 10),
    note: expense.note,
    category: expense.category
      ? {
          id: expense.category.id,
          name: expense.category.name,
          icon: expense.category.icon,
          color: expense.category.color
        }
      : null,
    createdAt: expense.createdAt.toISOString()
  };
}

module.exports = async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const expenses = await prisma.expense.findMany({
        where: { userId: user.id },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true }
          }
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 100
      });

      return sendJson(res, 200, { data: expenses.map(serializeExpense) });
    }

    if (req.method === 'POST') {
      const validation = validateExpenseInput(req.body);
      if (!validation.ok) {
        return sendJson(res, 400, { error: 'Validation failed', details: validation.errors });
      }

      if (validation.data.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: validation.data.categoryId,
            userId: user.id
          },
          select: { id: true }
        });
        if (!category) {
          return sendJson(res, 400, { error: 'Category does not exist or is not owned by this user.' });
        }
      }

      const expense = await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: validation.data.categoryId,
          title: validation.data.title,
          amount: validation.data.amount,
          date: validation.data.date,
          note: validation.data.note
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true }
          }
        }
      });

      return sendJson(res, 201, { data: serializeExpense(expense) });
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Expenses API error:', error);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
};
