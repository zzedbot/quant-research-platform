import uuid
from quant_core.storage.experiment_db import ExperimentDB

class EventService:
    def __init__(self, db): self.db = db
    def get_events(self, **filters): return self.db.get_events(**filters)
    def get_event_types(self): return self.db.get_event_types()
    def add_event(self, **kwargs):
        event_id = str(uuid.uuid4())[:8]
        return self.db.add_event(event_id, **kwargs)
