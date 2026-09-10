import type { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({ ok: true as const }));
};

export default healthRoutes;
