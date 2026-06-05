require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs"); // không được sử dụng?
const path = require("path");
const connectDB = require("./config/db");
const {
  createJsonDataRepository,
} = require("./src/repositories/jsonDataRepository");
const { getUserFromToken } = require("./src/utils/authUtils");
const { createEmailService } = require("./src/utils/emailService");
const {
  createServerCacheKey,
  fetchWithServerCache,
  getMemoryCacheEntry,
  setMemoryCacheEntry,
} = require("./src/utils/serverCache"); // không được sử dụng?

const {
  createCategoryRoutes,
} = require("./src/modules/category/categoryRoutes");
const { createBudgetRoutes } = require("./src/modules/budget/budgetRoutes");
const { createGoalRoutes } = require("./src/modules/goal/goalRoutes");
const { createAuthRoutes } = require("./src/modules/auth/authRoutes");
const { createExpenseRoutes } = require("./src/modules/expense/expenseRoutes");
const { createInsightRoutes } = require("./src/modules/insight/insightRoutes");
const { createAiRoutes } = require("./src/modules/ai/aiRoutes");
const { createPlacesRoutes } = require("./src/modules/places/placesRoutes");
const { findCurrentUser, getUserId } = require("./src/utils/authUtils");
const {
  getUserBudget,
  getUserCategoryBudgets,
  hasUserOwner,
  getUserGoals,
} = require("./src/utils/financialUtils");

const app = express();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || "v20.0";
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, "data", "db.json");
const FRONTEND_PUBLIC_DIR = path.join(__dirname, "..", "frontend", "public");
const { loadData, saveData } = createJsonDataRepository(DB_FILE);

const emailService = createEmailService({ gmailUser: GMAIL_USER, gmailAppPassword: GMAIL_APP_PASSWORD });

const recoveryCodes = new Map();
const loginRateLimits = new Map();
const facebookOAuthStates = new Map();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "smartspend-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false,
    },
  }),
);
app.use(express.static(FRONTEND_PUBLIC_DIR));

function requireAuth(req, res, next) {
  const requestPath = (req.originalUrl || req.url).split("?")[0];
  const openRoutes = [
    "/api/login",
    "/api/social-login",
    "/api/social-login/google",
    "/api/oauth/config",
    "/api/auth/facebook",
    "/api/auth/facebook/callback",
    "/api/register",
    "/api/session",
    "/api/maps/config",
    "/api/password-recovery/request",
    "/api/password-recovery/verify",
    "/api/password-recovery/reset",
  ];
  const publicRoutes = ["/api/ai-suggestions", "/api/chat"];
  if (openRoutes.includes(requestPath) || publicRoutes.includes(requestPath)) {
    return next();
  }
  const tokenUser = getUserFromToken(req, loadData);
  if (tokenUser) {
    req.session = req.session || {};
    req.session.user = { username: tokenUser.username };
    return next();
  }
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// Test endpoints mapping directly (can be extracted later)
app.get("/test/places/search", async (req, res) => {
  res.json({ places: [] });
});

app.use("/api", requireAuth);

app.get("/api/maps/config", (req, res) => {
  res.json({
    googlePlacesApiKey:
      GOOGLE_PLACES_API_KEY &&
      GOOGLE_PLACES_API_KEY !== "your_google_places_api_key_here"
        ? GOOGLE_PLACES_API_KEY
        : "",
  });
});

const dependencies = {
  loadData,
  saveData,
  findCurrentUser,
  getUserId,
  hasUserOwner,
  getUserGoals,
  getUserBudget,
  getUserCategoryBudgets,
  loginRateLimits,
  facebookOAuthStates,
  recoveryCodes,
  emailService,
  findSimilarExpense: require("./src/utils/financialUtils").findSimilarExpense,
  detectUnusualExpense: require("./src/utils/financialUtils")
    .detectUnusualExpense,
  env: {
    OPENAI_API_KEY,
    GOOGLE_PLACES_API_KEY,
    SERPAPI_API_KEY,
    GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    FACEBOOK_GRAPH_VERSION,
    GMAIL_USER,
    GMAIL_APP_PASSWORD,
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL,
  },
};

app.use("/api", createAuthRoutes(dependencies));
app.use("/api/expenses", createExpenseRoutes(dependencies));
app.use("/api/insights", createInsightRoutes(dependencies));
app.use("/api", createAiRoutes(dependencies));
app.use("/api/places", createPlacesRoutes(dependencies));
app.use("/api", createBudgetRoutes(dependencies));
app.use("/api/categories", createCategoryRoutes({ loadData, saveData }));
app.use("/api/goals", createGoalRoutes(dependencies));

app.post("/api/places/detail", async (req, res) => {
  // Detail API that could be moved fully to placesController
  // Keeping simple fallback to preserve original behavior if it was complex
  return res
    .status(501)
    .json({ error: "Not fully migrated in this refactor." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_PUBLIC_DIR, "index.html"));
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend Server đang chạy tại http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("SmartSpend server startup failed:", error);
  process.exit(1);
});
