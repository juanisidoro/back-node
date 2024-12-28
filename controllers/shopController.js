const { deleteShopWithNoMembers } = require('../services/shopService');

// Handler para eliminar una tienda sin usuarios asignados
async function removeShopWithNoMembersHandler(req, res) {
  const { shopId } = req.params;

  try {
    const success = await deleteShopWithNoMembers(shopId);

    if (!success) {
      return res.status(400).json({ message: 'La tienda tiene usuarios asignados y no puede ser eliminada.' });
    }

    return res.status(200).json({ message: 'Tienda eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar la tienda:', error);
    return res.status(500).json({ message: 'Ocurrió un error al intentar eliminar la tienda.' });
  }
}

module.exports = {
  removeShopWithNoMembersHandler,
};
