import os
import time
import requests
from datetime import datetime

BASE_URL = "https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=rI8z3&client_ip=request_ip&format=json&limit=500"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
SITE_URL = os.environ.get("SITE_URL", "https://www.campulsehub.com")

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

def get_previous_usernames():
    """Obtiene los usernames de la ejecución anterior (último snapshot distinto)."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
    }
    try:
        # Obtener los dos captured_at más recientes distintos
        resp = requests.get(
            SUPABASE_URL + "/rest/v1/rooms_snapshot"
            "?select=captured_at"
            "&order=captured_at.desc"
            "&limit=1",
            headers=headers,
            timeout=15
        )
        data = resp.json()
        if not data or not isinstance(data, list) or len(data) == 0:
            return set()
        last_ts = data[0].get("captured_at", "")
        if not last_ts:
            return set()
        # Obtener todos los usernames del snapshot anterior a este
        resp2 = requests.get(
            SUPABASE_URL + "/rest/v1/rooms_snapshot"
            f"?select=username"
            f"&captured_at=lt.{last_ts}"
            f"&order=captured_at.desc"
            f"&limit=6000",
            headers=headers,
            timeout=30
        )
        rows = resp2.json()
        if not isinstance(rows, list):
            return set()
        return {r["username"] for r in rows if isinstance(r, dict) and "username" in r}
    except Exception as e:
        print(f"  Error obteniendo usernames anteriores: {e}")
        return set()

def send_notifications(newly_online):
    """Envía notificaciones push para modelos recién conectadas."""
    if not newly_online:
        return
    print(f"[{datetime.now()}] Enviando notificaciones para {len(newly_online)} modelos recién conectadas...")
    sent_total = 0
    for room in newly_online[:20]:  # máximo 20 notificaciones por ejecución
        username = room.get("username", "")
        viewers = room.get("num_users", 0)
        if not username or viewers < 10:
            continue
        try:
            resp = requests.post(
                SITE_URL + "/api/push-send",
                json={
                    "username": username,
                    "viewers": viewers,
                    "title": f"{room.get('display_name', username)} está en vivo",
                    "body": f"{viewers:,} viewers ahora · Entra a verla",
                    "url": f"https://www.campulsehub.com"
                },
                timeout=15
            )
            if resp.status_code == 200:
                data = resp.json()
                sent = data.get("sent", 0)
                if sent > 0:
                    print(f"  ✓ {username}: {sent} notificaciones enviadas")
                    sent_total += sent
        except Exception as e:
            print(f"  Error notificando {username}: {e}")
    print(f"[{datetime.now()}] Total notificaciones enviadas: {sent_total}")

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
    print("[" + str(datetime.now()) + "] Total guardado: " + str(total) + " registros")

if __name__ == "__main__":
    # 1. Obtener usernames de la ejecución anterior ANTES de guardar
    prev_usernames = get_previous_usernames()
    print(f"[{datetime.now()}] Usernames en ejecución anterior: {len(prev_usernames)}")

    # 2. Obtener salas actuales
    rooms = get_rooms()

    if rooms:
        # 3. Detectar modelos recién conectadas
        current_usernames = {r.get("username") for r in rooms}
        if prev_usernames:
            newly_online = [
                r for r in rooms
                if r.get("username") in (current_usernames - prev_usernames)
                and r.get("num_users", 0) > 0
            ]
            print(f"[{datetime.now()}] Modelos recién conectadas: {len(newly_online)}")
        else:
            newly_online = []

        # 4. Guardar snapshot
        save_snapshot(rooms)

        # 5. Enviar notificaciones
        if newly_online:
            send_notifications(newly_online)

    print("Listo!")

