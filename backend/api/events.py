from fastapi import APIRouter, Depends, Query
from backend.services.event_service import EventService

router = APIRouter(prefix="/api/events", tags=["events"])

def get_event_service():
    from backend.main import app_state
    return EventService(app_state["exp_db"])

@router.get("")
async def list_events(event_type: str = Query(None), market: str = Query(None),
                       start_date: str = Query(None), end_date: str = Query(None),
                       symbol: str = Query(None), limit: int = Query(100),
                       service: EventService = Depends(get_event_service)):
    return service.get_events(event_type=event_type, market=market, start_date=start_date, end_date=end_date, symbol=symbol, limit=limit)

@router.get("/types")
async def get_event_types(service: EventService = Depends(get_event_service)):
    return service.get_event_types()
