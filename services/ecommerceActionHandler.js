// services/ecommerceActionHandler.js

async function handlerActionWoo(notification) {
    const { payload } = notification;
  
    if (!payload || !payload.origin || !payload.object_id) {
      throw new Error('La notificación convertida no contiene las propiedades necesarias para procesar.');
    }
  
    console.log(`Generando petición a ${payload.origin}, para obtener el ${payload.object_id}`);
    // Aquí puedes añadir lógica adicional si necesitas realizar alguna acción con la notificación.
  }
  
  module.exports = { handlerActionWoo };
  