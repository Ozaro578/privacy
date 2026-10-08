<?php
// ZUKKABRO – Server-API für Strato (PHP 8.1+).
// Gleiche Schnittstelle wie netlify/functions/api/api.mts: Admin, Händler, Kasse, Pakete, Buchhaltung.
// Alle Geldbeträge in Cent (ganze Zahlen).
declare(strict_types=1);

require_once __DIR__ . '/speicher.php';
require_once __DIR__ . '/sicherheit.php';

const BESTELL_STATUS = ['neu', 'bestaetigt', 'versendet', 'bezahlt', 'abgeschlossen', 'storniert'];
const BUCH_TYPEN = ['einkauf', 'verkauf', 'ausgabe', 'einnahme'];
const MWST_SAETZE = [0, 7, 19];
const FARBEN = ['pink', 'gold', 'blue', 'orange', 'violet', 'green', 'gruen', 'dark', 'rot'];
const LEBENSMITTEL = ['susses', 'snacks', 'scharfes', 'pipapo'];
const STANDARD_EINSTELLUNGEN = [
    'versand' => 590, 'versandfreiAb' => 5000, 'abholung' => true, 'abholort' => 'Klingenberger Straße 100, 74080 Heilbronn (zu den Öffnungszeiten)',
    'bankInhaber' => '', 'bankIban' => '', 'bankName' => '', 'paypal' => '', 'hinweis' => '', 'ohnePreisAusblenden' => false,
    'mailAn' => '', 'mailVon' => '', 'vorverkauf' => false, 'eroeffnung' => 'im November 2026',
    'kurier' => true, 'kurierKosten' => 290, 'kurierAb' => 2500, 'kurierFreiAb' => 5000, 'kurierPlz' => '74072, 74074, 74076, 74078, 74080, 74081',
];

final class Fehler extends Exception {
    public function __construct(public int $status, string $msg) { parent::__construct($msg); }
}

/* =================== Hilfen =================== */
function antwort(mixed $daten, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
/** Leere Zuordnungen als {} statt [] ausgeben */
function obj(array $a): array|stdClass { return $a === [] ? new stdClass() : $a; }

function text(mixed $v, int $max = 200): string {
    if (!is_string($v)) return '';
    $v = trim($v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}
function ganz(mixed $v, int $min, int $max): int {
    if (is_int($v)) $n = $v;
    elseif (is_string($v) && preg_match('/^-?\d+$/', trim($v))) $n = (int) trim($v);
    elseif (is_float($v) && floor($v) == $v) $n = (int) $v;
    else throw new Fehler(400, 'Ungültige Zahl');
    if ($n < $min || $n > $max) throw new Fehler(400, 'Ungültige Zahl');
    return $n;
}
function datum(mixed $v): string {
    $s = text($v, 10);
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) throw new Fehler(400, 'Ungültiges Datum');
    return $s;
}
function ohne_pass(array $h): array { unset($h['passHash']); return $h; }
function email_ok(string $e): bool { return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e); }

function body(): array {
    $roh = file_get_contents('php://input');
    $b = json_decode($roh === false ? '' : $roh, true);
    if (!is_array($b)) throw new Fehler(400, 'Ungültige Anfrage');
    return $b;
}

/** Einfache Bremse gegen Passwort-Raten und Spam (pro IP und Aktion) */
function bremse(string $aktion, string $ip, int $max, int $fensterMin): void {
    $key = 'limit/' . kurz_hash($aktion . '|' . $ip);
    $jetzt = (int) (microtime(true) * 1000);
    $e = lese($key) ?: ['n' => 0, 'seit' => $jetzt];
    if ($jetzt - $e['seit'] > $fensterMin * 60000) { $e = ['n' => 0, 'seit' => $jetzt]; }
    $e['n']++;
    schreibe($key, $e);
    if ($e['n'] > $max) throw new Fehler(429, 'Zu viele Versuche. Bitte später erneut probieren.');
}

function protokoll(string $ereignis, string $von, array $details = []): void {
    $am = jetzt();
    schreibe('protokoll/' . substr($am, 0, 7) . '/' . $am . '-' . substr(kurz_hash($am . random_int(0, PHP_INT_MAX)), 0, 6),
        array_merge(['am' => $am, 'ereignis' => $ereignis, 'von' => $von], $details));
}

function braucht(?array $s, string $rolle): array {
    if (!$s || $s['r'] !== $rolle) throw new Fehler(401, 'Bitte anmelden.');
    return $s;
}

/* =================== Sortiment & Pakete =================== */
function sortiment(): array {
    static $s = null;
    if ($s === null) $s = json_decode((string) file_get_contents(__DIR__ . '/sortiment.json'), true) ?: [];
    return $s;
}
function produkt(string $id): ?array { return sortiment()[$id] ?? null; }
function mwst_vorschlag(string $id): int {
    $k = produkt($id)['k'] ?? [];
    if (array_intersect($k, ['getraenke', 'vapes', 'elfbar'])) return 19;
    return array_intersect($k, LEBENSMITTEL) ? 7 : 19;
}
function alter_jahre(string $geb): int { return (new DateTimeImmutable($geb))->diff(new DateTimeImmutable('today'))->y; }
function mwst_aus_brutto(int $brutto, int $satz): int { return (int) round($brutto * $satz / (100 + $satz)); }

function pakete(): array {
    $p = lese('pakete/alle');
    if (is_array($p)) return $p;
    return json_decode((string) file_get_contents(__DIR__ . '/pakete-vorlage.json'), true) ?: [];
}
function paket_status(array $pk): array {
    $inhalte = [];
    foreach ($pk['inhalt'] as $i) { $p = produkt($i['id']); if ($p) $inhalte[] = $p; }
    $voll = count($inhalte) === count($pk['inhalt']) && count($inhalte) > 0;
    $ab18 = false; $aus = false;
    foreach ($inhalte as $p) { if (!empty($p['a'])) $ab18 = true; if (!empty($p['x'])) $aus = true; }
    return ['ab18' => $ab18, 'lieferbar' => $voll && !$aus];
}

/* =================== Konten =================== */
function login(string $ip): never {
    $b = body();
    $rolle = ($b['rolle'] ?? '') === 'admin' ? 'admin' : 'haendler';
    $benutzer = strtolower(text($b['benutzer'] ?? '', 120));
    $passwort = is_string($b['passwort'] ?? null) ? substr($b['passwort'], 0, 200) : '';
    bremse('login-' . $rolle, $ip, 10, 15);
    if ($rolle === 'admin') {
        $konten = admin_konten();
        $hash = $konten[$benutzer] ?? '';
        $ok = $hash !== '' && password_verify($passwort, $hash);
        if (!$ok) { protokoll('admin-login-fehlgeschlagen', $benutzer, ['ip' => kurz_hash($ip)]); throw new Fehler(401, 'Benutzername oder Passwort falsch.'); }
        protokoll('admin-login', $benutzer);
        sitzung_setzen('admin', $benutzer, $benutzer);
        antwort(['ok' => true, 'rolle' => 'admin', 'name' => $benutzer]);
    }
    $id = lese('haendler-email/' . kurz_hash($benutzer));
    $h = is_string($id) ? lese('haendler/' . $id) : null;
    $ok = password_verify($passwort, $h['passHash'] ?? '$2y$10$ausgleichausgleichausgleichausgleichausgleichausgle');
    if (!$h || !$ok) throw new Fehler(401, 'Benutzername oder Passwort falsch.');
    if ($h['status'] === 'offen') throw new Fehler(403, 'Dein Händlerkonto wird noch geprüft. Wir melden uns bei dir.');
    if ($h['status'] === 'gesperrt') throw new Fehler(403, 'Dieses Händlerkonto ist gesperrt.');
    protokoll('haendler-login', $h['id']);
    sitzung_setzen('haendler', $h['id'], $h['firma']);
    antwort(['ok' => true, 'rolle' => 'haendler', 'name' => $h['firma']]);
}

function registrieren(string $ip): never {
    bremse('registrieren', $ip, 5, 60);
    $b = body();
    $email = strtolower(text($b['email'] ?? '', 120));
    $passwort = is_string($b['passwort'] ?? null) ? $b['passwort'] : '';
    $h = [
        'id' => neue_id('H-'), 'firma' => text($b['firma'] ?? '', 120), 'ansprechpartner' => text($b['ansprechpartner'] ?? '', 120), 'email' => $email,
        'telefon' => text($b['telefon'] ?? '', 40), 'strasse' => text($b['strasse'] ?? '', 120), 'plz' => text($b['plz'] ?? '', 10), 'ort' => text($b['ort'] ?? '', 80),
        'ustId' => text($b['ustId'] ?? '', 30), 'passHash' => '', 'status' => 'offen', 'erstellt' => jetzt(),
    ];
    if (!$h['firma'] || !$h['ansprechpartner'] || !$h['strasse'] || !$h['plz'] || !$h['ort']) throw new Fehler(400, 'Bitte alle Pflichtfelder ausfüllen.');
    if (!email_ok($email)) throw new Fehler(400, 'Bitte eine gültige E-Mail-Adresse angeben.');
    if (strlen($passwort) < 10 || strlen($passwort) > 200) throw new Fehler(400, 'Das Passwort braucht mindestens 10 Zeichen.');
    if (($b['gewerbe'] ?? null) !== true || ($b['datenschutz'] ?? null) !== true) throw new Fehler(400, 'Bitte die Bestätigungen ankreuzen.');
    $index = 'haendler-email/' . kurz_hash($email);
    if (lese($index)) throw new Fehler(409, 'Für diese E-Mail gibt es schon ein Konto.');
    $h['passHash'] = password_hash($passwort, PASSWORD_DEFAULT);
    schreibe('haendler/' . $h['id'], $h);
    schreibe($index, $h['id']);
    protokoll('haendler-registriert', $h['id'], ['firma' => $h['firma']]);
    mail_an_team('Neue Händler-Registrierung: ' . $h['firma'], "Firma: {$h['firma']}\nAnsprechpartner: {$h['ansprechpartner']}\nE-Mail: {$h['email']}\nTelefon: {$h['telefon']}\n\nBitte im Admin unter Händler freischalten: https://zukkabro.de/admin/");
    antwort(['ok' => true, 'meldung' => 'Danke! Wir prüfen deine Angaben und schalten dein Konto frei.']);
}

