const { v4: uuidv4 } = require("uuid");

/**
 * @interface AuthUtils
 * @description Provides common authentication utilities.
 */

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeInviteCode(value = "") {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function findUserByInviteCode(data, inviteCode = "") {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) return null;
  return (
    (data.users || []).find(
      (item) => normalizeInviteCode(item.inviteCode) === normalizedCode,
    ) || null
  );
}

function createUniqueInviteCode(data) {
  let inviteCode = "";
  do {
    inviteCode = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
  } while (findUserByInviteCode(data, inviteCode));
  return inviteCode;
}

function ensureUserInviteCode(data, user) {
  if (!user) return "";
  const currentCode = normalizeInviteCode(user.inviteCode);
  const duplicate = currentCode
    ? (data.users || []).some(
        (item) =>
          item !== user &&
          normalizeInviteCode(item.inviteCode) === currentCode,
      )
    : false;

  if (!currentCode || duplicate) {
    user.inviteCode = createUniqueInviteCode(data);
  } else if (user.inviteCode !== currentCode) {
    user.inviteCode = currentCode;
  }

  user.referralCount = Number(user.referralCount || 0);
  return user.inviteCode;
}

function getUserFromToken(req, loadData) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";
  if (!token) return null;
  const data = loadData();
  return (data.users || []).find((item) => item.token === token) || null;
}

function findUserByLogin(data, login = "") {
  const normalizedLogin = normalizeEmail(login);
  return (
    (data.users || []).find((item) => {
      return (
        normalizeEmail(item.username) === normalizedLogin ||
        normalizeEmail(item.email) === normalizedLogin
      );
    }) || null
  );
}

function findUserByProvider(data, provider, providerId, email) {
  const normalizedProvider = String(provider || "")
    .trim()
    .toLowerCase();
  const normalizedProviderId = String(providerId || "").trim();
  const normalizedEmail = normalizeEmail(email);
  return (
    (data.users || []).find((item) => {
      const sameProvider =
        item.authProvider === normalizedProvider &&
        item.providerId === normalizedProviderId;
      const sameEmail =
        normalizedEmail && normalizeEmail(item.email) === normalizedEmail;
      return sameProvider || sameEmail;
    }) || null
  );
}

function upsertSocialUser(data, { provider, providerId, name, email, avatar }) {
  data.users = data.users || [];
  const normalizedProvider = String(provider || "")
    .trim()
    .toLowerCase();
  const normalizedEmail = normalizeEmail(email);
  const stableProviderId = String(providerId || normalizedEmail).trim();
  let user = findUserByProvider(
    data,
    normalizedProvider,
    stableProviderId,
    normalizedEmail,
  );
  const token = uuidv4();
  const providerAvatar =
    avatar ||
    (normalizedProvider === "facebook"
      ? "assets/images/female.png"
      : "assets/logo/app-logo.svg");

  if (user) {
    user.fullName = name;
    user.email = normalizedEmail;
    user.avatar = providerAvatar;
    user.authProvider = normalizedProvider;
    user.providerId = stableProviderId;
    user.token = token;
    user.updatedAt = new Date().toISOString();
    ensureUserInviteCode(data, user);
    return user;
  }

  user = {
    id: uuidv4(),
    username: normalizedEmail,
    password: "",
    fullName: name,
    email: normalizedEmail,
    birthday: "",
    phone: "",
    avatar: providerAvatar,
    wallet: 0,
    authProvider: normalizedProvider,
    providerId: stableProviderId,
    createdAt: new Date().toISOString(),
    token,
    inviteCode: createUniqueInviteCode(data),
    referralCount: 0,
  };
  data.users.push(user);
  return user;
}

function sanitizeUser(user = {}) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName || "",
    email: user.email || "",
    birthday: user.birthday || "",
    phone: user.phone || "",
    avatar: user.avatar || "assets/logo/app-logo.svg",
    wallet: Number(user.wallet || 0),
    createdAt: user.createdAt || "",
    authProvider: user.authProvider || "password",
    inviteCode: normalizeInviteCode(user.inviteCode),
    referralCount: Number(user.referralCount || 0),
    referredByUserId: user.referredByUserId || "",
  };
}

function findCurrentUser(req, loadData, currentData) {
  const data = currentData || loadData();
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";
  if (token) {
    return (data.users || []).find((item) => item.token === token) || null;
  }
  const username = req.session?.user?.username;
  if (!username) return null;
  return (data.users || []).find((item) => item.username === username);
}

function getUserId(user) {
  return user?.id || user?.username || "";
}

function getLoginRateLimitKey(req, username = "") {
  const login = normalizeEmail(username) || "unknown";
  const ip = req.ip || req.socket?.remoteAddress || "local";
  return `${login}:${ip}`;
}

function getLoginRateLimitState(req, username, loginRateLimits) {
  const key = getLoginRateLimitKey(req, username);
  const state = loginRateLimits.get(key) || { attempts: 0, lockUntil: 0 };
  const remainingMs = Math.max(0, state.lockUntil - Date.now());
  return {
    key,
    state,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
  };
}

function recordFailedLogin(req, username, loginRateLimits) {
  const { key, state } = getLoginRateLimitState(req, username, loginRateLimits);
  const attempts = Number(state.attempts || 0) + 1;
  const lockSeconds = attempts > 5 ? (attempts - 5) * 10 : 0;
  const nextState = {
    attempts,
    lockUntil: lockSeconds > 0 ? Date.now() + lockSeconds * 1000 : 0,
  };
  loginRateLimits.set(key, nextState);

  return {
    attempts,
    retryAfterSeconds: lockSeconds,
  };
}

function clearLoginRateLimit(req, username, loginRateLimits) {
  loginRateLimits.delete(getLoginRateLimitKey(req, username));
}

module.exports = {
  normalizeEmail,
  normalizeInviteCode,
  findUserByInviteCode,
  createUniqueInviteCode,
  ensureUserInviteCode,
  getUserFromToken,
  findUserByLogin,
  findUserByProvider,
  upsertSocialUser,
  sanitizeUser,
  findCurrentUser,
  getUserId,
  getLoginRateLimitKey,
  getLoginRateLimitState,
  recordFailedLogin,
  clearLoginRateLimit,
};
