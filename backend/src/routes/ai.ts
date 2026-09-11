import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import {
  streamAssistantReply,
  type AiChatMessage,
} from "../services/ai.service.js";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post("/ai/chat", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "validation_error",
          message: "Invalid chat payload.",
        },
      });
    }

    if (!process.env.DEEPSEEK_API_KEY?.trim()) {
      return reply.code(503).send({
        error: {
          code: "ai_unavailable",
          message:
            "The assistant is not configured yet. Add DEEPSEEK_API_KEY on the server.",
        },
      });
    }

    const history = parsed.data.messages as AiChatMessage[];
    const last = history[history.length - 1];
    if (!last || last.role !== "user") {
      return reply.code(400).send({
        error: {
          code: "validation_error",
          message: "The last message must be from the user.",
        },
      });
    }

    const origin = req.headers.origin;
    const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
    const corsHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    };
    // reply.hijack() bypasses @fastify/cors — mirror credentials CORS manually
    if (origin === allowedOrigin) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
      corsHeaders["Access-Control-Allow-Credentials"] = "true";
      corsHeaders.Vary = "Origin";
    }

    reply.hijack();
    reply.raw.writeHead(200, corsHeaders);

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      writeEvent("status", { state: "generating" });
      await streamAssistantReply(history, (text) => {
        writeEvent("delta", { text });
      });
      writeEvent("done", { ok: true });
    } catch (err) {
      req.log.error({ err }, "DeepSeek chat failed");
      writeEvent("error", {
        message: "Something went wrong. Please try again.",
      });
    } finally {
      reply.raw.end();
    }
  });
};

export default aiRoutes;
