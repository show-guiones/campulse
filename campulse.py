import requests
from datetime import datetime

CHATURBATE_URL = "https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=rI8z3&client_ip=request_ip&format=json&limit=500"
SUPABASE_URL = "https://upwjwuikaxuelczlrewk.supabase.co"
SUPABASE_KEY = "sb_secret_UE20hu_rXvq0vPLNfeAM-A_799VJ2tJ"

def get_rooms():
    print("[" + str(datetime.now()) + "] Llamando a Chaturbate API...")
    r = requests.get(CHATURBATE_URL, timeout=30)
    data = r.json()
    rooms = data.get("results", [])
    print("[" + str(datetime.now()) + "] " + str(len(rooms)) + " salas encontradas")
    return rooms

def save_snapshot(rooms):
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
            "num_users": r.get("num_users", 0),
            "num_followers": r.get("num_followers", 0),
            "age": r.get("age"),
            "is_hd": r.get("is_hd", False),
            "is_new": r.get("is_new", False),
            "current_show": r.get("current_show", ""),
            "tags": r.get("tags", []) if isinstance(r.get("tags"), list) else [],
            "seconds_online": r.get("seconds_online", 0)
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
    rooms = get_rooms()
    if rooms:
        save_snapshot(rooms)
    print("Listo!")
