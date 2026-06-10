const { v4: uuidv4 } = require("uuid");
const {
  normalizeEmail,
  normalizeInviteCode,
  findUserByLogin,
  findUserByProvider,
  findUserByInviteCode,
  upsertSocialUser,
  createUniqueInviteCode,
  ensureUserInviteCode,
  sanitizeUser,
  getLoginRateLimitState,
  recordFailedLogin,
  clearLoginRateLimit,
  findCurrentUser,
} = require("../../utils/authUtils");
const { hasConfiguredKey } = require("../../utils/requestUtils");

/**
 * @interface AuthController
 * @description Exposes methods for authentication routing.
 */
function createAuthController(dependencies) {
  const {
    loadData,
    saveData,
    loginRateLimits,
    facebookOAuthStates,
    recoveryCodes,
    emailService,
    env,
  } = dependencies;

  const {
    GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    FACEBOOK_GRAPH_VERSION,
    PUBLIC_APP_URL,
    FRONTEND_URL,
    VITE_FRONTEND_URL,
  } = env;

  function getRequestBaseUrl(req) {
    return PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
  }

  function getFrontendBaseUrl() {
    return FRONTEND_URL || VITE_FRONTEND_URL || "http://localhost:5173";
  }

  function redirectToFacebookLoginResult(res, params = {}) {
    const url = new URL("/login", getFrontendBaseUrl());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return res.redirect(url.toString());
  }

  function resolveInviter(data, inviteCode) {
    const normalizedCode = normalizeInviteCode(inviteCode);
    if (!normalizedCode) return { inviter: null, inviteCode: "" };
    return {
      inviter: findUserByInviteCode(data, normalizedCode),
      inviteCode: normalizedCode,
    };
  }

  function applyReferral(inviter, user) {
    if (!inviter || !user || inviter.id === user.id || user.referredByUserId) {
      return;
    }
    user.referredByUserId = inviter.id;
    user.referredByInviteCode = inviter.inviteCode;
    inviter.referralCount = Number(inviter.referralCount || 0) + 1;
  }

  return {
    login(req, res) {
      const { username, password } = req.body;
      const rateLimit = getLoginRateLimitState(req, username, loginRateLimits);
      if (rateLimit.retryAfterSeconds > 0) {
        return res.status(429).json({
          error: `Vui lòng nhập lại sau ${rateLimit.retryAfterSeconds}s`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        });
      }

      const data = loadData();
      const user = findUserByLogin(data, username);
      if (!user || user.password !== password) {
        const failed = recordFailedLogin(req, username, loginRateLimits);
        if (failed.retryAfterSeconds > 0) {
          return res.status(429).json({
            error: `Vui lòng nhập lại sau ${failed.retryAfterSeconds}s`,
            retryAfterSeconds: failed.retryAfterSeconds,
            failedAttempts: failed.attempts,
          });
        }
        return res.status(401).json({
          error: "Tài khoản hoặc mật khẩu không đúng",
          failedAttempts: failed.attempts,
        });
      }

      clearLoginRateLimit(req, username, loginRateLimits);
      const token = uuidv4();
      user.token = token;
      ensureUserInviteCode(data, user);
      saveData(data);
      req.session.user = sanitizeUser(user);
      res.json({ authenticated: true, user: sanitizeUser(user), token });
    },

    socialLogin(req, res) {
      const { provider, providerId, name, email, avatar, inviteCode } = req.body;
      const normalizedProvider = String(provider || "")
        .trim()
        .toLowerCase();
      const normalizedEmail = normalizeEmail(email);
      if (!["google", "facebook"].includes(normalizedProvider)) {
        return res
          .status(400)
          .json({ error: "Nhà cung cấp đăng nhập không hợp lệ." });
      }
      if (!name || !normalizedEmail) {
        return res
          .status(400)
          .json({ error: "Tên và email từ Gmail/Facebook là bắt buộc." });
      }

      const data = loadData();
      const existingUser = findUserByProvider(
        data,
        normalizedProvider,
        providerId,
        normalizedEmail,
      );
      const referral = existingUser
        ? { inviter: null, inviteCode: "" }
        : resolveInviter(data, inviteCode);
      if (referral.inviteCode && !referral.inviter) {
        return res.status(400).json({ error: "Mã mời không hợp lệ." });
      }
      const user = upsertSocialUser(data, {
        provider: normalizedProvider,
        providerId,
        name,
        email: normalizedEmail,
        avatar,
      });
      if (!existingUser) applyReferral(referral.inviter, user);
      saveData(data);
      req.session.user = sanitizeUser(user);
      res.json({
        authenticated: true,
        user: sanitizeUser(user),
        token: user.token,
      });
    },

    async socialLoginGoogle(req, res) {
      const { credential, inviteCode } = req.body;
      if (
        !hasConfiguredKey(
          GOOGLE_CLIENT_ID,
          "your_google_oauth_client_id.apps.googleusercontent.com",
        )
      ) {
        return res
          .status(501)
          .json({ error: "GOOGLE_CLIENT_ID chưa được cấu hình trong .env." });
      }
      if (!credential) {
        return res.status(400).json({ error: "Thiếu Google credential." });
      }

      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        );
        const profile = await verifyRes.json();
        if (!verifyRes.ok) {
          return res.status(401).json({
            error:
              profile.error_description || "Google credential không hợp lệ.",
          });
        }
        if (profile.aud !== GOOGLE_CLIENT_ID) {
          return res.status(401).json({
            error: "Google credential không thuộc client id của ứng dụng.",
          });
        }
        if (
          profile.email_verified !== "true" &&
          profile.email_verified !== true
        ) {
          return res
            .status(401)
            .json({ error: "Email Google chưa được xác minh." });
        }

        const data = loadData();
        const existingUser = findUserByProvider(
          data,
          "google",
          profile.sub,
          profile.email,
        );
        const referral = existingUser
          ? { inviter: null, inviteCode: "" }
          : resolveInviter(data, inviteCode);
        if (referral.inviteCode && !referral.inviter) {
          return res.status(400).json({ error: "Mã mời không hợp lệ." });
        }
        const user = upsertSocialUser(data, {
          provider: "google",
          providerId: profile.sub,
          name: profile.name || profile.email,
          email: profile.email,
          avatar: profile.picture || "assets/logo/app-logo.svg",
        });
        if (!existingUser) applyReferral(referral.inviter, user);
        saveData(data);
        req.session.user = sanitizeUser(user);
        res.json({
          authenticated: true,
          user: sanitizeUser(user),
          token: user.token,
        });
      } catch (error) {
        console.error("Google login verify error:", error);
        res.status(502).json({
          error: "Không thể xác minh tài khoản Google. Vui lòng thử lại.",
        });
      }
    },

    authFacebook(req, res) {
      if (
        !hasConfiguredKey(FACEBOOK_APP_ID, "your_facebook_app_id") ||
        !hasConfiguredKey(FACEBOOK_APP_SECRET, "your_facebook_app_secret")
      ) {
        return res
          .status(501)
          .send(
            "FACEBOOK_APP_ID và FACEBOOK_APP_SECRET chưa được cấu hình trong .env.",
          );
      }
      const state = uuidv4();
      const inviteCode = normalizeInviteCode(req.query.invite);
      req.session.facebookOAuthState = state;
      facebookOAuthStates.set(state, {
        createdAt: Date.now(),
        inviteCode,
      });
      const redirectUri = `${getRequestBaseUrl(req)}/api/auth/facebook/callback`;
      const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        state,
        scope: "email,public_profile",
        response_type: "code",
      });
      res.redirect(
        `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`,
      );
    },

    async authFacebookCallback(req, res) {
      if (
        !hasConfiguredKey(FACEBOOK_APP_ID, "your_facebook_app_id") ||
        !hasConfiguredKey(FACEBOOK_APP_SECRET, "your_facebook_app_secret")
      ) {
        return res
          .status(501)
          .send(
            "FACEBOOK_APP_ID và FACEBOOK_APP_SECRET chưa được cấu hình trong .env.",
          );
      }
      const state = String(req.query.state || "");
      const oauthState = facebookOAuthStates.get(state);
      const hasValidState = Boolean(
        state &&
        (facebookOAuthStates.has(state) ||
          state === req.session.facebookOAuthState),
      );
      if (hasValidState) facebookOAuthStates.delete(state);
      if (!req.query.code || !hasValidState) {
        return redirectToFacebookLoginResult(res, {
          error: "Facebook callback khong hop le.",
        });
      }

      try {
        const redirectUri = `${getRequestBaseUrl(req)}/api/auth/facebook/callback`;
        const tokenParams = new URLSearchParams({
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code: req.query.code,
        });
        const tokenRes = await fetch(
          `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${tokenParams.toString()}`,
        );
        const tokenBody = await tokenRes.json();
        if (!tokenRes.ok) {
          return redirectToFacebookLoginResult(res, {
            error:
              tokenBody.error?.message ||
              "Khong lay duoc Facebook access token.",
          });
        }

        const profileParams = new URLSearchParams({
          fields: "id,name,email,picture.width(200).height(200)",
          access_token: tokenBody.access_token,
        });
        const profileRes = await fetch(
          `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me?${profileParams.toString()}`,
        );
        const profile = await profileRes.json();
        if (!profileRes.ok || !profile.email) {
          return redirectToFacebookLoginResult(res, {
            error:
              profile.error?.message ||
              "Facebook khong tra ve email. Hay cap quyen email cho ung dung.",
          });
        }

        const data = loadData();
        const existingUser = findUserByProvider(
          data,
          "facebook",
          profile.id,
          profile.email,
        );
        const referral = existingUser
          ? { inviter: null, inviteCode: "" }
          : resolveInviter(data, oauthState?.inviteCode);
        if (referral.inviteCode && !referral.inviter) {
          return redirectToFacebookLoginResult(res, {
            error: "Ma moi khong hop le.",
          });
        }
        const user = upsertSocialUser(data, {
          provider: "facebook",
          providerId: profile.id,
          name: profile.name || profile.email,
          email: profile.email,
          avatar: profile.picture?.data?.url || "assets/images/female.png",
        });
        if (!existingUser) applyReferral(referral.inviter, user);
        saveData(data);
        req.session.user = sanitizeUser(user);
        delete req.session.facebookOAuthState;
        return redirectToFacebookLoginResult(res, {
          social: "facebook",
          token: user.token,
          user: JSON.stringify(sanitizeUser(user)),
        });
      } catch (error) {
        console.error("Facebook login error:", error);
        return redirectToFacebookLoginResult(res, {
          error: "Khong the dang nhap bang Facebook. Vui long thu lai.",
        });
      }
    },

    register(req, res) {
      const {
        username,
        password,
        fullName,
        email,
        wallet,
        avatar,
        birthday,
        inviteCode,
      } = req.body;
      const data = loadData();
      const normalizedEmail = normalizeEmail(email || username);
      const normalizedUsername = normalizeEmail(username || email);
      if (!normalizedUsername || !password) {
        return res
          .status(400)
          .json({ error: "Email và mật khẩu là bắt buộc." });
      }
      data.users = data.users || [];
      const existing = data.users.find((item) => {
        return (
          normalizeEmail(item.username) === normalizedUsername ||
          normalizeEmail(item.email) === normalizedEmail
        );
      });
      if (existing) {
        return res.status(409).json({ error: "Email này đã có tài khoản." });
      }
      const referral = resolveInviter(data, inviteCode);
      if (referral.inviteCode && !referral.inviter) {
        return res.status(400).json({ error: "Mã mời không hợp lệ." });
      }
      const user = {
        id: uuidv4(),
        username: normalizedUsername,
        password,
        fullName: fullName || normalizedUsername,
        email: normalizedEmail || "",
        birthday: birthday || "",
        phone: "",
        avatar: avatar || "assets/logo/app-logo.svg",
        wallet: Number(wallet || 0),
        createdAt: new Date().toISOString(),
        token: uuidv4(),
        inviteCode: createUniqueInviteCode(data),
        referralCount: 0,
      };
      applyReferral(referral.inviter, user);
      data.users.push(user);
      saveData(data);
      req.session.user = sanitizeUser(user);
      res.status(201).json({
        authenticated: true,
        user: sanitizeUser(user),
        token: user.token,
      });
    },

    async passwordRecoveryRequest(req, res) {
      const { username, channel = "gmail" } = req.body;
      const data = loadData();
      const user = findUserByLogin(data, username);
      if (!username) {
        return res.status(400).json({ error: "Email là bắt buộc." });
      }
      if (!user) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy tài khoản với email này." });
      }
      if (channel === "gmail" && !user.email) {
        return res.status(400).json({
          error: "Tài khoản này chưa liên kết Gmail để nhận mã xác minh.",
        });
      }
      const normalizedLogin = normalizeEmail(username);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      recoveryCodes.set(normalizedLogin, {
        code,
        channel: channel === "facebook" ? "facebook" : "gmail",
        verified: false,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      // Attempt to send OTP via email
      const recipientEmail = user.email || normalizedLogin;
      let emailResult = { success: false, devMode: true };
      if (emailService && typeof emailService.sendOtpEmail === 'function') {
        try {
          emailResult = await emailService.sendOtpEmail(recipientEmail, code);
        } catch (emailErr) {
          console.error('[passwordRecoveryRequest] emailService error:', emailErr.message);
          emailResult = { success: false, devMode: false, error: emailErr.message };
        }
      }

      const responsePayload = {
        success: true,
        message: emailResult.devMode
          ? `Mã xác minh đã được tạo (chế độ dev).`
          : emailResult.success
            ? `Mã xác minh đã được gửi đến Gmail ${recipientEmail}.`
            : `Gửi email thất bại, nhưng mã đã được tạo (chế độ dev).`,
      };

      // Only expose devCode outside production (for development/testing)
      const isProduction = process.env.NODE_ENV === 'production';
      const gmailConfigured = emailService && emailService.isConfigured && emailService.isConfigured();
      if (!isProduction || !gmailConfigured) {
        responsePayload.devCode = code;
      }

      return res.json(responsePayload);
    },

    passwordRecoveryVerify(req, res) {
      const { username, code } = req.body;
      const normalizedLogin = normalizeEmail(username);
      const recovery = recoveryCodes.get(normalizedLogin);
      if (!recovery || recovery.expiresAt < Date.now()) {
        recoveryCodes.delete(normalizedLogin);
        return res
          .status(400)
          .json({ error: "Mã xác minh đã hết hạn. Vui lòng gửi lại mã." });
      }
      if (recovery.code !== String(code || "").trim()) {
        return res.status(400).json({ error: "Mã xác minh không đúng." });
      }
      recovery.verified = true;
      recoveryCodes.set(normalizedLogin, recovery);
      res.json({
        success: true,
        message: "Xác minh thành công. Vui lòng đặt mật khẩu mới.",
      });
    },

    passwordRecoveryReset(req, res) {
      const { username, newPassword } = req.body;
      const normalizedLogin = normalizeEmail(username);
      const recovery = recoveryCodes.get(normalizedLogin);
      if (!recovery || recovery.expiresAt < Date.now() || !recovery.verified) {
        recoveryCodes.delete(normalizedLogin);
        return res
          .status(400)
          .json({ error: "Bạn cần xác minh mã trước khi đặt mật khẩu mới." });
      }
      if (!newPassword) {
        return res.status(400).json({ error: "Mật khẩu mới là bắt buộc." });
      }
      const data = loadData();
      const user = findUserByLogin(data, username);
      if (!user) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy tài khoản với email này." });
      }
      user.password = newPassword;
      user.token = "";
      saveData(data);
      recoveryCodes.delete(normalizedLogin);
      res.json({
        success: true,
        message: "Mật khẩu đã được đặt lại thành công.",
      });
    },

    logout(req, res) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Đăng xuất không thành công" });
        }
        res.json({ success: true });
      });
    },

    session(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData, data);
      if (user) {
        ensureUserInviteCode(data, user);
        saveData(data);
        return res.json({ authenticated: true, user: sanitizeUser(user) });
      }
      res.json({ authenticated: false });
    },

    profileGet(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData, data);
      if (!user) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy hồ sơ người dùng." });
      }
      ensureUserInviteCode(data, user);
      saveData(data);
      res.json(sanitizeUser(user));
    },

    profilePut(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData, data);
      if (!user) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy hồ sơ người dùng." });
      }

      const body = req.body || {};
      const fullName = String(body.fullName ?? user.fullName ?? "").trim();
      const email = normalizeEmail(body.email ?? user.email ?? "");
      const birthday = String(body.birthday ?? user.birthday ?? "").slice(
        0,
        10,
      );
      const rawPhone = String(body.phone ?? user.phone ?? "").trim();
      const phone = rawPhone
        .replace(/[^\d+]/g, "")
        .trim();

      if (!fullName) {
        return res.status(400).json({ error: "Họ và tên không được để trống." });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Email không hợp lệ." });
      }
      const duplicateEmail = (data.users || []).find(
        (item) =>
          item !== user &&
          email &&
          (normalizeEmail(item.email) === email ||
            normalizeEmail(item.username) === email),
      );
      if (duplicateEmail) {
        return res.status(409).json({ error: "Email này đã được sử dụng." });
      }
      if (
        rawPhone &&
        (/[A-Za-z]/.test(rawPhone) || !/^\+?\d{9,15}$/.test(phone))
      ) {
        return res.status(400).json({
          error: "Số điện thoại phải có từ 9 đến 15 chữ số.",
        });
      }
      if (birthday) {
        const birthdayDate = new Date(`${birthday}T00:00:00`);
        if (
          Number.isNaN(birthdayDate.getTime()) ||
          birthdayDate > new Date()
        ) {
          return res.status(400).json({ error: "Ngày sinh không hợp lệ." });
        }
      }

      const allowedFields = [
        "avatar",
        "wallet",
      ];
      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          user[field] =
            field === "wallet" ? Number(body[field] || 0) : body[field];
        }
      });
      user.fullName = fullName;
      user.email = email;
      user.birthday = birthday;
      user.phone = phone;
      user.updatedAt = new Date().toISOString();
      ensureUserInviteCode(data, user);
      saveData(data);
      req.session.user = sanitizeUser(user);
      res.json({ success: true, user: sanitizeUser(user) });
    },

    changePassword(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData, data);
      if (!user) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy hồ sơ người dùng." });
      }
      if (user.authProvider && user.authProvider !== "password") {
        return res.status(400).json({
          error: "Tài khoản mạng xã hội không sử dụng mật khẩu SmartSpend.",
        });
      }

      const body = req.body || {};
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");
      if (!currentPassword || currentPassword !== String(user.password || "")) {
        return res.status(400).json({ error: "Mật khẩu hiện tại không đúng." });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      }
      if (newPassword === currentPassword) {
        return res.status(400).json({
          error: "Mật khẩu mới phải khác mật khẩu hiện tại.",
        });
      }

      user.password = newPassword;
      user.updatedAt = new Date().toISOString();
      saveData(data);
      res.json({ success: true, message: "Đổi mật khẩu thành công." });
    },

    oauthConfig(req, res) {
      res.json({
        googleClientId: hasConfiguredKey(
          GOOGLE_CLIENT_ID,
          "your_google_oauth_client_id.apps.googleusercontent.com",
        )
          ? GOOGLE_CLIENT_ID
          : "",
        facebookAppId: hasConfiguredKey(FACEBOOK_APP_ID, "your_facebook_app_id")
          ? FACEBOOK_APP_ID
          : "",
      });
    },
  };
}

module.exports = {
  createAuthController,
};