function ich(?array $s): never {
    if (!$s) antwort(['angemeldet' => false]);
    if ($s['r'] === 'haendler') {
        $h = lese('haendler/' . $s['id']);
        if (!$h || $h['status'] !== 'aktiv') { sitzung_beenden(); antwort(['angemeldet' => false]); }
        antwort(['angemeldet' => true, 'rolle' => 'haendler', 'name' => $h['firma'], 'haendler' => ohne_pass($h)]);
    }
    antwort(['angemeldet' => true, 'rolle' => $s['r'], 'name' => $s['n']]);
}

function aktiver_haendler(?array $s): array {
    $sitz = braucht($s, 'haendler');
    $h = lese('haendler/' . $sitz['id']);
    if (!$h || $h['status'] !== 'aktiv') throw new Fehler(401, 'Bitte erneut anmelden.');
    return $h;
}

/* =================== Preise =================== */
function preisliste(): array { $p = lese('preise/haendler'); return is_array($p) ? $p : []; }
function shop_preise(): array { $p = lese('preise/shop'); return is_array($p) ? $p : []; }
function einstellungen(): array { $e = lese('einstellungen/shop'); return array_merge(STANDARD_EINSTELLUNGEN, is_array($e) ? $e : []); }

function mwst_pruefen(mixed $v): int {
    $m = ganz($v, 0, 19);
    if (!in_array($m, MWST_SAETZE, true)) throw new Fehler(400, 'MwSt-Satz muss 0, 7 oder 19 sein.');
    return $m;
}

/* =================== Digitale Stempelkarte (Laden) =================== */
const STEMPEL_ZIEL = 10; // 10 Stempel = 1 Gratis-Getränk
function stempel_code(): string {
    $zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O/1/I, damit man es an der Theke gut vorlesen kann
    $c = '';
    for ($i = 0; $i < 8; $i++) $c .= $zeichen[random_int(0, strlen($zeichen) - 1)];
    return 'ZB-' . substr($c, 0, 4) . '-' . substr($c, 4);
}
function stempel_code_param(mixed $v): string {
    $c = preg_replace('/\s/', '', strtoupper(text($v ?? '', 20)));
    if (!preg_match('/^ZB-[A-Z2-9]{4}-[A-Z2-9]{4}$/', $c)) throw new Fehler(400, 'Code bitte wie auf der Karte eingeben, z. B. ZB-AB12-CD34.');
    return $c;
}
function stempel_lesen(string $code): array {
    $k = lese('stempel/' . $code);
    if (!is_array($k)) throw new Fehler(404, 'Diese Stempelkarte gibt es nicht.');
    return $k;
}
function stempel_antwort(array $k, array $zusatz = []): never {
    antwort(array_merge(['code' => $k['code'], 'stempel' => $k['stempel'], 'ziel' => STEMPEL_ZIEL, 'guthaben' => $k['guthaben'], 'eingeloest' => $k['eingeloest'],
        'erstellt' => $k['erstellt'], 'letzter' => $k['letzter']], $zusatz));
}
function stempel_neu(string $ip): never {
    bremse('stempel', $ip, 10, 60);
    do { $code = stempel_code(); } while (lese('stempel/' . $code));
    $k = ['code' => $code, 'stempel' => 0, 'guthaben' => 0, 'eingeloest' => 0, 'erstellt' => jetzt(), 'letzter' => '', 'verlauf' => []];
    schreibe('stempel/' . $code, $k);
    stempel_antwort($k);
}
function stempel_status(string $ip): never {
    bremse('stempel-lesen', $ip, 60, 60);
    stempel_antwort(stempel_lesen(stempel_code_param($_GET['code'] ?? '')));
}
/** Admin an der Theke: Stempel geben oder Gratis-Getränk einlösen */
function stempel_aktion(array $s): never {
    $b = body();
    $code = stempel_code_param($b['code'] ?? '');
    $k = stempel_lesen($code);
    $aktion = ($b['aktion'] ?? '') === 'einloesen' ? 'einloesen' : 'stempel';
    if ($aktion === 'stempel') {
        $anzahl = ganz($b['anzahl'] ?? 1, 1, 5);
        for ($i = 0; $i < $anzahl; $i++) {
            $k['stempel']++;
            if ($k['stempel'] >= STEMPEL_ZIEL) { $k['stempel'] = 0; $k['guthaben']++; }
        }
    } else {
        if ($k['guthaben'] < 1) throw new Fehler(400, 'Auf dieser Karte ist noch kein Gratis-Getränk frei.');
        $k['guthaben']--; $k['eingeloest']++;
    }
    $k['letzter'] = jetzt();
    $k['verlauf'][] = ['was' => $aktion, 'am' => $k['letzter'], 'von' => $s['id']];
    if (count($k['verlauf']) > 200) $k['verlauf'] = array_slice($k['verlauf'], -200);
    schreibe('stempel/' . $code, $k);
    stempel_antwort($k, ['ok' => true]);
}

/* =================== Staffelpreise (Händler) =================== */
/** max. 5 Stufen, aufsteigend nach Menge, jede Stufe günstiger als der Grundpreis */
function staffel_pruefen(mixed $roh, int $grundpreis): array {
    if (!is_array($roh)) return [];
    $stufen = [];
    foreach (array_slice($roh, 0, 5) as $st) {
        $ab = ganz($st['ab'] ?? null, 2, 10000); $preis = ganz($st['preis'] ?? null, 0, 10000000);
        if ($preis >= $grundpreis) throw new Fehler(400, "Staffelpreis ab $ab VE muss unter dem Grundpreis liegen.");
        foreach ($stufen as $x) if ($x['ab'] === $ab) throw new Fehler(400, 'Jede Staffelmenge nur einmal.');
        $stufen[] = ['ab' => $ab, 'preis' => $preis];
    }
    usort($stufen, fn($a, $b) => $a['ab'] <=> $b['ab']);
    return $stufen;
}
/** Gültiger Stückpreis für eine Menge (höchste erreichte Staffel) */
function staffel_preis(array $p, int $anzahlVE): int {
    $eff = (int) $p['preis'];
    foreach ($p['staffel'] ?? [] as $st) if ($anzahlVE >= $st['ab']) $eff = (int) $st['preis'];
    return $eff;
}
/** Postleitzahlen aus der Einstellung als Liste */
function kurier_plz_liste(array $e): array {
    return array_values(array_filter(preg_split('/[\s,;]+/', (string) $e['kurierPlz']), fn($p) => preg_match('/^\d{5}$/', $p)));
}

function preise_speichern(array $s): never {
    $b = body();
    $aend = is_array($b['aenderungen'] ?? null) ? $b['aenderungen'] : [];
    $liste = preisliste(); $n = 0;
    foreach ($aend as $id => $wert) {
        $pid = text((string) $id, 200);
        if (!$pid || $n++ > 2000) continue;
        if ($wert === null) { unset($liste[$pid]); continue; }
        $liste[$pid] = [
            'name' => text($wert['name'] ?? '', 200) ?: $pid, 'marke' => text($wert['marke'] ?? '', 80),
            'preis' => ganz($wert['preis'] ?? null, 0, 10000000), 've' => ganz($wert['ve'] ?? null, 1, 10000), 'mindest' => ganz($wert['mindest'] ?? null, 1, 10000),
            'mwst' => mwst_pruefen($wert['mwst'] ?? null), 'aktiv' => ($wert['aktiv'] ?? true) !== false,
        ];
        $staffel = staffel_pruefen($wert['staffel'] ?? null, $liste[$pid]['preis']);
        if ($staffel) $liste[$pid]['staffel'] = $staffel;
    }
    schreibe('preise/haendler', obj($liste));
    protokoll('preise-geaendert', $s['id'], ['anzahl' => count($aend)]);
    antwort(['ok' => true, 'preise' => obj($liste)]);
}

function shop_preise_speichern(array $s): never {
    $b = body();
    $aend = is_array($b['aenderungen'] ?? null) ? $b['aenderungen'] : [];
    $liste = shop_preise(); $n = 0;
    foreach ($aend as $id => $wert) {
        $pid = text((string) $id, 200);
        if (!$pid || $n++ > 2000) continue;
        if ($wert === null) { unset($liste[$pid]); continue; }
        $liste[$pid] = ['preis' => ganz($wert['preis'] ?? null, 1, 10000000), 'mwst' => mwst_pruefen($wert['mwst'] ?? null)];
    }
    schreibe('preise/shop', obj($liste));
    protokoll('shoppreise-geaendert', $s['id'], ['anzahl' => count($aend)]);
    antwort(['ok' => true, 'shop' => obj($liste)]);
}

function einstellungen_speichern(array $s): never {
    $b = body();
    $e = [
        'versand' => ganz($b['versand'] ?? null, 0, 100000), 'versandfreiAb' => ganz($b['versandfreiAb'] ?? null, 0, 10000000),
        'abholung' => ($b['abholung'] ?? null) === true, 'abholort' => text($b['abholort'] ?? '', 200),
        'bankInhaber' => text($b['bankInhaber'] ?? '', 100), 'bankIban' => preg_replace('/\s+/', ' ', text($b['bankIban'] ?? '', 40)), 'bankName' => text($b['bankName'] ?? '', 100),
        'paypal' => text($b['paypal'] ?? '', 200), 'hinweis' => text($b['hinweis'] ?? '', 1000), 'ohnePreisAusblenden' => ($b['ohnePreisAusblenden'] ?? null) === true,
        'mailAn' => strtolower(text($b['mailAn'] ?? '', 120)), 'mailVon' => strtolower(text($b['mailVon'] ?? '', 120)),
        'vorverkauf' => ($b['vorverkauf'] ?? null) === true, 'eroeffnung' => text($b['eroeffnung'] ?? '', 60) ?: STANDARD_EINSTELLUNGEN['eroeffnung'],
        'kurier' => ($b['kurier'] ?? null) === true, 'kurierKosten' => ganz($b['kurierKosten'] ?? STANDARD_EINSTELLUNGEN['kurierKosten'], 0, 100000),
        'kurierAb' => ganz($b['kurierAb'] ?? STANDARD_EINSTELLUNGEN['kurierAb'], 0, 10000000), 'kurierFreiAb' => ganz($b['kurierFreiAb'] ?? STANDARD_EINSTELLUNGEN['kurierFreiAb'], 0, 10000000),
        'kurierPlz' => text($b['kurierPlz'] ?? '', 300) ?: STANDARD_EINSTELLUNGEN['kurierPlz'],
    ];
    if ($e['kurier'] && !kurier_plz_liste($e)) throw new Fehler(400, 'Für die Lieferung in Heilbronn mindestens eine Postleitzahl angeben.');
    if ($e['mailAn'] !== '' && !email_ok($e['mailAn'])) throw new Fehler(400, 'Benachrichtigungs-E-Mail ist ungültig.');
    if ($e['mailVon'] !== '' && !email_ok($e['mailVon'])) throw new Fehler(400, 'Absender-E-Mail ist ungültig.');
    schreibe('einstellungen/shop', $e);
    protokoll('einstellungen-geaendert', $s['id']);
    antwort(['ok' => true, 'einstellungen' => $e]);
}

