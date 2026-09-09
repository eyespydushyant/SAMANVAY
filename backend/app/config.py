from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./samanvay.db"
    CRITICALITY_WEIGHT: float = 0.40
    URGENCY_WEIGHT: float = 0.35
    ASSET_RISK_WEIGHT: float = 0.25
    OPTIMIZER_TIME_LIMIT_SECONDS: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
