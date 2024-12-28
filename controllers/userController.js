const { assignShopToUser, removeShopFromUser } = require('../services/userService');

// Función de validación del body
function validateBodyParameters(body, allowedKeys) {
  const bodyKeys = Object.keys(body);
  const invalidKeys = bodyKeys.filter((key) => !allowedKeys.includes(key));
  
  if (invalidKeys.length > 0) {
    const error = new Error(`Parámetros no válidos: ${invalidKeys.join(', ')}. Solo se permiten: ${allowedKeys.join(', ')}.`);
    error.statusCode = 400; // HTTP 400: Bad Request
    throw error;
  }
}

// Handler para asignar o actualizar una tienda para un usuario
async function assignShopHandler(req, res) {
  try {
    const { userId, shopId } = req.params;
    const { isOwner = false, notifications_enabled = true } = req.body;

    // Validar que el body contenga únicamente los parámetros permitidos
    validateBodyParameters(req.body, ['isOwner', 'notifications_enabled']);

    // Llama a la función del servicio
    const result = await assignShopToUser(userId, shopId, isOwner, notifications_enabled);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al asignar o actualizar la tienda:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Handler para eliminar una tienda asignada a un usuario
async function removeShopHandler(req, res) {
  try {
    const { userId, shopId } = req.params;

    // Llama a la función del servicio
    const result = await removeShopFromUser(userId, shopId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al eliminar la tienda:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message });
  }
}

module.exports = {
  assignShopHandler,
  removeShopHandler,
};
