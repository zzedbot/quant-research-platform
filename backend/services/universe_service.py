"""股票池服务"""
import uuid
from quant_core.storage.experiment_db import ExperimentDB


class UniverseService:
    def __init__(self, db: ExperimentDB):
        self.db = db

    def list_universes(self) -> list:
        return self.db.get_universes()

    def get_universe(self, id: str):
        return self.db.get_universe(id)

    def create_universe(self, name: str, description: str, symbols: list, filters: list) -> dict:
        id = str(uuid.uuid4())[:8]
        return self.db.create_universe(id, name, description, symbols, filters)

    def update_universe(self, id: str, **kwargs):
        return self.db.update_universe(id, **kwargs)

    def delete_universe(self, id: str) -> bool:
        return self.db.delete_universe(id)
