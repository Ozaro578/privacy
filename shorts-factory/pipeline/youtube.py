"""YouTube-Upload ueber die Data API v3 (OAuth 2.0)."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .config import SECRETS_DIR

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def _files(cfg: dict[str, Any] | None) -> tuple[Path, Path]:
    yt = (cfg or {}).get("youtube", {})
    client = SECRETS_DIR / yt.get("client_secret_file", "client_secret.json")
    token = SECRETS_DIR / yt.get("token_file", "token.json")
    return client, token


def _materialize_from_env(client_secret: Path, token_file: Path) -> None:
    """In CI (GitHub Actions) kommen die Dateien als Secrets in Umgebungsvariablen."""
    for env_key, target in (("YT_CLIENT_SECRET_JSON", client_secret), ("YT_TOKEN_JSON", token_file)):
        val = os.environ.get(env_key)
        if val and not target.exists():
            target.write_text(val, encoding="utf-8")


def get_credentials(interactive: bool = True, cfg: dict[str, Any] | None = None):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    CLIENT_SECRET, TOKEN_FILE = _files(cfg)
    _materialize_from_env(CLIENT_SECRET, TOKEN_FILE)
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        if not interactive:
            raise RuntimeError("Kein gueltiges YouTube-Token. Einmalig lokal `python make_short.py auth` ausfuehren.")
        if not CLIENT_SECRET.exists():
            raise RuntimeError(
                f"{CLIENT_SECRET} fehlt. OAuth-Client (Desktop-App) in der Google Cloud Console anlegen "
                "und die JSON-Datei dort ablegen."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
        creds = flow.run_local_server(port=0, open_browser=True)
    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    return creds


def upload(video: Path, title: str, description: str, tags: list[str], cfg: dict[str, Any]) -> str:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    yt_cfg = cfg["youtube"]
    creds = get_credentials(interactive=not os.environ.get("CI"), cfg=cfg)
    service = build("youtube", "v3", credentials=creds, cache_discovery=False)

    if "#shorts" not in title.lower():
        title = f"{title} #Shorts"[:100]
    status: dict[str, Any] = {
        "privacyStatus": yt_cfg.get("privacy", "public"),
        "selfDeclaredMadeForKids": bool(yt_cfg.get("made_for_kids", False)),
    }
    publish_at = (yt_cfg.get("publish_at") or "").strip()
    if publish_at:
        status["privacyStatus"] = "private"   # Pflicht bei geplanter Veroeffentlichung
        status["publishAt"] = publish_at

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags[:30],
            "categoryId": str(yt_cfg.get("category_id", "22")),
            "defaultLanguage": cfg["channel"].get("language", "de"),
            "defaultAudioLanguage": cfg["channel"].get("language", "de"),
        },
        "status": status,
    }
    media = MediaFileUpload(str(video), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    request = service.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        progress, response = request.next_chunk()
        if progress:
            print(f"[youtube] Upload {int(progress.progress() * 100)} %")
    video_id = response["id"]
    print(f"[youtube] Hochgeladen: https://youtube.com/shorts/{video_id}")
    return video_id
