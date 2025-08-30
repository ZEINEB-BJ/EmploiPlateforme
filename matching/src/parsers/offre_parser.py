import json
import os

def extract_text_from_offer(offer_path: str) -> str:
    
    if not os.path.exists(offer_path):
        print(f"[ERREUR] Fichier introuvable : {offer_path}")
        return ""

    try:
        if offer_path.endswith(".json"):
            with open(offer_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            text = data.get("title", "") + " " + data.get("description", "")
        else:  
            with open(offer_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        print(f"[ERREUR] Impossible de lire l'offre {offer_path} : {e}")
        return ""

    return text.replace("\n", " ").strip()
