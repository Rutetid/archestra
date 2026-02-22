import { z } from "zod";

const FunctionToolCallSchema = z
  .object({
    id: z.string(),
    type: z.enum(["function"]),
    function: z
      .object({
        arguments: z.string(),
        name: z.string(),
      })
      .describe(
        `https://platform.minimax.io/docs/api-reference/text-openai-api`,
      ),
  })
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

export const ToolCallSchema = z
  .union([FunctionToolCallSchema])
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

/**
 * Reasoning detail object in assistant messages
 * Contains the model's thinking process
 */
const ReasoningDetailSchema = z.object({
  text: z.string(),
});

const SystemMessageParamSchema = z
  .object({
    role: z.enum(["system"]),
    content: z.string(),
    name: z.string().optional(),
  })
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

const UserMessageParamSchema = z
  .object({
    role: z.enum(["user"]),
    /**
     * MiniMax does not support image or audio inputs in OpenAI API mode
     * Content must be string only
     */
    content: z.string(),
    name: z.string().optional(),
  })
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

const AssistantMessageParamSchema = z
  .object({
    role: z.enum(["assistant"]),
    content: z.string().nullable().optional(),
    name: z.string().optional(),
    /**
     * Array of reasoning details (thinking content)
     * Present when reasoning_split=True is used in request
     */
    reasoning_details: z.array(ReasoningDetailSchema).optional(),
    tool_calls: z.array(ToolCallSchema).optional(),
  })
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

const ToolMessageParamSchema = z
  .object({
    role: z.enum(["tool"]),
    content: z.string(),
    tool_call_id: z.string(),
  })
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);

export const MessageParamSchema = z
  .union([
    SystemMessageParamSchema,
    UserMessageParamSchema,
    AssistantMessageParamSchema,
    ToolMessageParamSchema,
  ])
  .describe(`https://platform.minimax.io/docs/api-reference/text-openai-api`);
