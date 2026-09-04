// Authentification simple (session + bcrypt) et protection CSRF des formulaires admin.

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/admin/login');
}

function csrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function csrfProtect(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.body && req.body._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).send('Requête refusée (jeton CSRF invalide). Rechargez la page et réessayez.');
    }
  }
  next();
}

module.exports = { requireAuth, csrfToken, csrfProtect };
