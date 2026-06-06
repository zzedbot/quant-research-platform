from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.experiment_service import ExperimentService

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

def get_experiment_service():
    from backend.main import app_state
    return ExperimentService(app_state["exp_db"])

class ExperimentCreate(BaseModel):
    name: str
    description: str = ""
    universe_id: str
    factors: list[dict] = []
    portfolio: dict = {}
    execution: dict = {}
    data_version: str = ""

@router.get("")
async def list_experiments(service: ExperimentService = Depends(get_experiment_service)):
    return service.list_experiments()

@router.get("/{exp_id}")
async def get_experiment(exp_id, service: ExperimentService = Depends(get_experiment_service)):
    result = service.get_experiment(exp_id)
    if not result: raise HTTPException(status_code=404, detail="Experiment not found")
    return result

@router.post("")
async def create_experiment(data: ExperimentCreate, service: ExperimentService = Depends(get_experiment_service)):
    return service.create_experiment(data.name, data.description, data.universe_id, data.factors, data.portfolio, data.execution, data.data_version)

@router.post("/{exp_id}/clone")
async def clone_experiment(exp_id, service: ExperimentService = Depends(get_experiment_service)):
    result = service.clone_experiment(exp_id)
    if not result: raise HTTPException(status_code=404, detail="Experiment not found")
    return result

@router.put("/{exp_id}")
async def update_experiment(exp_id, data: dict, service: ExperimentService = Depends(get_experiment_service)):
    result = service.update_experiment(exp_id, **data)
    if not result: raise HTTPException(status_code=404, detail="Experiment not found")
    return result

@router.delete("/{exp_id}")
async def delete_experiment(exp_id, service: ExperimentService = Depends(get_experiment_service)):
    if not service.delete_experiment(exp_id): raise HTTPException(status_code=404, detail="Experiment not found")
    return {"status": "deleted"}
