// Eigene Übungsfragen für die Fahrausbildung Klasse B (Deutschland), Stand September 2026.
// Alle Fragen sind eigene Formulierungen (source "own") und KEINE amtlichen Prüfungsfragen.
// Im Produkt werden sie sichtbar als "Übungsfrage (kein amtlicher Prüfungsinhalt)" gekennzeichnet.
// Rechtswerte nur aus allgemein dokumentierten Regeln (StVO, StVG, FeV, StVZO, FahrschAusbO).
// Die Fragen liegen je Thema in src/questions/<thema>.ts und werden hier zusammengeführt.

import type { Question } from "./types";
import { alkoholDrogen } from "./questions/alkohol_drogen";
import { andereTeilnehmer } from "./questions/andere_teilnehmer";
import { befoerderung } from "./questions/befoerderung";
import { beleuchtung } from "./questions/beleuchtung";
import { besondereSituationen } from "./questions/besondere_situationen";
import { fahrmanoever } from "./questions/fahrmanoever";
import { fahrphysik } from "./questions/fahrphysik";
import { fahrzeugtechnik } from "./questions/fahrzeugtechnik";
import { gefahrenlehre } from "./questions/gefahrenlehre";
import { geschwindigkeit } from "./questions/geschwindigkeit";
import { haltenParken } from "./questions/halten_parken";
import { kreisverkehr } from "./questions/kreisverkehr";
import { recht } from "./questions/recht";
import { strassenbenutzung } from "./questions/strassenbenutzung";
import { umwelt } from "./questions/umwelt";
import { unfallPanne } from "./questions/unfall_panne";
import { verkehrsregelung } from "./questions/verkehrsregelung";
import { verkehrszeichen } from "./questions/verkehrszeichen";
import { vorfahrt } from "./questions/vorfahrt";
import { zeichenGenerated } from "./questions/zeichen.generated";

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
  ...zeichenGenerated,
];
