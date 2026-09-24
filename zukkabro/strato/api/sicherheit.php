<?php
// ZUKKABRO – Passwörter, Sitzungen, Hilfen
declare(strict_types=1);

const ZB_COOKIE = 'zb_sess';
const ZB_DAUER = 8 * 60 * 60;

function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64u_dec(string $s): string|false { return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4), true); }

function zb_geheim(): string {
    if (strlen(ZB_SESSION_SECRET) < 32) throw new RuntimeException('SESSION_SECRET fehlt oder ist zu kurz');
    return ZB_SESSION_SECRET;
}
function signiere(string $daten): string { return b64u(hash_hmac('sha256', $daten, zb_geheim(), true)); }

function ist_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function setze_cookie(string $name, string $wert, int $dauer): void {
    setcookie($name, $wert, ['expires' => $dauer > 0 ? time() + $dauer : time() - 3600, 'path' => '/',
        'secure' => ist_https(), 'httponly' => true, 'samesite' => 'Strict']);
}

function sitzung_setzen(string $rolle, string $id, string $name): void {
    $payload = b64u(json_encode(['r' => $rolle, 'id' => $id, 'n' => $name, 'exp' => time() + ZB_DAUER], JSON_UNESCAPED_UNICODE));
    setze_cookie(ZB_COOKIE, $payload . '.' . signiere($payload), ZB_DAUER);
}
function sitzung_beenden(): void { setze_cookie(ZB_COOKIE, '', 0); }

function lese_sitzung(): ?array {
    $wert = $_COOKIE[ZB_COOKIE] ?? '';
    $teile = explode('.', $wert);
    if (count($teile) !== 2) return null;
    [$payload, $sig] = $teile;
    if (!hash_equals(signiere($payload), $sig)) return null;
    $s = json_decode((string) b64u_dec($payload), true);
    if (!is_array($s) || ($s['exp'] ?? 0) < time() || !in_array($s['r'] ?? '', ['admin', 'haendler'], true)) return null;
    return $s;
}

/** Admin-Konten aus config.php: ['name' => password_hash(...)] */
function admin_konten(): array { return array_change_key_case(ZB_ADMIN_USERS, CASE_LOWER); }

function kurz_hash(string $t): string { return substr(hash('sha256', $t), 0, 32); }

function neue_id(string $praefix = ''): string {
    return $praefix . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
}

function jetzt(): string { return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z'); }
