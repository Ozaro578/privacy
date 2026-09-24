<?php
// ZUKKABRO – Eingang für Strato (PHP 8.1+).
// Jede Anfrage läuft hier durch (.htaccess leitet alles auf diese Datei):
//   1. Zugangsschutz: ohne Team-Passwort sieht niemand etwas (auch keine Bilder, keine API).
//   2. /api/*  -> Server-API (api/index.php)
//   3. alles andere -> Dateien aus public/ (die eigentliche Webseite)
declare(strict_types=1);

if (!is_file(__DIR__ . '/config.php')) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit('config.php fehlt.');
}
require __DIR__ . '/config.php';
require_once __DIR__ . '/api/speicher.php';
require_once __DIR__ . '/api/sicherheit.php';

const TOR_COOKIE = 'zb_tor';
const TOR_DAUER = 30 * 24 * 60 * 60;
const TOR_FELD = 'zb_tor_passwort';
const WEB = __DIR__ . '/public';

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('X-Robots-Tag: noindex, nofollow, noarchive');
if (ist_https()) header('Strict-Transport-Security: max-age=31536000');

$pfad = preg_replace('#[/\\\\]+#', '/', rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'));
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Suchmaschinen fernhalten – das darf auch ohne Passwort abgerufen werden
if ($pfad === '/robots.txt') {
    header('Content-Type: text/plain; charset=utf-8');
    exit("User-agent: *\nDisallow: /\n");
}

/* =================== 1. Zugangsschutz =================== */
function tor_offen(): bool {
    if (!defined('ZB_TOR_HASH') || ZB_TOR_HASH === '') return true; // Schutz bewusst abgeschaltet
    $teile = explode('.', $_COOKIE[TOR_COOKIE] ?? '');
    if (count($teile) !== 2 || !ctype_digit($teile[0])) return false;
    // Signatur hängt am Passwort-Hash: neues Passwort = alle alten Zugänge ungültig
    return (int) $teile[0] > time() && hash_equals(signiere('tor|' . $teile[0] . '|' . ZB_TOR_HASH), $teile[1]);
}

function tor_seite(string $fehler = ''): never {
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $f = $fehler === '' ? '' : '<p class="f">' . htmlspecialchars($fehler) . '</p>';
    echo <<<HTML
<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>ZUKKABRO</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;font-family:system-ui,sans-serif;
background:radial-gradient(circle at 20% 15%,#ff2e98 0 12%,transparent 13%),radial-gradient(circle at 85% 80%,#1ea4f0 0 10%,transparent 11%),radial-gradient(circle at 80% 10%,#e6ab35 0 6%,transparent 7%),#fbf1e6;color:#2b140a}
form{width:100%;max-width:380px;background:#fff;border:4px solid #2b140a;border-radius:24px;padding:28px;box-shadow:8px 8px 0 #9b4dff;text-align:center}
h1{margin:0 0 4px;font-size:40px;letter-spacing:1px;color:#ff2e98;text-shadow:3px 3px 0 #2b140a}p{margin:0 0 18px}
input{width:100%;font:inherit;font-size:18px;padding:12px 14px;border:3px solid #2b140a;border-radius:14px;margin-bottom:12px}
button{width:100%;font:inherit;font-size:18px;font-weight:700;padding:12px;border:3px solid #2b140a;border-radius:14px;background:#e6ab35;cursor:pointer;box-shadow:4px 4px 0 #2b140a}
.f{color:#c0005a;font-weight:700}
</style></head><body><form method="post" autocomplete="off">
<h1>👑 ZUKKABRO</h1><p>Nur für das Team. Bitte Passwort eingeben.</p>$f
<input type="password" name="zb_tor_passwort" placeholder="Passwort" required autofocus>
<button type="submit">Rein da</button></form></body></html>
HTML;
    exit;
}

function tor_bremse(): bool {
    $key = 'limit/' . kurz_hash('tor|' . ($_SERVER['REMOTE_ADDR'] ?? '?'));
    $jetzt = time();
    $e = lese($key) ?: ['n' => 0, 'seit' => $jetzt];
    if ($jetzt - (int) ($e['seit'] ?? 0) > 15 * 60) $e = ['n' => 0, 'seit' => $jetzt];
    $e['n']++;
    schreibe($key, $e);
    return $e['n'] <= 10;
}

if (!tor_offen()) {
    if ($methode === 'POST' && isset($_POST[TOR_FELD])) {
        if (!tor_bremse()) tor_seite('Zu viele Versuche. Bitte in 15 Minuten erneut probieren.');
        if (!password_verify((string) $_POST[TOR_FELD], ZB_TOR_HASH)) tor_seite('Falsches Passwort.');
        $bis = (string) (time() + TOR_DAUER);
        setze_cookie(TOR_COOKIE, $bis . '.' . signiere('tor|' . $bis . '|' . ZB_TOR_HASH), TOR_DAUER);
        $zurueck = $_SERVER['REQUEST_URI'] ?? '/';
        if (!str_starts_with($zurueck, '/') || str_starts_with($zurueck, '//') || str_contains($zurueck, '\\')) $zurueck = '/';
        header('Location: ' . $zurueck, true, 303);
        exit;
    }
    if (str_starts_with($pfad, '/api/')) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        exit('{"fehler":"Nicht angemeldet."}');
    }
    tor_seite();
}

/* =================== 2. API =================== */
if ($pfad === '/api' || str_starts_with($pfad, '/api/')) {
    require __DIR__ . '/api/index.php';
    zb_api();
}

/* =================== 3. Webseite =================== */
const TYPEN = [
    'html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'js' => 'text/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8', 'svg' => 'image/svg+xml', 'webp' => 'image/webp', 'png' => 'image/png',
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'ico' => 'image/x-icon', 'avif' => 'image/avif',
    'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ttf' => 'font/ttf', 'txt' => 'text/plain; charset=utf-8',
    'webmanifest' => 'application/manifest+json', 'mp4' => 'video/mp4', 'webm' => 'video/webm', 'pdf' => 'application/pdf',
];

function datei_finden(string $pfad): ?string {
    if (str_contains($pfad, "\0")) return null;
    $basis = realpath(WEB);
    $ziel = realpath(WEB . $pfad);
    if ($ziel === false && !str_ends_with($pfad, '/')) $ziel = realpath(WEB . $pfad . '.html'); // /sortiment -> sortiment.html
    if ($ziel === false || ($ziel !== $basis && !str_starts_with($ziel, $basis . DIRECTORY_SEPARATOR))) return null;
    if (is_dir($ziel)) {
        if (!str_ends_with($pfad, '/')) { // /admin -> /admin/
            $q = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
            header('Location: ' . $pfad . '/' . ($q ? '?' . $q : ''), true, 301);
            exit;
        }
        $ziel .= '/index.html';
    }
    // Nur bekannte Dateitypen ausliefern, keine versteckten Dateien
    if (!is_file($ziel) || str_contains($ziel, DIRECTORY_SEPARATOR . '.')) return null;
    return isset(TYPEN[strtolower(pathinfo($ziel, PATHINFO_EXTENSION))]) ? $ziel : null;
}

function ausliefern(string $datei, int $status = 200): never {
    $endung = strtolower(pathinfo($datei, PATHINFO_EXTENSION));
    $typ = TYPEN[$endung];
    $groesse = filesize($datei);
    $mtime = filemtime($datei);
    $etag = '"' . dechex($mtime) . '-' . dechex($groesse) . '"';
    header('Content-Type: ' . $typ);
    header('Vary: Accept-Encoding');
    if ($status === 200) {
        header('ETag: ' . $etag);
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
        // Seiten immer frisch, Bilder/Schriften/Skripte eine Weile im Browser behalten (nur privat, wegen Passwortschutz)
        header('Cache-Control: ' . match (true) {
            $endung === 'html' => 'private, no-cache',
            in_array($endung, ['woff2', 'woff', 'ttf'], true) => 'private, max-age=31536000, immutable',
            in_array($endung, ['css', 'js'], true) => 'private, max-age=300, must-revalidate',
            default => 'private, max-age=86400',
        });
        if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    } else {
        header('Cache-Control: no-store');
    }
    http_response_code($status);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') exit;
    $text = str_starts_with($typ, 'text/') || in_array($endung, ['json', 'svg', 'webmanifest'], true);
    if ($text && $groesse > 1024 && extension_loaded('zlib') && !ini_get('zlib.output_compression')
        && str_contains($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip')) {
        header('Content-Encoding: gzip');
        echo gzencode((string) file_get_contents($datei), 6);
    } else {
        header('Content-Length: ' . $groesse);
        readfile($datei);
    }
    exit;
}

if ($methode !== 'GET' && $methode !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}
$datei = datei_finden($pfad);
if ($datei !== null) ausliefern($datei);
ausliefern(WEB . '/404.html', 404);
