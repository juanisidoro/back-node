const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('name').optional().isString().trim().escape().withMessage('El nombre debe ser una cadena de texto'),
  body('email').isEmail().normalizeEmail().withMessage('El correo no es válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateRegister };
