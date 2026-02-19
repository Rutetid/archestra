import fastifyHttpProxy from "@fastify/http-proxy";
import { RouteId } from "@shared";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import config from "@/config";
import logger from "@/logging";
import { constructResponseSchema, Minimax, UuidIdSchema } from "@/types";
import { minimaxAdapterFactory } from "../adapterV2";
import { PROXY_API_PREFIX, PROXY_BODY_LIMIT } from "../common";
import { handleLLMProxy } from "../llm-proxy-handler";

const minimaxProxyRoutesV2: FastifyPluginAsyncZod = async (fastify) => {
  const API_PREFIX = `${PROXY_API_PREFIX}/minimax`;
  const CHAT_COMPLETIONS_SUFFIX = "/chat/completions";

  logger.info("[UnifiedProxy] Registering unified MiniMax routes");

  await fastify.register(fastifyHttpProxy, {
    upstream: config.llm.minimax.baseUrl as string,
    prefix: API_PREFIX,
    rewritePrefix: "",
    preHandler: (request, _reply, next) => {
      if (
        request.method === "POST" &&
        request.url.includes(CHAT_COMPLETIONS_SUFFIX)
      ) {
        logger.info(
          {
            method: request.method,
            url: request.url,
            action: "skip-proxy",
            reason: "handled-by-custom-handler",
          },
          "MiniMax proxy preHandler: skipping chat/completions route",
        );
        next(new Error("skip"));
        return;
      }

      const pathAfterPrefix = request.url.replace(API_PREFIX, "");
      const uuidMatch = pathAfterPrefix.match(
        /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/.*)?$/i,
      );

      if (uuidMatch) {
        const remainingPath = uuidMatch[2] || "";
        const originalUrl = request.raw.url;
        request.raw.url = `${API_PREFIX}${remainingPath}`;

        logger.info(
          {
            method: request.method,
            originalUrl,
            rewrittenUrl: request.raw.url,
            upstream: config.llm.minimax.baseUrl,
            finalProxyUrl: `${config.llm.minimax.baseUrl}${remainingPath}`,
          },
          "MiniMax proxy preHandler: URL rewritten (UUID stripped)",
        );
      } else {
        logger.info(
          {
            method: request.method,
            url: request.url,
            upstream: config.llm.minimax.baseUrl,
            finalProxyUrl: `${config.llm.minimax.baseUrl}${pathAfterPrefix}`,
          },
          "MiniMax proxy preHandler: proxying request",
        );
      }

      next();
    },
  });

  fastify.post(
    `${API_PREFIX}${CHAT_COMPLETIONS_SUFFIX}`,
    {
      bodyLimit: PROXY_BODY_LIMIT,
      schema: {
        operationId: RouteId.MinimaxChatCompletionsWithDefaultAgent,
        description:
          "Create a chat completion with MiniMax (uses default agent)",
        tags: ["llm-proxy"],
        body: Minimax.API.ChatCompletionRequestSchema,
        headers: Minimax.API.ChatCompletionHeadersSchema,
        response: constructResponseSchema(
          Minimax.API.ChatCompletionResponseSchema,
        ),
      },
    },
    async (request, reply) => {
      logger.debug(
        { url: request.url },
        "[UnifiedProxy] Handling MiniMax request (default agent)",
      );
      return handleLLMProxy(
        request.body,
        request,
        reply,
        minimaxAdapterFactory,
      );
    },
  );

  fastify.post(
    `${API_PREFIX}/:agentId${CHAT_COMPLETIONS_SUFFIX}`,
    {
      bodyLimit: PROXY_BODY_LIMIT,
      schema: {
        operationId: RouteId.MinimaxChatCompletionsWithAgent,
        description:
          "Create a chat completion with MiniMax for a specific agent",
        tags: ["llm-proxy"],
        params: z.object({
          agentId: UuidIdSchema,
        }),
        body: Minimax.API.ChatCompletionRequestSchema,
        headers: Minimax.API.ChatCompletionHeadersSchema,
        response: constructResponseSchema(
          Minimax.API.ChatCompletionResponseSchema,
        ),
      },
    },
    async (request, reply) => {
      logger.debug(
        { url: request.url, agentId: request.params.agentId },
        "[UnifiedProxy] Handling MiniMax request (with agent)",
      );
      return handleLLMProxy(
        request.body,
        request,
        reply,
        minimaxAdapterFactory,
      );
    },
  );
};

export default minimaxProxyRoutesV2;
