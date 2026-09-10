import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import creatorRoutes from "./routes/creator.js";
import brandRoutes from "./routes/brand.js";
import guideRoutes from "./routes/guide.js";

const port = Number(process.env.PORT ?? 8080);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const sessionSecret = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  await app.register(cookie, {
    secret: sessionSecret,
  });

  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1" });
  await app.register(meRoutes, { prefix: "/api/v1" });
  await app.register(creatorRoutes, { prefix: "/api/v1" });
  await app.register(brandRoutes, { prefix: "/api/v1" });
  await app.register(guideRoutes, { prefix: "/api/v1" });

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
