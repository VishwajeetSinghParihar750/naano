import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import healthRoutes from "./routes/health.js";

const port = Number(process.env.PORT ?? 8080);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  await app.register(healthRoutes, { prefix: "/api/v1" });

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
