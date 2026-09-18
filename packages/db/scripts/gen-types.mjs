// Erzeugt src/database.types.ts im Format von supabase-js aus der lokalen Datenbank (psql erforderlich).
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const conn = { host: process.env.PGHOST ?? "127.0.0.1", port: process.env.PGPORT ?? "54329", user: process.env.PGUSER ?? "postgres", db: process.env.PGDATABASE ?? "fahrpilot_test" };
const sql = (q) => JSON.parse(execFileSync("psql", ["-h", conn.host, "-p", conn.port, "-U", conn.user, "-d", conn.db, "-At", "-c", `select coalesce(json_agg(t), '[]') from (${q}) t`], { encoding: "utf8" }));

const enums = sql(`select n.nspname as schema, t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace where n.nspname in ('public','app') group by 1,2 order by 1,2`);
const enumMap = new Map(enums.map((e) => [`${e.schema}.${e.name}`, e]));
const columns = sql(`select c.table_name, c.column_name, c.data_type, c.udt_schema, c.udt_name, c.is_nullable, c.column_default, c.is_generated, c.is_identity, c.ordinal_position from information_schema.columns c where c.table_schema = 'public' order by c.table_name, c.ordinal_position`);
const tables = sql(`select table_name, table_type from information_schema.tables where table_schema = 'public' order by 1`);
const fks = sql(`select tc.table_name, tc.constraint_name, array_agg(kcu.column_name order by kcu.ordinal_position) as columns, ccu.table_name as ref_table, array_agg(ccu.column_name order by kcu.ordinal_position) as ref_columns,
  exists (select 1 from information_schema.table_constraints u join information_schema.key_column_usage k2 on k2.constraint_name = u.constraint_name and k2.table_schema = u.table_schema where u.table_schema = 'public' and u.table_name = tc.table_name and u.constraint_type in ('UNIQUE','PRIMARY KEY') and k2.column_name = min(kcu.column_name) and (select count(*) from information_schema.key_column_usage k3 where k3.constraint_name = u.constraint_name) = 1) as one_to_one
  from information_schema.table_constraints tc join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public' group by tc.table_name, tc.constraint_name, ccu.table_name order by 1, 2`);
const functions = sql(`select p.proname as name, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as result, p.proretset as retset from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') order by 1`);

function tsType(col) {
  const t = col.data_type, u = col.udt_name;
  if (t === "USER-DEFINED") {
    const key = `${col.udt_schema}.${u}`;
    if (enumMap.has(key)) return `Database["${col.udt_schema}"]["Enums"]["${u}"]`;
    return "string";
  }
  if (t === "ARRAY") {
    const inner = u.replace(/^_/, "");
    const innerEnum = enums.find((e) => e.name === inner);
    if (innerEnum) return `Database["${innerEnum.schema}"]["Enums"]["${inner}"][]`;
    if (["int2", "int4", "int8", "float4", "float8", "numeric"].includes(inner)) return "number[]";
    return "string[]";
  }
  if (["integer", "smallint", "bigint", "numeric", "real", "double precision"].includes(t)) return "number";
  if (t === "boolean") return "boolean";
  if (t === "json" || t === "jsonb") return "Json";
  return "string";
}

let out = `// Automatisch erzeugt von packages/db/scripts/gen-types.mjs. Nicht manuell bearbeiten.\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n\nexport type Database = {\n`;
for (const schema of ["public", "app"]) {
  out += `  ${schema}: {\n    Tables: {\n`;
  if (schema === "public") {
    for (const t of tables.filter((x) => x.table_type === "BASE TABLE")) {
      const cols = columns.filter((c) => c.table_name === t.table_name);
      const row = cols.map((c) => `          ${c.column_name}: ${tsType(c)}${c.is_nullable === "YES" ? " | null" : ""};`).join("\n");
      const insert = cols.filter((c) => c.is_generated === "NEVER" && c.is_identity === "NO").map((c) => `          ${c.column_name}${c.is_nullable === "YES" || c.column_default !== null ? "?" : ""}: ${tsType(c)}${c.is_nullable === "YES" ? " | null" : ""};`).join("\n");
      const update = cols.filter((c) => c.is_generated === "NEVER" && c.is_identity === "NO").map((c) => `          ${c.column_name}?: ${tsType(c)}${c.is_nullable === "YES" ? " | null" : ""};`).join("\n");
      const rels = fks.filter((f) => f.table_name === t.table_name).map((f) => `          { foreignKeyName: ${JSON.stringify(f.constraint_name)}; columns: ${JSON.stringify(f.columns)}; isOneToOne: ${f.one_to_one}; referencedRelation: ${JSON.stringify(f.ref_table)}; referencedColumns: ${JSON.stringify(f.ref_columns)} }`).join(",\n");
      out += `      ${t.table_name}: {\n        Row: {\n${row}\n        };\n        Insert: {\n${insert}\n        };\n        Update: {\n${update}\n        };\n        Relationships: [\n${rels}\n        ];\n      };\n`;
    }
  }
  out += `    };\n    Views: {\n`;
  if (schema === "public") for (const v of tables.filter((x) => x.table_type === "VIEW")) {
    const cols = columns.filter((c) => c.table_name === v.table_name);
    out += `      ${v.table_name}: { Row: {\n${cols.map((c) => `        ${c.column_name}: ${tsType(c)} | null;`).join("\n")}\n      } };\n`;
  }
  out += `    };\n    Functions: {\n`;
  if (schema === "public") for (const f of functions) {
    const args = f.args ? f.args.split(", ").map((a) => { const m = a.match(/^(\w+)\s+(.+?)( DEFAULT .*)?$/); if (!m) return null; const [, name, type, def] = m; const ts = /json/.test(type) ? "Json" : /uuid|text|date|character/.test(type) ? "string" : /int|numeric/.test(type) ? "number" : /bool/.test(type) ? "boolean" : "string"; return `${name}${def ? "?" : ""}: ${ts}${def ? " | null" : ""}`; }).filter(Boolean).join("; ") : "";
    let ret = "unknown";
    const m = f.result.match(/^(SETOF )?(public\.)?(\w+)$/);
    if (m && tables.some((t) => t.table_name === m[3])) ret = `Database["public"]["Tables"]["${m[3]}"]["Row"]${f.retset ? "[]" : ""}`;
    else if (/^text$|^uuid$/.test(f.result)) ret = "string";
    else if (/^integer$/.test(f.result)) ret = "number";
    else if (/^TABLE/.test(f.result)) ret = "Record<string, unknown>[]";
    out += `      ${f.name}: { Args: { ${args} }; Returns: ${ret} };\n`;
  }
  out += `    };\n    Enums: {\n`;
  for (const e of enums.filter((x) => x.schema === schema)) out += `      ${e.name}: ${e.labels.map((l) => JSON.stringify(l)).join(" | ")};\n`;
  out += `    };\n    CompositeTypes: Record<string, never>;\n  };\n`;
}
out += `};\n\nexport type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];\nexport type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];\nexport type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];\nexport type Enums<S extends "public" | "app", T extends keyof Database[S]["Enums"]> = Database[S]["Enums"][T];\n`;
writeFileSync(new URL("../src/database.types.ts", import.meta.url), out);
console.log(`Typen erzeugt: ${tables.length} Tabellen, ${functions.length} Funktionen, ${enums.length} Enums`);