/* =================== Pakete =================== */
function pakete_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['pakete'] ?? null) ? array_slice($b['pakete'], 0, 60) : [];
    $ids = []; $liste = [];
    foreach ($roh as $r) {
        $id = trim(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9-]/', '-', strtolower(text($r['id'] ?? '', 60)))), '-');
        if (!$id || isset($ids[$id])) throw new Fehler(400, 'Jedes Paket braucht eine eigene Kennung.');
        $ids[$id] = true;
        $name = text($r['name'] ?? '', 80);
        if (!$name) throw new Fehler(400, 'Jedes Paket braucht einen Namen.');
        $inhalt = [];
        foreach (array_slice(is_array($r['inhalt'] ?? null) ? $r['inhalt'] : [], 0, 40) as $i) {
            $pid = text($i['id'] ?? '', 200);
            if (!produkt($pid)) throw new Fehler(400, "$name: Produkt $pid gibt es nicht im Sortiment.");
            $inhalt[] = ['id' => $pid, 'menge' => ganz($i['menge'] ?? null, 1, 99)];
        }
        if (!$inhalt) throw new Fehler(400, "$name: Bitte mindestens ein Produkt hinzufügen.");
        $preis = $r['preis'] ?? null;
        $liste[] = [
            'id' => $id, 'name' => $name, 'untertitel' => text($r['untertitel'] ?? '', 160), 'emoji' => text($r['emoji'] ?? '', 16) ?: '🎁',
            'farbe' => in_array($r['farbe'] ?? '', FARBEN, true) ? $r['farbe'] : 'pink', 'inhalt' => $inhalt,
            'preis' => ($preis === null || $preis === '') ? null : ganz($preis, 1, 10000000),
            'mwst' => mwst_pruefen($r['mwst'] ?? null), 'aktiv' => ($r['aktiv'] ?? true) !== false,
        ];
    }
    schreibe('pakete/alle', $liste);
    protokoll('pakete-geaendert', $s['id'], ['anzahl' => count($liste)]);
    antwort(['ok' => true, 'pakete' => $liste]);
}

/* =================== Shop (Endkunden) =================== */
function zahlarten(array $e): array {
    $z = ['Überweisung (Vorkasse)'];
    if ($e['paypal']) $z[] = 'PayPal';
    if ($e['abholung']) $z[] = 'Bar bei Abholung';
    if (stripe_aktiv()) $z[] = 'Online bezahlen';
    return $z;
}

/* =================== Stripe (Online-Zahlung, Geld geht direkt auf euer Stripe-Konto) =================== */
function stripe_aktiv(): bool { return defined('ZB_STRIPE_SECRET') && ZB_STRIPE_SECRET !== ''; }
function stripe_anfrage(string $pfad, array $daten): array {
    $ch = curl_init('https://api.stripe.com/v1' . $pfad);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_USERPWD => ZB_STRIPE_SECRET . ':',
        CURLOPT_POSTFIELDS => http_build_query($daten), CURLOPT_TIMEOUT => 25]);
    $roh = curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    $j = json_decode((string) $roh, true);
    if ($roh === false || $code >= 300 || !is_array($j)) {
        error_log('Stripe-Fehler: ' . ($j['error']['message'] ?? ('HTTP ' . $code)));
        throw new Fehler(502, 'Die Online-Zahlung ist gerade nicht erreichbar. Bitte eine andere Zahlungsart wählen.');
    }
    return $j;
}
/** Stripe-Checkout-Sitzung für eine Bestellung anlegen; Beträge kommen aus der Bestellung, nie vom Browser */
function stripe_sitzung(array $best, string $email, string $origin): array {
    $items = [];
    foreach ($best['positionen'] as $p) {
        $items[] = ['quantity' => $p['stueck'], 'price_data' => ['currency' => 'eur', 'unit_amount' => (int) round(($p['brutto'] ?? 0) / $p['stueck']), 'product_data' => ['name' => mb_substr($p['name'], 0, 120)]]];
    }
    if (!empty($best['versand'])) $items[] = ['quantity' => 1, 'price_data' => ['currency' => 'eur', 'unit_amount' => $best['versand'], 'product_data' => ['name' => 'Versand']]];
    return stripe_anfrage('/checkout/sessions', [
        'mode' => 'payment', 'locale' => 'de', 'customer_email' => $email, 'client_reference_id' => $best['id'],
        'success_url' => $origin . '/warenkorb.html?bezahlt=' . $best['id'] . '&s={CHECKOUT_SESSION_ID}',
        'cancel_url' => $origin . '/warenkorb.html?abgebrochen=' . $best['id'],
        'line_items' => $items, 'metadata' => ['bestellung' => $best['id']],
        'payment_intent_data' => ['description' => 'ZUKKABRO Bestellung ' . $best['id'], 'metadata' => ['bestellung' => $best['id']]],
    ]);
}
/** Stripe meldet die Zahlung: Bestellung auf "bezahlt" setzen und automatisch buchen */
function stripe_webhook(): never {
    $geheim = defined('ZB_STRIPE_WEBHOOK') ? ZB_STRIPE_WEBHOOK : '';
    if ($geheim === '') throw new Fehler(404, 'Nicht gefunden.');
    $payload = (string) file_get_contents('php://input');
    $teile = [];
    foreach (explode(',', $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '') as $p) { $kv = explode('=', trim($p), 2); if (count($kv) === 2) $teile[$kv[0]] = $kv[1]; }
    $erwartet = hash_hmac('sha256', ($teile['t'] ?? '') . '.' . $payload, $geheim);
    if (empty($teile['t']) || empty($teile['v1']) || !hash_equals($erwartet, $teile['v1']) || abs(time() - (int) $teile['t']) > 600) throw new Fehler(400, 'Ungültige Signatur.');
    $ev = json_decode($payload, true);
    if (($ev['type'] ?? '') === 'checkout.session.completed') {
        $s = $ev['data']['object'] ?? [];
        $id = text((string) ($s['metadata']['bestellung'] ?? ($s['client_reference_id'] ?? '')), 40);
        $bezahlt = in_array($s['payment_status'] ?? '', ['paid', 'no_payment_required'], true);
        if ($bezahlt && preg_match('/^ZK-\d{8}-[0-9A-F]{8}$/', $id)) {
            $best = lese('bestellungen/' . $id);
            if ($best && (($best['stripe']['status'] ?? '') !== 'bezahlt')) {
                $best['stripe'] = ['session' => (string) ($s['id'] ?? ''), 'status' => 'bezahlt', 'paymentIntent' => (string) ($s['payment_intent'] ?? ''), 'bezahltAm' => jetzt()];
                $best['status'] = 'bezahlt';
                $best['verlauf'][] = ['status' => 'bezahlt', 'von' => 'Stripe', 'am' => jetzt()];
                schreibe('bestellungen/' . $id, $best);
                if (empty($best['gebucht'])) buche_bestellung($best, 'Stripe', 'stripe');
                protokoll('stripe-bezahlt', $id, ['betrag' => $s['amount_total'] ?? 0]);
                mail_an_team('Online-Zahlung eingegangen: ' . $id, "Stripe hat die Zahlung für Bestellung $id bestätigt (" . euro_text((int) ($s['amount_total'] ?? 0)) . ").\nBitte packen und verschicken.\n\nAdmin: https://zukkabro.de/admin/");
            }
        }
    }
    antwort(['ok' => true]);
}
/** Danke-Seite nach Stripe: Status der Bestellung (nur mit passender Sitzungs-Kennung) */
function stripe_bestell_status(): never {
    $nr = text((string) ($_GET['nr'] ?? ''), 40); $sitzung = text((string) ($_GET['s'] ?? ''), 120);
    if (!preg_match('/^ZK-\d{8}-[0-9A-F]{8}$/', $nr)) throw new Fehler(404, 'Bestellung nicht gefunden.');
    $best = lese('bestellungen/' . $nr);
    if (!$best || empty($best['stripe']['session']) || $sitzung === '' || $best['stripe']['session'] !== $sitzung) throw new Fehler(404, 'Bestellung nicht gefunden.');
    antwort(['nr' => $nr, 'status' => $best['status'], 'bezahlt' => ($best['stripe']['status'] ?? '') === 'bezahlt', 'brutto' => $best['brutto'], 'lieferart' => $best['lieferart']]);
}

