console.log("Server is running, all works has done");
import express from "express";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import filmRoutes from "./routes/film.routes.js";
import { debug } from "util";
import "./docs/routes.doc.js";
import { generateOpenAPIDocument } from "./docs/openapi.registry.js";
import swaggerUi from "swagger-ui-express";
import saleRoutes from "./routes/sale.routes.js";
import proiezioneRoutes from "./routes/proiezione.routes.js";

const PORT = process.env.PORT || 3000;

const app = express();

const server = app.listen(PORT);

const openApiDocument = generateOpenAPIDocument();

app.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});

app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api/v1/films", filmRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/proiezioni", proiezioneRoutes);

// 1. Handler per le rotte non trovate (404)
app.use(notFoundHandler);

// 2. Middleware centrale di error handling (DEVE essere l'ultimo app.use)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
