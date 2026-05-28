const fs = require('fs');

function createJsonDataRepository(filePath) {
  function loadData() {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  function saveData(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  return {
    loadData,
    saveData
  };
}

module.exports = {
  createJsonDataRepository
};