/* =================== Laden in Heilbronn: Öffnungszeiten, Karte, Tageskasse =================== */
const ALLERGENE = ['Gluten', 'Krebstiere', 'Eier', 'Fisch', 'Erdnüsse', 'Soja', 'Milch', 'Schalenfrüchte', 'Sellerie', 'Senf', 'Sesam', 'Sulfite', 'Lupinen', 'Weichtiere'];
const KARTE_ARTEN = ['matcha', 'bowl', 'extra', 'sonstiges'];
const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
function laden_vorlage(): array {
    static $v = null;
    if ($v === null) $v = json_decode((string) file_get_contents(__DIR__ . '/laden-vorlage.json'), true) ?: ['laden' => [], 'karte' => []];
    return $v;
}
function laden_einstellungen(): array { $l = lese('laden/einstellungen'); return array_merge(laden_vorlage()['laden'], is_array($l) ? $l : []); }
function karte(): array { $k = lese('laden/karte'); return is_array($k) ? $k : laden_vorlage()['karte']; }
function laden_daten(): never {
    $e = einstellungen(); $vv = (bool) $e['vorverkauf'];
    $karte = array_values(array_filter(karte(), fn($x) => !empty($x['aktiv'])));
    if ($vv) $karte = array_map(fn($x) => array_merge($x, ['preis' => null]), $karte);
    antwort(['laden' => laden_einstellungen(), 'karte' => $karte, 'allergene' => ALLERGENE, 'vorverkauf' => ['aktiv' => $vv, 'text' => $e['eroeffnung']]]);
}
function uhrzeit(mixed $v): string {
    $t = text($v ?? '', 5);
    if ($t !== '' && !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $t)) throw new Fehler(400, 'Uhrzeit bitte als HH:MM angeben.');
    return $t;
}
function laden_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['zeiten'] ?? null) ? $b['zeiten'] : [];
    $zeiten = [];
    foreach (TAGE as $tag) {
        $z = [];
        foreach ($roh as $x) if (is_array($x) && ($x['tag'] ?? '') === $tag) { $z = $x; break; }
        $offen = ($z['offen'] ?? null) === true;
        $von = $offen ? uhrzeit($z['von'] ?? '') : ''; $bis = $offen ? uhrzeit($z['bis'] ?? '') : '';
        if ($offen && ($von === '' || $bis === '')) throw new Fehler(400, "Bitte Öffnungszeit für $tag angeben (von, bis).");
        $zeiten[] = ['tag' => $tag, 'offen' => $offen, 'von' => $von, 'bis' => $bis];
    }
    $l = ['name' => text($b['name'] ?? '', 80) ?: laden_vorlage()['laden']['name'], 'strasse' => text($b['strasse'] ?? '', 120), 'plz' => text($b['plz'] ?? '', 10),
        'ort' => text($b['ort'] ?? '', 80) ?: 'Heilbronn', 'hinweis' => text($b['hinweis'] ?? '', 400), 'aktiv' => ($b['aktiv'] ?? true) !== false, 'zeiten' => $zeiten];
    schreibe('laden/einstellungen', $l);
    protokoll('laden-geaendert', $s['id']);
    antwort(['ok' => true, 'laden' => $l]);
}
function kennung(string $name): string {
    $n = strtolower(strtr($name, ['ä' => 'a', 'ö' => 'o', 'ü' => 'u', 'Ä' => 'a', 'Ö' => 'o', 'Ü' => 'u', 'ß' => 'ss', 'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ç' => 'c', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'í' => 'i', 'ì' => 'i', 'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ú' => 'u', 'ù' => 'u', 'ñ' => 'n']));
    return trim(preg_replace('/[^a-z0-9]+/', '-', $n), '-');
}
function karte_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['karte'] ?? null) ? array_slice($b['karte'], 0, 80) : [];
    $ids = []; $liste = [];
    foreach ($roh as $r) {
        if (!is_array($r)) continue;
        $name = text($r['name'] ?? '', 80);
        if ($name === '') throw new Fehler(400, 'Jeder Eintrag auf der Karte braucht einen Namen.');
        $id = kennung(text($r['id'] ?? '', 60)) ?: kennung($name);
        if ($id === '' || isset($ids[$id])) throw new Fehler(400, "$name ist doppelt auf der Karte.");
        $ids[$id] = true;
        $art = in_array($r['art'] ?? '', KARTE_ARTEN, true) ? $r['art'] : 'sonstiges';
        $mwst = mwst_pruefen($r['mwst'] ?? ($art === 'bowl' ? 7 : 19));
        $allergene = array_values(array_filter(is_array($r['allergene'] ?? null) ? $r['allergene'] : [], fn($a) => is_string($a) && in_array($a, ALLERGENE, true)));
        $preis = ($r['preis'] ?? null) === null || ($r['preis'] ?? '') === '' ? null : ganz($r['preis'], 1, 1000000);
        $liste[] = ['id' => $id, 'name' => $name, 'art' => $art, 'preis' => $preis, 'beschreibung' => text($r['beschreibung'] ?? '', 200), 'allergene' => $allergene, 'mwst' => $mwst, 'aktiv' => ($r['aktiv'] ?? true) !== false];
    }
    schreibe('laden/karte', $liste);
    protokoll('karte-geaendert', $s['id'], ['anzahl' => count($liste)]);
    antwort(['ok' => true, 'karte' => $liste]);
}

/* ---------- Tageskasse: Kassenbericht pro Tag (offene Ladenkasse), Abschluss bucht ins Journal ---------- */
function kassen_tag_param(mixed $v): string { return datum($v ?: substr(jetzt(), 0, 10)); }
function kassen_summe(array $t): array {
    $bar = 0; $karte = 0; $ausgaben = 0; $n = 0;
    foreach ($t['verkaeufe'] as $v) { if (!empty($v['storno'])) continue; $n++; if ($v['zahlungsart'] === 'Karte') $karte += $v['betrag']; else $bar += $v['betrag']; }
    foreach ($t['ausgaben'] as $a) if (empty($a['storno'])) $ausgaben += $a['betrag'];
    return ['bar' => $bar, 'karte' => $karte, 'umsatz' => $bar + $karte, 'ausgaben' => $ausgaben, 'soll' => $t['anfang'] + $bar - $ausgaben, 'verkaeufe' => $n];
}
function kassen_tag(string $tag): array {
    $t = lese('kasse/' . $tag);
    if (is_array($t)) return $t;
    $anfang = 0;
    foreach (lese_alle('kasse/') as $x) if (($x['datum'] ?? '') < $tag && !empty($x['abschluss'])) $anfang = (int) $x['abschluss']['gezaehlt'];
    return ['datum' => $tag, 'anfang' => $anfang, 'verkaeufe' => [], 'ausgaben' => [], 'abschluss' => null];
}
function kassen_offen(array $t): void { if (!empty($t['abschluss'])) throw new Fehler(409, 'Dieser Tag ist schon abgeschlossen.'); }
function kasse_antwort(array $t): never { antwort(['tag' => $t, 'summe' => kassen_summe($t)]); }
function kasse_verkauf(): never {
    $b = body(); $tag = kassen_tag_param($b['tag'] ?? ''); $t = kassen_tag($tag); kassen_offen($t);
    $name = text($b['name'] ?? '', 120);
    if ($name === '') throw new Fehler(400, 'Bitte einen Artikel angeben.');
    $menge = ganz($b['menge'] ?? 1, 1, 999); $preis = ganz($b['preis'] ?? null, 0, 1000000); $mwst = mwst_pruefen($b['mwst'] ?? 19);
    $t['verkaeufe'][] = ['nr' => count($t['verkaeufe']) + 1, 'zeit' => jetzt(), 'id' => text($b['id'] ?? '', 200), 'name' => $name, 'menge' => $menge, 'preis' => $preis,
        'betrag' => $menge * $preis, 'mwst' => $mwst, 'zahlungsart' => ($b['zahlungsart'] ?? '') === 'Karte' ? 'Karte' : 'Bar', 'storno' => false];
    schreibe('kasse/' . $tag, $t); kasse_antwort($t);
}
function kasse_ausgabe(): never {
    $b = body(); $tag = kassen_tag_param($b['tag'] ?? ''); $t = kassen_tag($tag); kassen_offen($t);
    $txt = text($b['text'] ?? '', 120);
    if ($txt === '') throw new Fehler(400, 'Bitte angeben, wofür das Geld entnommen wurde.');
    $t['ausgaben'][] = ['nr' => count($t['ausgaben']) + 1, 'zeit' => jetzt(), 'text' => $txt, 'betrag' => ganz($b['betrag'] ?? null, 1, 10000000), 'storno' => false];
    schreibe('kasse/' . $tag, $t); kasse_antwort($t);
}
function kasse_storno(): never {
    $b = body(); $tag = kassen_tag_param($b['tag'] ?? ''); $t = kassen_tag($tag); kassen_offen($t);
    $liste = ($b['art'] ?? '') === 'ausgabe' ? 'ausgaben' : 'verkaeufe'; $nr = ganz($b['nr'] ?? null, 1, 100000); $ok = false;
    foreach ($t[$liste] as &$e) if ($e['nr'] === $nr) { $e['storno'] = true; $ok = true; }
    unset($e);
    if (!$ok) throw new Fehler(404, 'Eintrag nicht gefunden.');
    schreibe('kasse/' . $tag, $t); kasse_antwort($t);
}
function kasse_anfang(): never {
    $b = body(); $tag = kassen_tag_param($b['tag'] ?? ''); $t = kassen_tag($tag); kassen_offen($t);
    $t['anfang'] = ganz($b['anfang'] ?? null, 0, 100000000);
    schreibe('kasse/' . $tag, $t); kasse_antwort($t);
}
function kasse_abschluss(array $s): never {
    $b = body(); $tag = kassen_tag_param($b['tag'] ?? ''); $t = kassen_tag($tag); kassen_offen($t);
    $gezaehlt = ganz($b['gezaehlt'] ?? null, 0, 100000000);
    $summe = kassen_summe($t);
    $gruppen = [];
    foreach ($t['verkaeufe'] as $v) {
        if (!empty($v['storno'])) continue;
        $key = implode('|', [$v['id'], $v['name'], $v['preis'], $v['mwst'], $v['zahlungsart']]);
        if (!isset($gruppen[$key])) $gruppen[$key] = ['id' => $v['id'], 'name' => $v['name'], 'preis' => $v['preis'], 'mwst' => $v['mwst'], 'zahlungsart' => $v['zahlungsart'], 'menge' => 0, 'betrag' => 0];
        $gruppen[$key]['menge'] += $v['menge']; $gruppen[$key]['betrag'] += $v['betrag'];
    }
    foreach ($gruppen as $g) {
        neue_buchung(['typ' => 'verkauf', 'datum' => $tag, 'produktId' => $g['id'], 'name' => $g['name'], 'menge' => $g['menge'], 'einzelpreis' => $g['preis'], 'betrag' => $g['betrag'],
            'mwst' => $g['mwst'], 'zahlungsart' => $g['zahlungsart'], 'beleg' => 'KASSE-' . $tag, 'notiz' => 'Tageskasse Laden'], $s['id']);
    }
    foreach ($t['ausgaben'] as $a) {
        if (!empty($a['storno'])) continue;
        neue_buchung(['typ' => 'ausgabe', 'datum' => $tag, 'produktId' => '', 'name' => $a['text'], 'menge' => 1, 'einzelpreis' => $a['betrag'], 'betrag' => $a['betrag'],
            'mwst' => 0, 'zahlungsart' => 'Bar', 'beleg' => 'KASSE-' . $tag, 'notiz' => 'Kassenentnahme Laden'], $s['id']);
    }
    $t['abschluss'] = ['gezaehlt' => $gezaehlt, 'soll' => $summe['soll'], 'differenz' => $gezaehlt - $summe['soll'], 'bar' => $summe['bar'], 'karte' => $summe['karte'],
        'umsatz' => $summe['umsatz'], 'ausgaben' => $summe['ausgaben'], 'am' => jetzt(), 'von' => $s['id'], 'notiz' => text($b['notiz'] ?? '', 500)];
    schreibe('kasse/' . $tag, $t);
    protokoll('kasse-abschluss', $s['id'], ['tag' => $tag, 'umsatz' => $summe['umsatz'], 'differenz' => $t['abschluss']['differenz']]);
    kasse_antwort($t);
}
function kasse_berichte(): never {
    $monat = preg_match('/^\d{4}-\d{2}$/', (string) ($_GET['monat'] ?? '')) ? $_GET['monat'] : substr(jetzt(), 0, 7);
    $tage = [];
    foreach (lese_alle('kasse/') as $t) {
        if (!str_starts_with($t['datum'] ?? '', $monat . '-')) continue;
        $tage[] = array_merge(['datum' => $t['datum'], 'anfang' => $t['anfang']], kassen_summe($t), ['abschluss' => $t['abschluss']]);
    }
    antwort(['monat' => $monat, 'tage' => $tage]);
}

