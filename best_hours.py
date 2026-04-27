"""
best_hours.py
Recalcula la tabla best_hours en Supabase a partir de rooms_snapshot.
Se ejecuta después de cada scraping via GitHub Actions.

Lógica:
  - Toma los últimos 30 días de snapshots
  - Agrupa por (username, day_of_week, hour_est)   [hora en EST = UTC-5]
  - Calcula avg_viewers, peak_viewers, sample_count
  - Upserta en la tabla best_hours
"""

import os
import json
import requests
from datetime import datetime, timezone, timedelta
from collections import defaultdict

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Faltan variables de entorno: SUPABASE_URL y SUPABASE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

DAYS_BACK = 30
EST_OFFSET = -5  # EST = UTC-5


def fetch_snapshots():
    """Descarga todos los snapshots de los últimos DAYS_BACK días."""
    since = (datetime.now(timezone.utc) - timedelta(days=DAYS_BACK)).isoformat()
    all_rows = []
    offset = 0
    batch_size = 1000
    print(f"[{datetime.now()}] Descargando snapshots desde {since[:10]}...")

    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/rooms_snapshot"
            f"?captured_at=gte.{since}"
            f"&select=username,num_users,captured_at"
            f"&order=captured_at.asc"
            f"&limit={batch_size}&offset={offset}"
        )
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if not resp.ok:
            print(f"  Error {resp.status_code}: {resp.text[:200]}")
            break
        batch = resp.json()
        if not batch:
            break
        all_rows.extend(batch)
        print(f"  offset={offset} → {len(batch)} filas (total: {len(all_rows)})")
        if len(batch) < batch_size:
            break
        offset += batch_size

    return all_rows


def compute_best_hours(rows):
    """Agrupa por (username, day_of_week, hour_est) y calcula stats."""
    # key: (username, day_of_week 0=lunes, hour_est 0-23)
    buckets = defaultdict(list)

    for row in rows:
        username = row.get("username", "")
        num_users = row.get("num_users", 0) or 0
        captured_at = row.get("captured_at", "")
        if not username or not captured_at:
            continue
        try:
            # Parsear timestamp UTC
            ts = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
            # Convertir a EST
            ts_est = ts + timedelta(hours=EST_OFFSET)
            day_of_week = ts_est.weekday()  # 0=lunes, 6=domingo
            hour_est = ts_est.hour
        except Exception:
            continue
        buckets[(username, day_of_week, hour_est)].append(num_users)

    records = []
    for (username, day_of_week, hour_est), values in buckets.items():
        if not values:
            continue
        records.append({
            "username": username,
            "day_of_week": day_of_week,
            "hour_est": hour_est,
            "avg_viewers": round(sum(values) / len(values), 2),
            "peak_viewers": max(values),
            "sample_count": len(values),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    print(f"[{datetime.now()}] Registros calculados: {len(records)}")
    return records


def upsert_best_hours(records):
    """Upserta en Supabase en lotes de 500."""
    total = 0
    batch_size = 500
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/best_hours",
            headers=HEADERS,
            json=batch,
            timeout=30,
        )
        if resp.status_code in [200, 201]:
            total += len(batch)
            print(f"  Lote {i // batch_size + 1} upsertado: {len(batch)} registros")
        else:
            print(f"  Error lote {i // batch_size + 1}: {resp.status_code} - {resp.text[:300]}")

    print(f"[{datetime.now()}] Total upsertado en best_hours: {total}")


if __name__ == "__main__":
    rows = fetch_snapshots()
    if not rows:
        print("Sin datos — nada que calcular.")
    else:
        records = compute_best_hours(rows)
        upsert_best_hours(records)
    print("Listo!")
