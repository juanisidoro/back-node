const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');

module.exports = (app) => {
  app.use(helmet());

  app.use(
    cors({
      origin:  process.env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'X-CSRF-Token',
        'Authorization',
      ],
    })
  );
  

  app.use(xss());
};
