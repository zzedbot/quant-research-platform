"""股票池 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from backend.services.universe_service import UniverseService

router = APIRouter(tags=["universes"])


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


@router.get("/api/universes")
async def list_universes(service: UniverseService = Depends(get_universe_service)):
    return service.list_universes()


@router.get("/api/universes/{universe_id}")
async def get_universe(universe_id: str, service: UniverseService = Depends(get_universe_service)):
    result = service.get_universe(universe_id)
    if not result:
        raise HTTPException(status_code=404, detail="Universe not found")
    return result


@router.post("/api/universes")
async def create_universe(data: UniverseCreate, service: UniverseService = Depends(get_universe_service)):
    return service.create_universe(data.name, data.description, data.symbols, data.filters)


@router.put("/api/universes/{universe_id}")
async def update_universe(universe_id: str, data: UniverseUpdate,
                           service: UniverseService = Depends(get_universe_service)):
    result = service.update_universe(universe_id, **data.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Universe not found")
    return result


@router.delete("/api/universes/{universe_id}")
async def delete_universe(universe_id: str, service: UniverseService = Depends(get_universe_service)):
    if not service.delete_universe(universe_id):
        raise HTTPException(status_code=404, detail="Universe not found")
    return {"status": "deleted"}


# Real-time spot data endpoints
@router.get("/api/a-spot")
async def get_a_spot(symbols: str = Query(...)):
    """A股实时行情 (Sina source)"""
    import urllib.request, re
    url = f"https://hq.sinajs.cn/list={symbols}"
    req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn/"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            text = resp.read().decode("gbk", errors="replace")
    except Exception:
        return []
    results = []
    for line in text.strip().split("\n"):
        m = re.search(r'hq_str_(\w+)="(.*)"', line)
        if m:
            code, data = m.group(1), m.group(2)
            fields = data.split(",")
            if len(fields) >= 32:
                price = float(fields[3]) if fields[3] else 0
                yclose = float(fields[2]) if fields[2] else 0
                change_pct = round((price - yclose) / yclose * 100, 2) if yclose else 0
                amount = float(fields[9]) if fields[9] else 0
                results.append({
                    "symbol": code,
                    "name": fields[0],
                    "price": price,
                    "change_pct": change_pct,
                    "amount": amount,
                })
    return results


@router.get("/api/hk-spot")
async def get_hk_spot(codes: str = Query(...)):
    """港股实时行情 (Tencent source)"""
    import urllib.request, re
    url = f"https://qt.gtimg.cn/q={codes}"
    req = urllib.request.Request(url, headers={"Referer": "https://finance.qq.com/"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            text = resp.read().decode("gbk", errors="replace")
    except Exception:
        return []
    results = []
    for line in text.strip().split("\n"):
        m = re.search(r'v_(\w+)="(.*)"', line)
        if m:
            code, data = m.group(1), m.group(2)
            f = data.split("~")
            if len(f) >= 50:
                price = float(f[3]) if f[3] else 0
                yclose = float(f[4]) if f[4] else 0
                change_pct = round((price - yclose) / yclose * 100, 2) if yclose else 0
                amount = float(f[37]) * 10000 if f[37] else 0
                results.append({
                    "symbol": code,
                    "name": f[1],
                    "price": price,
                    "change_pct": change_pct,
                    "amount": amount,
                })
    return results
