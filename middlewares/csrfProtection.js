const csrf = require('csurf');

// Middleware de protección CSRF
const csrfProtection = csrf({ cookie: true });

module.exports = csrfProtection;
