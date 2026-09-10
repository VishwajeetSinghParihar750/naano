import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../lib/auth.js";

const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", async (req, reply) => {
    const user = await getSessionUser(req);
    if (!user) {
      return reply
        .code(401)
        .send({ error: { code: "unauthorized", message: "Not signed in" } });
    }
    return reply.send({ user });
  });
};

export default meRoutes;