/* =================== E-Mails (Strato: PHP mail(), Absender muss eine Adresse eurer Domain sein) =================== */
/** Schickt eine schlichte Text-Mail. Fehler werden nur protokolliert, damit keine Bestellung daran scheitert. */
function mail_senden(string $an, string $betreff, string $text): void {
    $e = einstellungen();
    $von = $e['mailVon'] ?: ('noreply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'zukkabro.de'));
    if ($an === '' || !email_ok($an) || !email_ok($von)) return;
    $kopf = "From: ZUKKABRO <$von>\r\nReply-To: " . ($e['mailAn'] ?: $von) . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    $betreff = '=?UTF-8?B?' . base64_encode($betreff) . '?=';
    try { if (!@mail($an, $betreff, wordwrap($text, 78, "\n", false), $kopf, '-f' . $von)) error_log("ZUKKABRO Mail an $an nicht gesendet"); }
    catch (Throwable $t) { error_log('ZUKKABRO Mail-Fehler: ' . $t->getMessage()); }
}
/** Testmail aus dem Admin an die Benachrichtigungs-Adresse */
function mail_test(array $a): void {
    $an = einstellungen()['mailAn'];
    if ($an === '') throw new Fehler(400, 'Bitte zuerst eine Benachrichtigungs-Adresse speichern.');
    mail_an_team('Testmail von ZUKKABRO', "Hey,\n\ndas ist eine Testmail aus dem Admin ({$a['n']}). Wenn du das liest, klappt der Mailversand.\n\nhttps://zukkabro.de/admin/");
    antwort(['ok' => true, 'an' => $an]);
}
function mail_an_team(string $betreff, string $text): void { $an = einstellungen()['mailAn']; if ($an !== '') mail_senden($an, $betreff, $text); }
function euro_text(int $cent): string { return number_format($cent / 100, 2, ',', '.') . ' €'; }
/** Bestellbestätigung an den Kunden und Hinweis ans Team */
function bestell_mails(array $best, array $info, string $hinweis): void {
    $k = $best['kunde'];
    $zeilen = [];
    foreach ($best['positionen'] as $p) $zeilen[] = sprintf('%d × %s  %s', $p['stueck'], $p['name'], euro_text((int) ($p['brutto'] ?? 0)));
    if (!empty($best['versand'])) $zeilen[] = 'Versand  ' . euro_text((int) $best['versand']);
    $zahlung = match ($info['art'] ?? '') {
        'ueberweisung' => "Bitte überweise " . euro_text($best['brutto']) . " an:\n" . ($info['inhaber'] ?: 'ZUKKABRO') . "\nIBAN: " . $info['iban'] . ($info['bank'] ? "\nBank: " . $info['bank'] : '') . "\nVerwendungszweck: " . $best['id'] . "\nVersand innerhalb von 3 Werktagen nach Zahlungseingang.",
        'paypal' => "Bitte zahle " . euro_text($best['brutto']) . " per PayPal an: " . $info['ziel'] . "\nVerwendungszweck: " . $best['id'],
        'stripe' => "Deine Zahlung läuft über Stripe. Du bekommst von Stripe eine eigene Zahlungsbestätigung.",
        default => "Du zahlst " . euro_text($best['brutto']) . " bar bei der Abholung" . (!empty($info['abholort']) ? ' (' . $info['abholort'] . ')' : '') . '.',
    };
    $adresse = $best['lieferart'] === 'abholung' ? 'Abholung in Heilbronn' : trim($k['vorname'] . ' ' . $k['nachname'] . "\n" . $k['strasse'] . "\n" . $k['plz'] . ' ' . $k['ort']);
    $text = "Hey {$k['vorname']},\n\ndanke für deine Bestellung bei ZUKKABRO!\n\nBestellnummer: {$best['id']}\n\n" . implode("\n", $zeilen) . "\nGesamt: " . euro_text($best['brutto']) . " (inkl. MwSt.)\n\nLieferung: $adresse\n\nZahlung: {$best['zahlart']}\n$zahlung\n" .
        (!empty($best['ab18']) ? "\nDein Warenkorb enthält Artikel ab 18. Bitte halte bei der Übergabe deinen Ausweis bereit.\n" : '') . ($hinweis ? "\n$hinweis\n" : '') . "\nBis bald,\ndein ZUKKABRO-Team\nhttps://zukkabro.de";
    mail_senden($k['email'], 'Deine Bestellung ' . $best['id'] . ' bei ZUKKABRO', $text);
    mail_an_team('Neue Bestellung ' . $best['id'] . ' (' . euro_text($best['brutto']) . ', ' . $best['zahlart'] . ')',
        "Neue Kundenbestellung {$best['id']}\n\n" . implode("\n", $zeilen) . "\nGesamt: " . euro_text($best['brutto']) . "\n\nKunde: {$k['vorname']} {$k['nachname']}, {$k['email']}" . ($k['telefon'] ? ', ' . $k['telefon'] : '') . "\n$adresse\nZahlung: {$best['zahlart']}\n" . ($best['notiz'] ? "Notiz: {$best['notiz']}\n" : '') . "\nAdmin: https://zukkabro.de/admin/");
}

/* =================== News (Startseite, News-Seite, App) =================== */
function news(): array { $n = lese('news/alle'); return is_array($n) ? $n : []; }
function news_oeffentlich(): never {
    $alle = array_values(array_filter(news(), fn($n) => !empty($n['aktiv'])));
    usort($alle, fn($a, $b) => strcmp($b['datum'], $a['datum']));
    antwort(['news' => array_map(fn($n) => ['id' => $n['id'], 'titel' => $n['titel'], 'text' => $n['text'], 'link' => $n['link'], 'datum' => $n['datum']], array_slice($alle, 0, 20))]);
}
function news_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['news'] ?? null) ? array_slice($b['news'], 0, 50) : [];
    $alt = []; foreach (news() as $x) $alt[$x['id']] = $x;
    $liste = [];
    foreach ($roh as $r) {
        if (!is_array($r)) continue;
        $titel = text($r['titel'] ?? '', 120);
        if ($titel === '') throw new Fehler(400, 'Jede News braucht eine Überschrift.');
        $id = preg_match('/^N-[A-Za-z0-9-]{4,40}$/', (string) ($r['id'] ?? '')) ? (string) $r['id'] : neue_id('N-');
        $link = text($r['link'] ?? '', 300);
        if ($link !== '' && !preg_match('#^(https?://|/)#', $link)) throw new Fehler(400, 'Link bitte mit https:// oder / beginnen.');
        $liste[] = ['id' => $id, 'titel' => $titel, 'text' => text($r['text'] ?? '', 1000), 'link' => $link, 'datum' => datum($r['datum'] ?? substr(jetzt(), 0, 10)),
            'aktiv' => ($r['aktiv'] ?? true) !== false, 'erstellt' => $alt[$id]['erstellt'] ?? jetzt()];
    }
    schreibe('news/alle', $liste);
    protokoll('news-geaendert', $s['id'], ['anzahl' => count($liste)]);
    antwort(['ok' => true, 'news' => $liste]);
}

/* ---------- Kontaktformular ---------- */
function kontakt(string $ip): never {
    bremse('kontakt', $ip, 5, 60);
    $b = body();
    $n = [
        'id' => neue_id('N-'), 'name' => text($b['name'] ?? '', 100), 'email' => strtolower(text($b['email'] ?? '', 120)), 'telefon' => text($b['telefon'] ?? '', 40),
        'betreff' => text($b['betreff'] ?? '', 120), 'text' => text($b['text'] ?? '', 2000), 'erstellt' => jetzt(), 'gelesen' => false,
    ];
    if ($n['name'] === '' || $n['text'] === '') throw new Fehler(400, 'Bitte Name und Nachricht angeben.');
    if (!email_ok($n['email'])) throw new Fehler(400, 'Bitte eine gültige E-Mail-Adresse angeben.');
    if (($b['datenschutz'] ?? null) !== true) throw new Fehler(400, 'Bitte die Datenschutzerklärung bestätigen.');
    if (text($b['website'] ?? '', 10) !== '') antwort(['ok' => true, 'id' => $n['id']]); // Honigtopf: nur Bots füllen das versteckte Feld
    schreibe('nachrichten/' . $n['id'], $n);
    protokoll('nachricht-neu', $n['email'], ['id' => $n['id'], 'betreff' => $n['betreff']]);
    mail_an_team('Neue Nachricht: ' . ($n['betreff'] ?: 'Kontaktformular'), "Von: {$n['name']} <{$n['email']}>" . ($n['telefon'] ? " · {$n['telefon']}" : '') . "\n\n{$n['text']}\n\nAdmin: https://zukkabro.de/admin/");
    antwort(['ok' => true, 'id' => $n['id']]);
}
function nachricht_status(): never {
    $b = body();
    $id = text($b['id'] ?? '', 40);
    if (!preg_match('/^N-\d{8}-[0-9A-F]{8}$/', $id)) throw new Fehler(404, 'Nachricht nicht gefunden.');
    $n = lese('nachrichten/' . $id);
    if (!$n) throw new Fehler(404, 'Nachricht nicht gefunden.');
    $n['gelesen'] = ($b['gelesen'] ?? true) !== false;
    schreibe('nachrichten/' . $id, $n);
    antwort(['ok' => true, 'nachricht' => $n]);
}

