from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import tasks, plans, config, audit, railradar

app = FastAPI(title="SAMANVAY API", version="1.0.0", description="AI-Powered Block Planning for Indian Railways")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(tasks.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(railradar.router, prefix="/api")

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SAMANVAY"}
