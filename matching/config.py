import os
from pathlib import Path

class Config:
    
    BASE_DIR = Path(__file__).parent
    UPLOAD_DIR = BASE_DIR / "uploads"
    CV_DIR = BASE_DIR / "cvs"
    OFFRES_DIR = BASE_DIR / "offres"
    
    
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    
    SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8081")
    
    
    DEFAULT_SCORE_THRESHOLD = 0.1
    MAX_CV_SIZE_MB = 10
    
   
    @classmethod
    def create_directories(cls):
        cls.UPLOAD_DIR.mkdir(exist_ok=True)
        cls.CV_DIR.mkdir(exist_ok=True)
        cls.OFFRES_DIR.mkdir(exist_ok=True)


Config.create_directories()