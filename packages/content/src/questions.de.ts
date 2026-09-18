// Eigene Übungsfragen für die Fahrausbildung Klasse B (Deutschland), Stand September 2026.
// Alle Fragen sind eigene Formulierungen (source "own") und KEINE amtlichen Prüfungsfragen.
// Im Produkt werden sie sichtbar als "Übungsfrage (kein amtlicher Prüfungsinhalt)" gekennzeichnet.
// Rechtswerte nur aus allgemein dokumentierten Regeln (StVO, StVG, FeV, StVZO, FahrschAusbO).
// Die Fragen liegen je Thema in src/questions/<thema>.ts und werden hier zusammengeführt.

import type { Question } from "./types.js";
import { alkoholDrogen } from "./questions/alkohol_drogen.js";
import { andereTeilnehmer } from "./questions/andere_teilnehmer.js";
import { befoerderung } from "./questions/befoerderung.js";
import { beleuchtung } from "./questions/beleuchtung.js";
import { besondereSituationen } from "./questions/besondere_situationen.js";
import { fahrmanoever } from "./questions/fahrmanoever.js";
import { fahrphysik } from "./questions/fahrphysik.js";
import { fahrzeugtechnik } from "./questions/fahrzeugtechnik.js";
import { gefahrenlehre } from "./questions/gefahrenlehre.js";
import { geschwindigkeit } from "./questions/geschwindigkeit.js";
import { haltenParken } from "./questions/halten_parken.js";
import { kreisverkehr } from "./questions/kreisverkehr.js";
import { recht } from "./questions/recht.js";
import { strassenbenutzung } from "./questions/strassenbenutzung.js";
import { umwelt } from "./questions/umwelt.js";
import { unfallPanne } from "./questions/unfall_panne.js";
import { verkehrsregelung } from "./questions/verkehrsregelung.js";
import { verkehrszeichen } from "./questions/verkehrszeichen.js";
import { vorfahrt } from "./questions/vorfahrt.js";

export const questions: readonly Question[] = [
  ...gefahrenlehre,
  ...recht,
  ...verkehrszeichen,
  ...strassenbenutzung,
  ...vorfahrt,
  ...verkehrsregelung,
  ...geschwindigkeit,
  ...andereTeilnehmer,
  ...fahrmanoever,
  ...kreisverkehr,
  ...haltenParken,
  ...besondereSituationen,
  ...unfallPanne,
  ...umwelt,
  ...alkoholDrogen,
  ...fahrzeugtechnik,
  ...beleuchtung,
  ...befoerderung,
  ...fahrphysik,
];
