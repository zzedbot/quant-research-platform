"""股票池 API 路由"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.universe_service import UniverseService

router = APIRouter(prefix="/api/universes", tags=["universes"])


def get_universe_service() -> UniverseService:
    from backend.main import app_state
    return UniverseService(app_state["exp_db"])


class UniverseCreate(BaseModel):
    name: str
    description: str = ""
    symbols: list[str]
    filters: list[str] = []


class UniverseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    symbols: Optional[list[str]] = None
    filters: Optional[list[str]] = None


@router.get("")
async def list_universes(service: UniverseService = Depends(get_universe_service)):
    return service.list_universes()


@router.get("/{universe_id}")
async def get_universe(universe_id: str, service: UniverseService = Depends(get_universe_service)):
    result = service.get_universe(universe_id)
    if not result:
        raise HTTPException(status_code=404, detail="Universe not found")
    return result


@router.post("")
async def create_universe(data: UniverseCreate, service: UniverseService = Depends(get_universe_service)):
    return service.create_universe(data.name, data.description, data.symbols, data.filters)


@router.put("/{universe_id}")
async def update_universe(universe_id: str, data: UniverseUpdate,
                           service: UniverseService = Depends(get_universe_service)):
    result = service.update_universe(universe_id, **data.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Universe not found")
    return result


@router.delete("/{universe_id}")
async def delete_universe(universe_id: str, service: UniverseService = Depends(get_universe_service)):
    if not service.delete_universe(universe_id):
        raise HTTPException(status_code=404, detail="Universe not found")
    return {"status": "deleted"}
