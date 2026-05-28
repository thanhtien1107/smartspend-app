const { v4: uuidv4 } = require('uuid');
const { validateGoalPayload } = require('./goalValidation');

function createGoalController({
  loadData,
  saveData,
  findCurrentUser,
  getUserId,
  hasUserOwner,
  getUserGoals
}) {
  function listGoals(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    res.json(getUserGoals(data, user));
  }

  function createGoal(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    const userId = getUserId(user);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, target } = req.body;
    const validationErrors = validateGoalPayload({ name, target });
    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors[0], errors: validationErrors });
    }
    const goal = {
      userId,
      id: uuidv4(),
      name: String(name).trim(),
      target: Number(target),
      createdAt: new Date().toISOString()
    };
    data.goals = data.goals || [];
    data.goals.unshift(goal);
    saveData(data);
    res.status(201).json(goal);
  }

  function updateGoal(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    const { id } = req.params;
    data.goals = data.goals || [];
    const index = data.goals.findIndex((goal) => goal.id === id && hasUserOwner(goal, user));
    if (index === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const merged = {
      ...data.goals[index],
      ...req.body
    };
    const validationErrors = validateGoalPayload(merged);
    if (validationErrors.length) {
      return res.status(400).json({ error: validationErrors[0], errors: validationErrors });
    }

    data.goals[index] = {
      ...data.goals[index],
      name: String(merged.name).trim(),
      target: Number(merged.target),
      updatedAt: new Date().toISOString()
    };
    saveData(data);
    res.json(data.goals[index]);
  }

  function deleteGoal(req, res) {
    const data = loadData();
    const user = findCurrentUser(req, data);
    const { id } = req.params;
    data.goals = data.goals || [];
    const updated = data.goals.filter((goal) => !(goal.id === id && hasUserOwner(goal, user)));
    if (updated.length === data.goals.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    data.goals = updated;
    saveData(data);
    res.json({ success: true });
  }

  return {
    listGoals,
    createGoal,
    updateGoal,
    deleteGoal
  };
}

module.exports = {
  createGoalController
};
