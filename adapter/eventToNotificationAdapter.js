const { getShopAndOwnerByOrigin } = require('../services/firebase/shopService');

async function convertEcommerceEvent(event) {
  // Validar las propiedades requeridas
  const requiredProperties = [
    'origin',
    'source',
    'user_agent',
    'user_ip',
    'initial_state',
    'updated_state',
    'object_type',
    'action',
    'object_id',
    'actor_user_id',
    'timestamp',
  ];

  for (const prop of requiredProperties) {
    if (!event[prop]) {
      throw new Error(`La propiedad requerida '${prop}' está ausente en el evento.`);
    }
  }

  // Obtener el shopId y userId
  const resource = await getShopAndOwnerByOrigin(event.origin);

  // Construir el objeto transformado
  return {
    type: `${event.object_type}.${event.action}`,
    timestamp: event.timestamp,
    actor: {
      role: event.source,
      id: `user_${event.actor_user_id}`,
    },
    status: {
      success: true,
      read: false,
    },
    message: `${event.object_type}.${event.action}`,
    resource,
    payload: { ...event }, // Incluye todas las propiedades originales
  };
}

module.exports = { convertEcommerceEvent };