/* ---------- Angebote (Slider auf der Startseite, Aktionspreise) ---------- */
function angebote(): array { $a = lese('angebote/alle'); return is_array($a) ? $a : []; }
/** Nur laufende Angebote: aktiv, Produkt vorhanden und lieferbar, Enddatum nicht überschritten */
function laufende_angebote(): array {
    $heute = substr(jetzt(), 0, 10);
    return array_values(array_filter(angebote(), function ($a) use ($heute) {
        $p = produkt((string) $a['id']);
        return !empty($a['aktiv']) && $p && empty($p['x']) && (empty($a['bis']) || $a['bis'] >= $heute);
    }));
}
/** Endkundenpreise inkl. Aktionspreise: ein laufendes Angebot ersetzt den Shop-Preis */
function effektive_preise(): array {
    $shop = shop_preise(); $preise = $shop; $liste = [];
    foreach (laufende_angebote() as $a) {
        $regulaer = $shop[$a['id']] ?? null;
        $preise[$a['id']] = ['preis' => $a['preis'], 'mwst' => $regulaer ? $regulaer['mwst'] : mwst_vorschlag($a['id'])];
        $a['alt'] = $regulaer && $regulaer['preis'] > $a['preis'] ? $regulaer['preis'] : null;
        $liste[] = $a;
    }
    return ['preise' => $preise, 'angebote' => $liste];
}
function angebote_speichern(array $s): never {
    $b = body();
    $roh = is_array($b['angebote'] ?? null) ? array_slice($b['angebote'], 0, 12) : [];
    $ids = []; $liste = [];
    foreach ($roh as $r) {
        $id = text($r['id'] ?? '', 200);
        $p = produkt($id);
        if (!$p) throw new Fehler(400, 'Unbekanntes Produkt: ' . ($id ?: '(leer)'));
        if (isset($ids[$id])) throw new Fehler(400, "{$p['n']} ist doppelt im Angebot.");
        $ids[$id] = true;
        $bis = text($r['bis'] ?? '', 10);
        if ($bis !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $bis)) throw new Fehler(400, 'Enddatum bitte als Datum angeben.');
        $liste[] = ['id' => $id, 'preis' => ganz($r['preis'] ?? null, 1, 10000000), 'titel' => text($r['titel'] ?? '', 40), 'aktiv' => ($r['aktiv'] ?? true) !== false, 'bis' => $bis];
    }
    schreibe('angebote/alle', $liste);
    protokoll('angebote-geaendert', $s['id'], ['anzahl' => count($liste)]);
    antwort(['ok' => true, 'angebote' => $liste]);
}

function shop_daten(): never {
    ['preise' => $preise, 'angebote' => $laufend] = effektive_preise(); $e = einstellungen();
    // Eröffnungsmodus (Vorverkauf): Seite offen, aber Preise, Angebote und Bestellung bleiben bis zur Eröffnung weg
    $vv = (bool) $e['vorverkauf'];
    $nur = [];
    if (!$vv) foreach ($preise as $id => $p) if (produkt((string) $id)) $nur[$id] = $p['preis'];
    $ang = $vv ? [] : array_map(fn($a) => ['id' => $a['id'], 'preis' => $a['preis'], 'alt' => $a['alt'], 'titel' => $a['titel'], 'bis' => $a['bis']], $laufend);
    $pk = [];
    foreach (pakete() as $p) {
        if (!$p['aktiv']) continue;
        $pk[] = array_merge(['id' => $p['id'], 'name' => $p['name'], 'untertitel' => $p['untertitel'], 'emoji' => $p['emoji'], 'farbe' => $p['farbe'],
            'inhalt' => $p['inhalt'], 'preis' => $vv ? null : $p['preis']], paket_status($p));
    }
    antwort([
        'preise' => obj($nur), 'angebote' => $ang,
        'versand' => ['kosten' => $e['versand'], 'freiAb' => $e['versandfreiAb'], 'abholung' => $e['abholung'], 'abholort' => $e['abholort'],
            'kurier' => ['aktiv' => (bool) $e['kurier'], 'kosten' => $e['kurierKosten'], 'ab' => $e['kurierAb'], 'freiAb' => $e['kurierFreiAb'], 'plz' => kurier_plz_liste($e)]],
        'zahlarten' => $vv ? [] : zahlarten($e), 'ohnePreisAusblenden' => !$vv && (bool) $e['ohnePreisAusblenden'],
        'vorverkauf' => ['aktiv' => $vv, 'text' => $e['eroeffnung']], 'pakete' => $pk,
    ]);
}

function kasse(string $ip): never {
    bremse('kasse', $ip, 10, 60);
    $b = body();
    $preise = effektive_preise()['preise']; $e = einstellungen(); $allePakete = pakete();
    if ($e['vorverkauf']) throw new Fehler(409, 'Der Online-Shop öffnet ' . $e['eroeffnung'] . '. Bis dahin sind noch keine Bestellungen möglich.');
    $k = is_array($b['kunde'] ?? null) ? $b['kunde'] : [];
    $kunde = [
        'vorname' => text($k['vorname'] ?? '', 80), 'nachname' => text($k['nachname'] ?? '', 80), 'email' => strtolower(text($k['email'] ?? '', 120)),
        'telefon' => text($k['telefon'] ?? '', 40), 'strasse' => text($k['strasse'] ?? '', 120), 'plz' => text($k['plz'] ?? '', 10), 'ort' => text($k['ort'] ?? '', 80),
    ];
    $lieferart = ($b['lieferart'] ?? '') === 'abholung' ? 'abholung' : (($b['lieferart'] ?? '') === 'kurier' ? 'kurier' : 'versand');
    if ($lieferart === 'abholung' && !$e['abholung']) throw new Fehler(400, 'Abholung ist zurzeit nicht möglich.');
    if ($lieferart === 'kurier' && !$e['kurier']) throw new Fehler(400, 'Lieferung in Heilbronn ist zurzeit nicht möglich.');
    if (!$kunde['vorname'] || !$kunde['nachname']) throw new Fehler(400, 'Bitte Vor- und Nachnamen angeben.');
    if (!email_ok($kunde['email'])) throw new Fehler(400, 'Bitte eine gültige E-Mail-Adresse angeben.');
    if ($lieferart !== 'abholung' && (!$kunde['strasse'] || !$kunde['plz'] || !$kunde['ort'])) throw new Fehler(400, 'Bitte die vollständige Lieferadresse angeben.');
    if ($lieferart === 'kurier' && !in_array($kunde['plz'], kurier_plz_liste($e), true)) throw new Fehler(400, 'Lieferung per Kurier gibt es nur in Heilbronn (PLZ ' . implode(', ', kurier_plz_liste($e)) . '). Bitte Versand wählen.');
    $zahlart = text($b['zahlart'] ?? '', 40);
    if (!in_array($zahlart, zahlarten($e), true)) throw new Fehler(400, 'Bitte eine Zahlungsart wählen.');
    if ($zahlart === 'Bar bei Abholung' && $lieferart !== 'abholung') throw new Fehler(400, 'Barzahlung geht nur bei Abholung.');
    if (($b['agb'] ?? null) !== true || ($b['datenschutz'] ?? null) !== true) throw new Fehler(400, 'Bitte AGB, Widerrufsbelehrung und Datenschutz bestätigen.');

    $positionen = []; $ab18 = false;
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 100) as $r) {
        $id = text($r['produktId'] ?? '', 200);
        if (str_starts_with($id, 'paket:')) {
            $pk = null;
            foreach ($allePakete as $x) if ($x['id'] === substr($id, 6) && $x['aktiv']) $pk = $x;
            if (!$pk || $pk['preis'] === null) throw new Fehler(400, 'Ein Paket im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.');
            $st = paket_status($pk);
            if (!$st['lieferbar']) throw new Fehler(400, "Paket {$pk['name']} ist gerade nicht vollständig lieferbar.");
            $menge = ganz($r['menge'] ?? null, 1, 99);
            if ($st['ab18']) $ab18 = true;
            $brutto = $menge * $pk['preis']; $mw = mwst_aus_brutto($brutto, $pk['mwst']);
            $positionen[] = ['produktId' => $id, 'name' => 'Paket: ' . $pk['name'], 've' => 1, 'anzahlVE' => $menge, 'stueck' => $menge,
                'preis' => (int) round($pk['preis'] * 100 / (100 + $pk['mwst'])), 'mwst' => $pk['mwst'], 'netto' => $brutto - $mw, 'brutto' => $brutto];
            continue;
        }
        $prod = produkt($id); $preis = $preise[$id] ?? null;
        if (!$prod || !$preis) throw new Fehler(400, 'Ein Artikel im Warenkorb ist nicht mehr erhältlich. Bitte Warenkorb prüfen.');
        if (!empty($prod['x'])) throw new Fehler(400, "{$prod['n']} ist gerade nicht lieferbar.");
        $menge = ganz($r['menge'] ?? null, 1, 999);
        if (!empty($prod['a'])) $ab18 = true;
        $brutto = $menge * $preis['preis']; $mw = mwst_aus_brutto($brutto, $preis['mwst']);
        $positionen[] = ['produktId' => $id, 'name' => $prod['n'], 've' => 1, 'anzahlVE' => $menge, 'stueck' => $menge,
            'preis' => (int) round($preis['preis'] * 100 / (100 + $preis['mwst'])), 'mwst' => $preis['mwst'], 'netto' => $brutto - $mw, 'brutto' => $brutto];
    }
    if (!$positionen) throw new Fehler(400, 'Dein Warenkorb ist leer.');
    if ($ab18) {
        $gd = datum($b['geburtsdatum'] ?? '');
        if (alter_jahre($gd) < 18) throw new Fehler(403, 'Artikel ab 18 dürfen wir nur an Volljährige verkaufen.');
        if (($b['ab18Bestaetigt'] ?? null) !== true) throw new Fehler(400, 'Bitte bestätige, dass du mindestens 18 Jahre alt bist.');
        $kunde['geburtsdatum'] = $gd;
    }
    $waren = array_sum(array_column($positionen, 'brutto'));
    if ($lieferart === 'kurier' && $waren < $e['kurierAb']) throw new Fehler(400, 'Lieferung in Heilbronn erst ab einem Warenwert von ' . number_format($e['kurierAb'] / 100, 2, ',', '.') . ' €.');
    $versand = $lieferart === 'versand' ? (($e['versandfreiAb'] > 0 && $waren >= $e['versandfreiAb']) ? 0 : (int) $e['versand'])
        : ($lieferart === 'kurier' ? (($e['kurierFreiAb'] > 0 && $waren >= $e['kurierFreiAb']) ? 0 : (int) $e['kurierKosten']) : 0);
    $mwst = 0; foreach ($positionen as $p) $mwst += $p['brutto'] - $p['netto'];
    $mwst += mwst_aus_brutto($versand, 19);
    $brutto = $waren + $versand;
    $best = [
        'id' => neue_id('ZK-'), 'art' => 'kunde', 'haendlerId' => '', 'firma' => $kunde['vorname'] . ' ' . $kunde['nachname'], 'positionen' => $positionen,
        'netto' => $brutto - $mwst, 'mwst' => $mwst, 'brutto' => $brutto, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu', 'erstellt' => jetzt(),
        'verlauf' => [['status' => 'neu', 'von' => 'Kunde', 'am' => jetzt()]], 'kunde' => $kunde, 'lieferart' => $lieferart, 'zahlart' => $zahlart,
        'versand' => $versand, 'ab18' => $ab18,
    ];
    schreibe('bestellungen/' . $best['id'], $best);
    protokoll('kundenbestellung-neu', $kunde['email'], ['bestellung' => $best['id'], 'brutto' => $brutto]);
    if ($zahlart === 'Online bezahlen') {
        // Stripe Checkout: Kunde zahlt auf der Stripe-Seite, Bestätigung kommt per Webhook
        $origin = (ist_https() ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'zukkabro.de');
        $sitzung = stripe_sitzung($best, $kunde['email'], $origin);
        $best['stripe'] = ['session' => (string) ($sitzung['id'] ?? ''), 'status' => 'offen'];
        schreibe('bestellungen/' . $best['id'], $best);
        $info = ['art' => 'stripe', 'betrag' => $brutto, 'url' => (string) ($sitzung['url'] ?? '')];
    }
    elseif (str_starts_with($zahlart, 'Überweisung')) $info = ['art' => 'ueberweisung', 'inhaber' => $e['bankInhaber'], 'iban' => $e['bankIban'], 'bank' => $e['bankName'], 'betrag' => $brutto, 'verwendungszweck' => $best['id']];
    elseif ($zahlart === 'PayPal') $info = ['art' => 'paypal', 'ziel' => $e['paypal'], 'betrag' => $brutto, 'verwendungszweck' => $best['id']];
    else $info = ['art' => 'bar', 'betrag' => $brutto, 'abholort' => $e['abholort']];
    bestell_mails($best, $info, (string) $e['hinweis']);
    antwort(['ok' => true, 'nr' => $best['id'], 'brutto' => $brutto, 'versand' => $versand, 'zahlungsinfo' => $info, 'hinweis' => $e['hinweis'], 'ab18' => $ab18]);
}

