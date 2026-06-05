const fs = require("fs");
const path = require("path");

const serverFile = path.join(__dirname, "server.js");
let serverCode = fs.readFileSync(serverFile, "utf8");

// I will do this manually for the utils first.
