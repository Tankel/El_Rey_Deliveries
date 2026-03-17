from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


class MongoStateRepository:
    def __init__(
        self,
        uri: str,
        db_name: str = 'el_rey_deliveries',
        collection_name: str = 'app_state',
        state_id: str = 'default',
    ) -> None:
        self._state_id = state_id
        self._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self._collection: Collection = self._client[db_name][collection_name]
        self._ping()

    def _ping(self) -> None:
        try:
            self._client.admin.command('ping')
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo conectar a MongoDB: {exc}') from exc

    def load_state(self) -> Optional[Dict[str, Any]]:
        try:
            doc = self._collection.find_one({'_id': self._state_id})
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo leer estado desde MongoDB: {exc}') from exc

        if not doc:
            return None
        state = doc.get('state')
        return state if isinstance(state, dict) else None

    def save_state(self, state: Dict[str, Any]) -> None:
        payload = {
            '_id': self._state_id,
            'state': state,
            'updatedAt': datetime.now(timezone.utc).isoformat(),
        }
        try:
            self._collection.replace_one({'_id': self._state_id}, payload, upsert=True)
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo guardar estado en MongoDB: {exc}') from exc

