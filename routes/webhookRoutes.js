// 3. Backend: webhookRoutes.js
const express = require("express");
const asyncHandler = require("express-async-handler");
const { SaveDataShopObjectInDatabase } = require("../services/dataService");

const router = express.Router();

// Clave secreta que solo debe conocer la Cloud Function y tu backend
const SYNC_SECRET = "MiSecretoSuperSeguro123";

router.post(
  "/sync-data",
  asyncHandler(async (req, res) => {
    // 1. Verificar cabecera secreta
    const incomingSecret = req.headers["x-sync-secret"];
    if (incomingSecret !== SYNC_SECRET) {
      console.error("Intento de acceso no autorizado al /webhook/sync-data");
      return res.status(401).json({ message: "No autorizado" });
    }

    // 2. Verificar estructura del body
    const dataShopObject = req.body;
    if (!dataShopObject || !dataShopObject.shop_id) {
      return res.status(400).json({ message: "Datos inválidos o falta el shop_id." });
    }

    try {
      console.log(`Procesando datos sincronizados para la tienda: ${dataShopObject.shop_id}`);
      await SaveDataShopObjectInDatabase(dataShopObject);
      res.status(200).json({ message: "Datos procesados correctamente." });
    } catch (error) {
      console.error(`Error al procesar datos para la tienda ${dataShopObject.shop_id}`, error);
      res.status(500).json({ message: "Error al procesar los datos.", error: error.message });
    }
  })
);

module.exports = router;
