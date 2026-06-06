import uuid
from quant_core.storage.experiment_db import ExperimentDB

class ExperimentService:
    def __init__(self, db):
        self.db = db

    def list_experiments(self): return self.db.get_experiments()
    def get_experiment(self, id): return self.db.get_experiment(id)

    def create_experiment(self, name, description, universe_id, factors, portfolio, execution, data_version=""):
        id = str(uuid.uuid4())[:8]
        return self.db.create_experiment(id, name, description, universe_id, factors, portfolio, execution, data_version)

    def update_experiment(self, id, **kwargs): return self.db.update_experiment(id, **kwargs)
    def delete_experiment(self, id): return self.db.delete_experiment(id)
    def clone_experiment(self, id): return self.db.clone_experiment(id)
