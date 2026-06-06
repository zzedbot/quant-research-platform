"""数据 API 路由"""
from fastapi import APIRouter, Depends

from backend.api.schemas import (
    DataUpdateRequest, DataUpdateResponse,
    DataStatusItem, JobInfo, QualityCheckInfo,
)
from backend.services.data_service import DataService

router = APIRouter(prefix="/api/data", tags=["data"])


def get_data_service() -> DataService:
    from backend.main import app_state
    return app_state.get("service")


@router.get("/status", response_model=list[DataStatusItem])
async def get_data_status(service: DataService = Depends(get_data_service)):
    return service.get_data_status()


@router.post("/update", response_model=DataUpdateResponse)
async def update_data(request: DataUpdateRequest,
                       service: DataService = Depends(get_data_service)):
    result = service.trigger_update(request)
    return DataUpdateResponse(job_id=result["job_id"], status=result["status"])


@router.get("/jobs", response_model=list[JobInfo])
async def get_jobs(limit: int = 50,
                    service: DataService = Depends(get_data_service)):
    return service.get_jobs(limit)


@router.get("/quality", response_model=list[QualityCheckInfo])
async def get_quality_checks(limit: int = 50,
                              service: DataService = Depends(get_data_service)):
    return service.get_quality_checks(limit)
