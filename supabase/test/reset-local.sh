#!/usr/bin/env bash
# Setzt die lokale Testdatenbank zurück und spielt alle Migrationen ein (Reihenfolge nach Dateinamen).
set -euo pipefail
: "${PGHOST:=127.0.0.1}" "${PGPORT:=54329}" "${PGUSER:=postgres}" "${PGDATABASE:=fahrpilot_test}"
export PGHOST PGPORT PGUSER
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
psql -q -d postgres -c "drop database if exists ${PGDATABASE}" -c "create database ${PGDATABASE}"
psql -q -v ON_ERROR_STOP=1 -d "$PGDATABASE" -f "$ROOT/test/00_local_auth_shim.sql"
for f in "$ROOT"/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$PGDATABASE" -f "$f" >/dev/null 2>&1 || { echo "FEHLER in $f"; psql -v ON_ERROR_STOP=1 -d "$PGDATABASE" -f "$f" 2>&1 | grep -E "ERROR|LINE" | head -5; exit 1; }
  echo "OK $(basename "$f")"
done
