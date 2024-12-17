const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const { corsOptions } = require('../utils/config');

module.exports = (app) => {
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(xss());
};
