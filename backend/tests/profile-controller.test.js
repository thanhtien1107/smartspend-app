const test = require("node:test");
const assert = require("node:assert/strict");
const { createAuthController } = require("../src/modules/auth/authController");

function createHarness() {
  const data = {
    users: [
      {
        id: "user-1",
        username: "first@example.com",
        email: "first@example.com",
        fullName: "First User",
        phone: "",
        birthday: "",
        password: "oldpass",
        authProvider: "password",
        token: "token-1",
        inviteCode: "ABC12345",
      },
      {
        id: "user-2",
        username: "second@example.com",
        email: "second@example.com",
        password: "password",
      },
    ],
  };
  const controller = createAuthController({
    loadData: () => data,
    saveData: () => {},
    loginRateLimits: new Map(),
    facebookOAuthStates: new Map(),
    recoveryCodes: new Map(),
    emailService: null,
    env: {},
  });
  return { data, controller };
}

function createRequest(body) {
  return {
    body,
    headers: { authorization: "Bearer token-1" },
    session: {},
  };
}

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("profile update persists contact information", () => {
  const { controller, data } = createHarness();
  const response = createResponse();
  controller.profilePut(
    createRequest({
      fullName: "Updated User",
      email: "updated@example.com",
      birthday: "2000-01-01",
      phone: "0912345678",
    }),
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(data.users[0].fullName, "Updated User");
  assert.equal(data.users[0].email, "updated@example.com");
  assert.equal(data.users[0].phone, "0912345678");
  assert.equal(response.payload.user.password, undefined);
});

test("profile update rejects an email owned by another account", () => {
  const { controller } = createHarness();
  const response = createResponse();
  controller.profilePut(
    createRequest({
      fullName: "First User",
      email: "second@example.com",
      birthday: "",
      phone: "",
    }),
    response,
  );

  assert.equal(response.statusCode, 409);
  assert.match(response.payload.error, /đã được sử dụng/);
});

test("password change verifies current password", () => {
  const { controller, data } = createHarness();
  const invalidResponse = createResponse();
  controller.changePassword(
    createRequest({ currentPassword: "wrong", newPassword: "newpass1" }),
    invalidResponse,
  );
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(data.users[0].password, "oldpass");

  const validResponse = createResponse();
  controller.changePassword(
    createRequest({ currentPassword: "oldpass", newPassword: "newpass1" }),
    validResponse,
  );
  assert.equal(validResponse.statusCode, 200);
  assert.equal(data.users[0].password, "newpass1");
});
