import { tool as createTool } from "ai";
import { z } from "zod";

export const echoTool = createTool({
  description: "Echo back provided message. Useful for diagnostics and piping.",
  inputSchema: z.object({
    message: z.string().min(1).describe("Text to echo back"),
    uppercase: z.boolean().optional().describe("Return uppercased text"),
  }),
  async execute({ message, uppercase }) {
    const value = uppercase ? message.toUpperCase() : message;
    return {
      echoed: value,
      length: value.length,
    };
  },
});
