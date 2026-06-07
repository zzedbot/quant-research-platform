"""FastAPI 应用入口"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from quant_core.data.portal import DataPortal
from quant_core.storage.experiment_db import ExperimentDB
from backend.services.data_service import DataService
from backend.api.data import router as data_router
from backend.api.universes import router as universes_router
from backend.api.features import router as features_router
from backend.api.experiments import router as experiments_router
from backend.api.events import router as events_router
from backend.api.backtests import router as backtests_router

app_state = {}


def create_app(config_path: str = None) -> FastAPI:
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "..", "configs", "data_sources.yaml")
    config_path = os.path.abspath(config_path)

    app = FastAPI(title="量化研究平台", version="0.2.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    portal = DataPortal.from_config(config_path)
    service = DataService(portal)
    exp_db = ExperimentDB(os.path.join(os.path.dirname(__file__), "..", "data", "meta.db"))

    app_state["portal"] = portal
    app_state["service"] = service
    app_state["exp_db"] = exp_db

    app.include_router(data_router)
    app.include_router(universes_router)
    app.include_router(features_router)
    app.include_router(experiments_router)
    app.include_router(events_router)
    app.include_router(backtests_router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "version": "0.2.0"}

    return app


app = create_app()
