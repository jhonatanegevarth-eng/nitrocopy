import OpenAI from "openai";
import { getProvider, getBaseURL } from "./provider";
import { MODELS } from "./models";

interface TextOptions {
  system: string;
  user: string;
  apiKey: string;
  jsonMode?: boolean;
  temperature?: number;
  providerOverride?: string | null;
}

export interface TextResult {
  content: string;
  veniceBalance?: number | null;
}

export async function generateText({
  system,
  user,
  apiKey,
  jsonMode = true,
  temperature = 0.85,
  providerOverride,
}: TextOptions): Promise<TextResult> {
  const provider = getProvider(providerOverride);
  const client = new OpenAI({ apiKey, baseURL: getBaseURL(provider) });

  const params: Record<string, unknown> = {
    model: MODELS[provider].text,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  if (provider === "venice") {
    params.venice_parameters = {
      include_venice_system_prompt: false,
      strip_thinking_response: true,
    };
  }

  const completion = await client.chat.completions.create(
    params as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
  );

  return {
    content: completion.choices[0].message.content ?? "",
  };
}
