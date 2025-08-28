import { getSession } from "auth/server";
import { mcpTemplateRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await mcpTemplateRepository.selectAll();
  return Response.json(list);
}
