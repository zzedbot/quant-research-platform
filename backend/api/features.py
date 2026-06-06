from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.services.feature_service import FeatureService

router = APIRouter(prefix="/api/features", tags=["features"])

def get_feature_service():
    from backend.main import app_state
    return FeatureService(app_state["portal"])

class FactorComputeRequest(BaseModel):
    factor_name: str
    symbols: list[str]
    market: str = "CN"
    start_date: str
    end_date: str = ""

@router.get("/factors")
async def list_factors(service: FeatureService = Depends(get_feature_service)):
    return service.list_factors()

@router.post("/calculate")
async def calculate_factor(req: FactorComputeRequest, service: FeatureService = Depends(get_feature_service)):
    return service.compute_factor(req.factor_name, req.symbols, req.market, req.start_date, req.end_date)
