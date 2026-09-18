import { z } from "zod";
import { transformJSONSchema } from "@anthropic-ai/sdk/lib/transform-json-schema";

/**
 * Wandelt ein Zod-v3-Schema in ein JSON-Schema für Structured Outputs um.
 *
 * Hintergrund: `zodOutputFormat()` aus dem SDK erwartet Zod-v4-Schemas
 * (`zod/v4`), `@briefklar/shared` ist aber mit dem klassischen `zod`-Export (v3)
 * gebaut. Statt das Shared-Paket umzubauen, übersetzen wir hier die kleine
 * Teilmenge an Zod-Typen, die `ExplainResult` nutzt, und schicken das Ergebnis
 * durch denselben `transformJSONSchema`-Schritt, den auch `zodOutputFormat` nutzt.
 */
export type JsonSchema = Record<string, unknown>;

export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  return transformJSONSchema(convert(schema));
}

function convert(schema: z.ZodTypeAny): JsonSchema {
  const out = convertInner(schema);
  if (schema.description && !out.description) out.description = schema.description;
  return out;
}

function convertInner(schema: z.ZodTypeAny): JsonSchema {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = convert(value);
      required.push(key);
    }
    return { type: "object", properties, required, additionalProperties: false };
  }
  if (schema instanceof z.ZodString) return { type: "string" };
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };
  if (schema instanceof z.ZodNumber) {
    const isInt = schema._def.checks.some((c) => c.kind === "int");
    const out: JsonSchema = { type: isInt ? "integer" : "number" };
    for (const check of schema._def.checks) {
      if (check.kind === "min") out.minimum = check.value;
      if (check.kind === "max") out.maximum = check.value;
    }
    return out;
  }
  if (schema instanceof z.ZodEnum) return { type: "string", enum: [...(schema.options as string[])] };
  if (schema instanceof z.ZodLiteral) {
    const v = schema.value as unknown;
    return { type: typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "string", enum: [v] };
  }
  if (schema instanceof z.ZodArray) return { type: "array", items: convert(schema.element as z.ZodTypeAny) };
  if (schema instanceof z.ZodNullable) {
    return { anyOf: [convert(schema.unwrap() as z.ZodTypeAny), { type: "null" }] };
  }
  if (schema instanceof z.ZodOptional) return convert(schema.unwrap() as z.ZodTypeAny);
  if (schema instanceof z.ZodDefault) return convert(schema._def.innerType as z.ZodTypeAny);
  if (schema instanceof z.ZodEffects) return convert(schema.innerType() as z.ZodTypeAny);
  const typeName = (schema._def as { typeName?: string }).typeName ?? "unknown";
  throw new Error(`zodToJsonSchema: nicht unterstützter Zod-Typ ${typeName}`);
}
