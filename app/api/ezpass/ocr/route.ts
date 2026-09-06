import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const EzpPassSchema = z.object({
  transaction_id: z.string().describe("ID único del peaje"),
  date: z.string().describe("Fecha en formato YYYY-MM-DD"),
  time: z.string().describe("Hora en formato HH:MM (24h)"),
  station: z.string().describe("Nombre de la estación/plaza de peaje"),
  amount: z.number().describe("Monto del peaje en USD"),
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
      schema: EzpPassSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the toll transaction from this E-ZPass receipt image. Return transaction_id, date (YYYY-MM-DD), time (HH:MM 24h format), station name, and amount in USD.",
            },
            { type: "image", image: body.image },
          ],
        },
      ],
    });

    return Response.json({
      data: {
        transaction_id: object.transaction_id,
        date: object.date,
        time: object.time,
        station: object.station,
        amount: object.amount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