/* =================== Händler-Bestellungen =================== */
function bestellen(array $h): never {
    $b = body(); $liste = preisliste(); $positionen = [];
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 300) as $p) {
        $pid = text($p['produktId'] ?? '', 200);
        $preis = $liste[$pid] ?? null;
        if (!$preis || !$preis['aktiv']) throw new Fehler(400, "Produkt nicht bestellbar: $pid");
        $anzahlVE = ganz($p['anzahlVE'] ?? null, 1, 10000);
        if ($anzahlVE < $preis['mindest']) throw new Fehler(400, "{$preis['name']}: Mindestens {$preis['mindest']} VE.");
        $stueck = $anzahlVE * $preis['ve']; $stueckpreis = staffel_preis($preis, $anzahlVE);
        $positionen[] = ['produktId' => $pid, 'name' => $preis['name'], 've' => $preis['ve'], 'anzahlVE' => $anzahlVE, 'stueck' => $stueck,
            'preis' => $stueckpreis, 'mwst' => $preis['mwst'], 'netto' => $stueck * $stueckpreis];
    }
    if (!$positionen) throw new Fehler(400, 'Der Warenkorb ist leer.');
    $netto = array_sum(array_column($positionen, 'netto'));
    $mwst = 0; foreach ($positionen as $p) $mwst += (int) round($p['netto'] * $p['mwst'] / 100);
    $best = ['id' => neue_id('ZB-'), 'art' => 'haendler', 'haendlerId' => $h['id'], 'firma' => $h['firma'], 'positionen' => $positionen,
        'netto' => $netto, 'mwst' => $mwst, 'brutto' => $netto + $mwst, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu',
        'erstellt' => jetzt(), 'verlauf' => [['status' => 'neu', 'von' => $h['id'], 'am' => jetzt()]]];
    schreibe('bestellungen/' . $best['id'], $best);
    protokoll('bestellung-neu', $h['id'], ['bestellung' => $best['id'], 'brutto' => $best['brutto']]);
    antwort(['ok' => true, 'bestellung' => $best]);
}

function preisanfrage(array $h): never {
    $b = body(); $positionen = [];
    foreach (array_slice(is_array($b['positionen'] ?? null) ? $b['positionen'] : [], 0, 200) as $r) {
        $id = text($r['produktId'] ?? '', 200); $prod = produkt($id);
        if (!$prod) continue;
        $stueck = ganz($r['stueck'] ?? null, 1, 1000000);
        $positionen[] = ['produktId' => $id, 'name' => $prod['n'], 've' => 1, 'anzahlVE' => $stueck, 'stueck' => $stueck, 'preis' => 0, 'mwst' => mwst_vorschlag($id), 'netto' => 0];
    }
    if (!$positionen) throw new Fehler(400, 'Bitte mindestens ein Produkt mit Wunschmenge auswählen.');
    $a = ['id' => neue_id('PA-'), 'art' => 'preisanfrage', 'haendlerId' => $h['id'], 'firma' => $h['firma'], 'positionen' => $positionen,
        'netto' => 0, 'mwst' => 0, 'brutto' => 0, 'notiz' => text($b['notiz'] ?? '', 1000), 'status' => 'neu', 'erstellt' => jetzt(),
        'verlauf' => [['status' => 'neu', 'von' => $h['id'], 'am' => jetzt()]]];
    schreibe('bestellungen/' . $a['id'], $a);
    protokoll('preisanfrage-neu', $h['id'], ['anfrage' => $a['id'], 'artikel' => count($positionen)]);
    antwort(['ok' => true, 'anfrage' => $a]);
}

function bestell_id(mixed $v): string {
    $id = text($v, 40);
    if (!preg_match('/^[A-Z]{2}-\d{8}-[0-9A-F]{8}$/', $id)) throw new Fehler(404, 'Bestellung nicht gefunden.');
    return $id;
}

function bestell_status(array $s): never {
    $b = body(); $id = bestell_id($b['id'] ?? '');
    $status = $b['status'] ?? '';
    if (!in_array($status, BESTELL_STATUS, true)) throw new Fehler(400, 'Unbekannter Status.');
    $best = lese('bestellungen/' . $id);
    if (!$best) throw new Fehler(404, 'Bestellung nicht gefunden.');
    $best['status'] = $status;
    $best['verlauf'][] = ['status' => $status, 'von' => $s['id'], 'am' => jetzt()];
    schreibe('bestellungen/' . $id, $best);
    antwort(['ok' => true, 'bestellung' => $best]);
}

/* =================== Buchhaltung =================== */
function neue_buchung(array $d, string $von): array {
    $b = array_merge($d, ['id' => neue_id('BU-'), 'erfasstVon' => $von, 'erfasstAm' => jetzt()]);
    schreibe('buchungen/' . substr($b['datum'], 0, 4) . '/' . $b['erfasstAm'] . '-' . $b['id'], $b);
    return $b;
}

/** Verkauf einer Bestellung ins Journal buchen (Admin-Klick oder automatisch nach Online-Zahlung) */
function buche_bestellung(array $best, string $zahlung, string $von): void {
    $tag = substr(jetzt(), 0, 10);
    $wer = (($best['art'] ?? '') === 'kunde' ? 'Kunde: ' : 'Händler: ') . $best['firma'];
    foreach ($best['positionen'] as $p) {
        $betrag = isset($p['brutto']) ? (int) $p['brutto'] : $p['netto'] + (int) round($p['netto'] * $p['mwst'] / 100);
        neue_buchung(['typ' => 'verkauf', 'datum' => $tag, 'produktId' => $p['produktId'], 'name' => $p['name'], 'menge' => $p['stueck'],
            'einzelpreis' => (int) round($betrag / $p['stueck']), 'betrag' => $betrag, 'mwst' => $p['mwst'], 'zahlungsart' => $zahlung,
            'beleg' => $best['id'], 'notiz' => $wer], $von);
    }
    if (!empty($best['versand'])) {
        neue_buchung(['typ' => 'einnahme', 'datum' => $tag, 'produktId' => '', 'name' => 'Versandkosten', 'menge' => 1, 'einzelpreis' => $best['versand'],
            'betrag' => $best['versand'], 'mwst' => 19, 'zahlungsart' => $zahlung, 'beleg' => $best['id'], 'notiz' => $wer], $von);
    }
    $best['gebucht'] = true;
    $best['verlauf'][] = ['status' => $best['status'], 'von' => $von . ' (gebucht)', 'am' => jetzt()];
    schreibe('bestellungen/' . $best['id'], $best);
}
function bestellung_buchen(array $s): never {
    $b = body(); $id = bestell_id($b['id'] ?? '');
    $best = lese('bestellungen/' . $id);
    if (!$best) throw new Fehler(404, 'Bestellung nicht gefunden.');
    if (!empty($best['gebucht'])) throw new Fehler(409, 'Diese Bestellung ist schon gebucht.');
    if ($best['status'] === 'storniert') throw new Fehler(400, 'Stornierte Bestellungen können nicht gebucht werden.');
    if (($best['art'] ?? '') === 'preisanfrage') throw new Fehler(400, 'Preisanfragen sind keine Verkäufe und werden nicht gebucht.');
    $zahlung = text($b['zahlungsart'] ?? '', 40) ?: ($best['zahlart'] ?? '') ?: 'Rechnung';
    buche_bestellung($best, $zahlung, $s['id']);
    antwort(['ok' => true, 'bestellung' => lese('bestellungen/' . $id)]);
}

