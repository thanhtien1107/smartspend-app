function createCategoryController({ loadData, saveData }) {
  function listCategories(req, res) {
    const data = loadData();
    const categories = (data.categories || [])
      .map((category) => (typeof category === 'string' ? category : category.name))
      .filter(Boolean);
    res.json([...new Set(categories)]);
  }

  function createCategory(req, res) {
    const data = loadData();
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name required' });
    }
    data.categories = data.categories || [];
    const categoryNames = data.categories.map((category) => (typeof category === 'string' ? category : category.name));
    if (categoryNames.includes(name)) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    data.categories.push(name);
    saveData(data);
    res.status(201).json({ name });
  }

  return {
    listCategories,
    createCategory
  };
}

module.exports = {
  createCategoryController
};
