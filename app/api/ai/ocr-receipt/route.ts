import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const BankStatementSchema = z.object({
  bank_name: z.string().describe("Nombre del banco o institución financiera"),
  extracted_balance: z.number().describe("Balance disponible/corriente al cierre del extracto, en USD"),
  statement_period_end: z.string().describe("Fecha de cierre del extracto en formato YYYY-MM-DD"),
});

interface RequestBody {
  image: string;
}

export async function POST(req: Request): Promise<Response> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image || !body.image.startsWith("data:image/")) {
    return Response.json({ error: "'image' must be a data: URL" }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: BankStatementSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the available/current balance from this bank statement image (in USD). Ignore credit-card 'total balance' if a checking balance is shown; prefer 'Available balance'. Return bank name, balance and statement end date (YYYY-MM-DD).",
            },
            { type: "image", image: body.image },
          ],
        },
      ],
    });

    return Response.json({
      data: {
        bank_name: object.bank_name,
        extracted_balance: object.extracted_balance,
        statement_period_end: object.statement_period_end,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return Response.json({ error: message }, { status: 500 });
  }
}