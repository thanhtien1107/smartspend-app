const express = require('express');
const { createAuthController } = require('./authController');

function createAuthRoutes(dependencies) {
  const router = express.Router();
  const controller = createAuthController(dependencies);

  router.post('/login', controller.login);
  router.post('/social-login', controller.socialLogin);
  router.post('/social-login/google', controller.socialLoginGoogle);
  router.get('/auth/facebook', controller.authFacebook);
  router.get('/auth/facebook/callback', controller.authFacebookCallback);
  router.post('/register', controller.register);
  router.post('/password-recovery/request', controller.passwordRecoveryRequest);
  router.post('/password-recovery/verify', controller.passwordRecoveryVerify);
  router.post('/password-recovery/reset', controller.passwordRecoveryReset);
  router.post('/logout', controller.logout);
  router.get('/session', controller.session);
  router.get('/profile', controller.profileGet);
  router.put('/profile', controller.profilePut);
  router.put('/profile/password', controller.changePassword);
  router.get('/oauth/config', controller.oauthConfig);

  return router;
}

module.exports = {
  createAuthRoutes
};
