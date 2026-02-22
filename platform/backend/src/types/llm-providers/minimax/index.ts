/**
 * NOTE: this is a bit of a PITA/verbose but in order to properly type everything that we are
 * proxying.. this is kinda necessary.
 *
 * MiniMax provides an OpenAI-compatible API, so we define Zod schemas based on their docs
 */
import type { z } from "zod";
import * as MinimaxAPI from "./api";
import * as MinimaxMessages from "./messages";
import * as MinimaxTools from "./tools";

namespace Minimax {
  export const API = MinimaxAPI;
  export const Messages = MinimaxMessages;
  export const Tools = MinimaxTools;

  export namespace Types {
    export type ChatCompletionsHeaders = z.infer<
      typeof MinimaxAPI.ChatCompletionHeadersSchema
    >;
    export type ChatCompletionsRequest = z.infer<
      typeof MinimaxAPI.ChatCompletionRequestSchema
    >;
    export type ChatCompletionsResponse = z.infer<
      typeof MinimaxAPI.ChatCompletionResponseSchema
    >;
    export type Usage = z.infer<typeof MinimaxAPI.ChatCompletionUsageSchema>;

    export type FinishReason = z.infer<typeof MinimaxAPI.FinishReasonSchema>;
    export type Message = z.infer<typeof MinimaxMessages.MessageParamSchema>;
    export type Role = Message["role"];

    /**
     * Streaming response chunk
     * Similar to OpenAI but with reasoning_details array for thinking content
     */
    export type ChatCompletionChunk = {
      id: string;
      object: "chat.completion.chunk";
      created: number;
      model: string;
      choices: Array<{
        index: number;
        delta: {
          role?: "assistant" | "";
          content?: string;
          /**
           * Array of reasoning details (thinking content)
           * Only present when reasoning_split=True is used in request
           */
          reasoning_details?: Array<{
            text?: string;
          }>;
          tool_calls?: Array<{
            index: number;
            id?: string;
            type?: "function";
            function?: {
              name?: string;
              arguments?: string;
            };
          }>;
        };
        finish_reason: string | null;
      }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  }
}

export default Minimax;