function buchung_anlegen(array $s): never {
    $b = body();
    $typ = $b['typ'] ?? '';
    if (!in_array($typ, BUCH_TYPEN, true)) throw new Fehler(400, 'Unbekannte Buchungsart.');
    $mwst = mwst_pruefen($b['mwst'] ?? null);
    $menge = ganz($b['menge'] ?? 1, 1, 1000000);
    $einzel = ganz($b['einzelpreis'] ?? null, 0, 100000000);
    $name = text($b['name'] ?? '', 200);
    if (!$name) throw new Fehler(400, 'Bitte eine Bezeichnung angeben.');
    $buchung = neue_buchung(['typ' => $typ, 'datum' => datum($b['datum'] ?? ''), 'produktId' => text($b['produktId'] ?? '', 200), 'name' => $name,
        'menge' => $menge, 'einzelpreis' => $einzel, 'betrag' => $menge * $einzel, 'mwst' => $mwst, 'zahlungsart' => text($b['zahlungsart'] ?? '', 40),
        'beleg' => text($b['beleg'] ?? '', 80), 'notiz' => text($b['notiz'] ?? '', 500)], $s['id']);
    antwort(['ok' => true, 'buchung' => $buchung]);
}

function buchung_storno(array $s): never {
    $b = body();
    $id = text($b['id'] ?? '', 40);
    $jahr = text($b['jahr'] ?? '', 4);
    if (!preg_match('/^\d{4}$/', $jahr)) throw new Fehler(404, 'Buchung nicht gefunden.');
    $grund = text($b['grund'] ?? '', 300);
    if (!$grund) throw new Fehler(400, 'Bitte einen Grund für das Storno angeben.');
    $alle = lese_alle("buchungen/$jahr/");
    $orig = null;
    foreach ($alle as $x) if ($x['id'] === $id) $orig = $x;
    if (!$orig || $orig['typ'] === 'storno') throw new Fehler(404, 'Buchung nicht gefunden.');
    foreach ($alle as $x) if ($x['typ'] === 'storno' && ($x['bezug'] ?? '') === $id) throw new Fehler(409, 'Diese Buchung ist schon storniert.');
    $storno = neue_buchung(['typ' => 'storno', 'datum' => substr(jetzt(), 0, 10), 'produktId' => $orig['produktId'], 'name' => $orig['name'], 'menge' => $orig['menge'],
        'einzelpreis' => $orig['einzelpreis'], 'betrag' => $orig['betrag'], 'mwst' => $orig['mwst'], 'zahlungsart' => $orig['zahlungsart'],
        'beleg' => $orig['beleg'], 'notiz' => $grund, 'bezug' => $id], $s['id']);
    antwort(['ok' => true, 'buchung' => $storno]);
}

/* =================== Router =================== */
function zb_api(): never {
    $pfad = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pfad = rtrim(preg_replace('#^/api#', '', $pfad), '/') ?: '/';
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
    try {
        // Stripe ruft den Webhook ohne unseren Header auf, die Signatur schützt ihn
        if ($m === 'POST' && $pfad === '/stripe/webhook') stripe_webhook();
        // Schutz vor fremden Formularen: schreibende Anfragen brauchen unseren Header
        if ($m !== 'GET' && ($_SERVER['HTTP_X_ZB'] ?? '') !== '1') throw new Fehler(403, 'Anfrage abgelehnt.');
        $s = lese_sitzung();

        if ($m === 'POST' && $pfad === '/login') login($ip);
        if ($m === 'POST' && $pfad === '/logout') { sitzung_beenden(); antwort(['ok' => true]); }
        if ($m === 'GET' && $pfad === '/ich') ich($s);
        if ($m === 'POST' && $pfad === '/haendler/registrieren') registrieren($ip);
        if ($m === 'GET' && $pfad === '/shop/daten') shop_daten();
        if ($m === 'POST' && $pfad === '/shop/bestellung') kasse($ip);
        if ($m === 'POST' && $pfad === '/kontakt') kontakt($ip);
        if ($m === 'GET' && $pfad === '/shop/laden') laden_daten();
        if ($m === 'GET' && $pfad === '/shop/news') news_oeffentlich();
        if ($m === 'GET' && $pfad === '/shop/stempel') stempel_status($ip);
        if ($m === 'POST' && $pfad === '/shop/stempel/neu') stempel_neu($ip);
        if ($m === 'GET' && $pfad === '/shop/bestellung/status') stripe_bestell_status();

        if (str_starts_with($pfad, '/haendler/')) {
            $h = aktiver_haendler($s);
            if ($m === 'GET' && $pfad === '/haendler/preise') {
                $sichtbar = [];
                foreach (preisliste() as $id => $p) if ($p['aktiv']) $sichtbar[$id] = $p;
                antwort(['preise' => obj($sichtbar)]);
            }
            if ($m === 'GET' && $pfad === '/haendler/bestellungen') {
                $eigene = array_values(array_filter(lese_alle('bestellungen/'), fn($b) => $b['haendlerId'] === $h['id']));
                antwort(['bestellungen' => array_reverse($eigene)]);
            }
            if ($m === 'POST' && $pfad === '/haendler/bestellungen') bestellen($h);
            if ($m === 'POST' && $pfad === '/haendler/preisanfrage') preisanfrage($h);
            throw new Fehler(404, 'Nicht gefunden.');
        }

        if (str_starts_with($pfad, '/admin/')) {
            $a = braucht($s, 'admin');
            if ($m === 'GET' && $pfad === '/admin/haendler') antwort(['haendler' => array_reverse(array_map('ohne_pass', lese_alle('haendler/')))]);
            if ($m === 'POST' && $pfad === '/admin/haendler/status') {
                $b = body();
                $hid = text($b['id'] ?? '', 40);
                if (!preg_match('/^H-\d{8}-[0-9A-F]{8}$/', $hid)) throw new Fehler(404, 'Händler nicht gefunden.');
                $h = lese('haendler/' . $hid);
                if (!$h) throw new Fehler(404, 'Händler nicht gefunden.');
                $status = $b['status'] ?? '';
                if (!in_array($status, ['offen', 'aktiv', 'gesperrt'], true)) throw new Fehler(400, 'Unbekannter Status.');
                $h['status'] = $status; $h['geaendert'] = jetzt();
                if (is_string($b['notiz'] ?? null)) $h['notiz'] = text($b['notiz'], 500);
                schreibe('haendler/' . $h['id'], $h);
                protokoll('haendler-status', $a['id'], ['haendler' => $h['id'], 'status' => $status]);
                antwort(['ok' => true, 'haendler' => ohne_pass($h)]);
            }
            if ($m === 'GET' && $pfad === '/admin/preise') antwort(['preise' => obj(preisliste()), 'shop' => obj(shop_preise()), 'einstellungen' => einstellungen(), 'mailAktiv' => true]);
            if ($m === 'POST' && $pfad === '/admin/mail-test') mail_test($a);
            if ($m === 'POST' && $pfad === '/admin/shoppreise') shop_preise_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/news') antwort(['news' => news()]);
            if ($m === 'POST' && $pfad === '/admin/news') news_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/laden') antwort(['laden' => laden_einstellungen(), 'karte' => karte(), 'allergene' => ALLERGENE, 'arten' => KARTE_ARTEN]);
            if ($m === 'POST' && $pfad === '/admin/laden') laden_speichern($a);
            if ($m === 'POST' && $pfad === '/admin/karte') karte_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/kasse') kasse_antwort(kassen_tag(kassen_tag_param($_GET['tag'] ?? '')));
            if ($m === 'GET' && $pfad === '/admin/stempel') stempel_antwort(stempel_lesen(stempel_code_param($_GET['code'] ?? '')));
            if ($m === 'POST' && $pfad === '/admin/stempel') stempel_aktion($a);
            if ($m === 'GET' && $pfad === '/admin/kasse/berichte') kasse_berichte();
            if ($m === 'POST' && $pfad === '/admin/kasse/verkauf') kasse_verkauf();
            if ($m === 'POST' && $pfad === '/admin/kasse/ausgabe') kasse_ausgabe();
            if ($m === 'POST' && $pfad === '/admin/kasse/storno') kasse_storno();
            if ($m === 'POST' && $pfad === '/admin/kasse/anfang') kasse_anfang();
            if ($m === 'POST' && $pfad === '/admin/kasse/abschluss') kasse_abschluss($a);
            if ($m === 'GET' && $pfad === '/admin/nachrichten') antwort(['nachrichten' => array_reverse(lese_alle('nachrichten/'))]);
            if ($m === 'POST' && $pfad === '/admin/nachrichten/status') nachricht_status();
            if ($m === 'GET' && $pfad === '/admin/angebote') antwort(['angebote' => angebote()]);
            if ($m === 'POST' && $pfad === '/admin/angebote') angebote_speichern($a);
            if ($m === 'POST' && $pfad === '/admin/einstellungen') einstellungen_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/pakete') antwort(['pakete' => pakete()]);
            if ($m === 'POST' && $pfad === '/admin/pakete') pakete_speichern($a);
            if ($m === 'POST' && $pfad === '/admin/preise') preise_speichern($a);
            if ($m === 'GET' && $pfad === '/admin/bestellungen') antwort(['bestellungen' => array_reverse(lese_alle('bestellungen/'))]);
            if ($m === 'POST' && $pfad === '/admin/bestellungen/status') bestell_status($a);
            if ($m === 'POST' && $pfad === '/admin/bestellungen/buchen') bestellung_buchen($a);
            if ($m === 'GET' && $pfad === '/admin/buchungen') {
                $wunsch = (string) ($_GET['jahr'] ?? '');
                if ($wunsch === 'alle') antwort(['jahr' => 'alle', 'buchungen' => lese_alle('buchungen/')]);
                $jahr = preg_match('/^\d{4}$/', $wunsch) ? $wunsch : gmdate('Y');
                antwort(['jahr' => $jahr, 'buchungen' => lese_alle("buchungen/$jahr/")]);
            }
            if ($m === 'POST' && $pfad === '/admin/buchungen') buchung_anlegen($a);
            if ($m === 'POST' && $pfad === '/admin/buchungen/storno') buchung_storno($a);
            if ($m === 'GET' && $pfad === '/admin/protokoll') {
                $monat = preg_match('/^\d{4}-\d{2}$/', (string) ($_GET['monat'] ?? '')) ? $_GET['monat'] : substr(jetzt(), 0, 7);
                antwort(['protokoll' => array_slice(array_reverse(lese_alle("protokoll/$monat/")), 0, 500)]);
            }
            throw new Fehler(404, 'Nicht gefunden.');
        }
        throw new Fehler(404, 'Nicht gefunden.');
    } catch (Fehler $e) {
        antwort(['fehler' => $e->getMessage()], $e->status);
    } catch (Throwable $e) {
        error_log('ZUKKABRO API: ' . $e->getMessage());
        antwort(['fehler' => 'Serverfehler. Bitte später erneut versuchen.'], 500);
    }
}
