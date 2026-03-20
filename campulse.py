import os
import time
import requests
from datetime import datetime

BASE_URL = "https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=rI8z3&client_ip=request_ip&format=json&limit=500"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Faltan variables de entorno: SUPABASE_URL y SUPABASE_KEY son requeridas")

def get_rooms():
    all_rooms = []
    offset = 0
    print(f"[{datetime.now()}] Iniciando scraping con paginación...")
    while True:
        url = f"{BASE_URL}&offset={offset}"
        try:
            r = requests.get(url, timeout=30)
            data = r.json()
        except Exception as e:
            print(f"  Error en offset={offset}: {e}")
            break
        batch = data.get("results", [])
        if not batch:
            break
        all_rooms.extend(batch)
        print(f"  offset={offset} → {len(batch)} salas (acumulado: {len(all_rooms)})")
        if len(batch) < 500:
            break
        offset += 500
        if offset > 5000:
            break
        time.sleep(0.5)
    print(f"[{datetime.now()}] Total salas encontradas: {len(all_rooms)}")
    return all_rooms

def save_snapshot(rooms, platform="chaturbate"):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    records = []
    for r in rooms:
        records.append({
            "username": r.get("username", ""),
            "display_name": r.get("display_name", ""),
            "gender": r.get("gender", ""),
            "country": r.get("country", ""),
            "location": r.get("location", ""),
            "num_users": r.get("num_users", 0),
            "num_followers": r.get("num_followers", 0),
            "age": r.get("age"),
            "is_hd": r.get("is_hd", False),
            "is_new": r.get("is_new", False),
            "current_show": r.get("current_show", ""),
            "room_subject": r.get("room_subject", "")[:500] if r.get("room_subject") else "",
            "spoken_languages": r.get("spoken_languages", ""),
            "chat_room_url": r.get("chat_room_url", ""),
            "tags": r.get("tags", []) if isinstance(r.get("tags"), list) else [],
            "seconds_online": r.get("seconds_online", 0),
            "platform": platform,
        })
    total = 0
    for i in range(0, len(records), 100):
        batch = records[i:i+100]
        resp = requests.post(
            SUPABASE_URL + "/rest/v1/rooms_snapshot",
            headers=headers,
            json=batch,
            timeout=30
        )
        if resp.status_code in [200, 201]:
            total += len(batch)
            print("Lote " + str(i//100 + 1) + " guardado: " + str(len(batch)) + " registros")
        else:
            print("Error lote " + str(i//100 + 1) + ": " + str(resp.status_code) + " - " + resp.text[:300])
    print(f"[{datetime.now()}] Total guardado: {total} registros")

def refresh_best_hours():
    """
    Dispara refresh_best_hours() en Supabase via RPC.
    Fallback si pg_cron no está activo. Si pg_cron sí corre, esta llamada
    es inocua — simplemente recalcula antes de lo programado.
    """
    resp = requests.post(
        SUPABASE_URL + "/rest/v1/rpc/refresh_best_hours",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
        },
        json={},
        timeout=60
    )
    if resp.status_code == 200:
        print(f"[{datetime.now()}] best_hours actualizado correctamente")
    else:
        print(f"[{datetime.now()}] Error al actualizar best_hours: {resp.status_code} — {resp.text[:200]}")

if __name__ == "__main__":
    rooms = get_rooms()
    if rooms:
        save_snapshot(rooms)
        refresh_best_hours()
    print("Listo!")
