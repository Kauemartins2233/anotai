from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from app.api import auth, projects, images, annotations, export, admin
from app.database import engine, Base, async_session
from app.models import *  # noqa: F401, F403 - register all models
from app.models.user import User
from app.services.auth_service import hash_password
from app.config import settings


async def run_migrations():
    """Add new columns to existing tables if they don't exist."""
    async with engine.begin() as conn:
        # Add is_admin column to users table if missing
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE"
        ))
        # Promote existing project owners to admin
        await conn.execute(text(
            "UPDATE users SET is_admin = TRUE WHERE id IN (SELECT DISTINCT owner_id FROM projects)"
        ))


async def seed_admin():
    async with async_session() as db:
        result = await db.execute(select(User).where(User.is_admin == True))  # noqa: E712
        if result.scalar_one_or_none() is None:
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                username="admin",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(admin_user)
            await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await run_migrations()
    await seed_admin()
    yield


app = FastAPI(title="Image Annotation Tool", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(images.router)
app.include_router(annotations.router)
app.include_router(export.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
