from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


class MongoStateRepository:
    def __init__(
        self,
        uri: str,
        db_name: str = 'el_rey_deliveries',
        collection_prefix: str = '',
        legacy_collection_name: str = 'app_state',
        legacy_state_id: str = 'default',
    ) -> None:
        self._legacy_state_id = legacy_state_id
        self._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self._db = self._client[db_name]

        self._users = self._db[self._collection_name('users', collection_prefix)]
        self._products = self._db[self._collection_name('products', collection_prefix)]
        self._orders = self._db[self._collection_name('orders', collection_prefix)]
        self._profiles = self._db[self._collection_name('profiles', collection_prefix)]
        self._notifications = self._db[self._collection_name('notifications', collection_prefix)]
        self._audit_log = self._db[self._collection_name('auth_audit', collection_prefix)]
        self._metadata = self._db[self._collection_name('state_meta', collection_prefix)]

        self._legacy_collection: Collection = self._db[legacy_collection_name]

        self._ping()
        self._ensure_indexes()

    @staticmethod
    def _collection_name(base_name: str, prefix: str) -> str:
        normalized = prefix.strip()
        return f'{normalized}_{base_name}' if normalized else base_name

    def _ping(self) -> None:
        try:
            self._client.admin.command('ping')
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo conectar a MongoDB: {exc}') from exc

    def _ensure_indexes(self) -> None:
        try:
            self._users.create_index('username', unique=True)
            self._orders.create_index('status')
            self._orders.create_index('clientId')
            self._products.create_index('category')
            self._notifications.create_index('audience')
            self._notifications.create_index('targetUserId')
            self._audit_log.create_index('at')
            self._profiles.create_index('userId', unique=True)
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudieron crear indices en MongoDB: {exc}') from exc

    @staticmethod
    def _strip_internal_fields(doc: Dict[str, Any]) -> Dict[str, Any]:
        clean = dict(doc)
        clean.pop('_id', None)
        clean.pop('_order', None)
        return clean

    @staticmethod
    def _prepare_docs(docs: List[Dict[str, Any]], key_field: str) -> List[Dict[str, Any]]:
        prepared: List[Dict[str, Any]] = []
        for index, item in enumerate(docs):
            doc = dict(item)
            entity_id = str(doc.get(key_field) or f'{key_field}-{index}')
            doc['_id'] = entity_id
            doc['_order'] = index
            prepared.append(doc)
        return prepared

    @staticmethod
    def _safe_list(value: Any) -> List[Dict[str, Any]]:
        if isinstance(value, list):
            return [dict(item) for item in value if isinstance(item, dict)]
        return []

    def _replace_collection(self, collection: Collection, docs: List[Dict[str, Any]]) -> None:
        collection.delete_many({})
        if docs:
            collection.insert_many(docs, ordered=True)

    def _load_collection(self, collection: Collection) -> List[Dict[str, Any]]:
        return [
            self._strip_internal_fields(item)
            for item in collection.find({}, sort=[('_order', 1)])
        ]

    def _load_from_entity_collections(self) -> Optional[Dict[str, Any]]:
        users = self._load_collection(self._users)
        products = self._load_collection(self._products)
        orders = self._load_collection(self._orders)
        notifications = self._load_collection(self._notifications)
        audit_log = self._load_collection(self._audit_log)
        profiles_list = self._load_collection(self._profiles)

        has_any_data = any([
            users,
            products,
            orders,
            notifications,
            audit_log,
            profiles_list,
        ])
        if not has_any_data:
            return None

        profiles = {
            item['userId']: item
            for item in profiles_list
            if isinstance(item, dict) and item.get('userId')
        }

        return {
            'users': users,
            'products': products,
            'orders': orders,
            'notifications': notifications,
            'audit_log': audit_log,
            'profiles': profiles,
        }

    def _load_legacy_snapshot(self) -> Optional[Dict[str, Any]]:
        doc = self._legacy_collection.find_one({'_id': self._legacy_state_id})
        if not doc:
            return None
        state = doc.get('state')
        return state if isinstance(state, dict) else None

    def load_state(self) -> Optional[Dict[str, Any]]:
        try:
            current_state = self._load_from_entity_collections()
            if current_state:
                return current_state

            legacy_state = self._load_legacy_snapshot()
            if not legacy_state:
                return None

            self.save_state(legacy_state)
            return legacy_state
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo leer estado desde MongoDB: {exc}') from exc

    def save_state(self, state: Dict[str, Any]) -> None:
        try:
            users = self._safe_list(state.get('users'))
            products = self._safe_list(state.get('products'))
            orders = self._safe_list(state.get('orders'))
            notifications = self._safe_list(state.get('notifications'))
            audit_log = self._safe_list(state.get('audit_log'))

            raw_profiles = state.get('profiles', {})
            profiles = []
            if isinstance(raw_profiles, dict):
                profiles = [dict(value) for value in raw_profiles.values() if isinstance(value, dict)]
            elif isinstance(raw_profiles, list):
                profiles = [dict(item) for item in raw_profiles if isinstance(item, dict)]

            self._replace_collection(self._users, self._prepare_docs(users, key_field='id'))
            self._replace_collection(self._products, self._prepare_docs(products, key_field='id'))
            self._replace_collection(self._orders, self._prepare_docs(orders, key_field='id'))
            self._replace_collection(self._notifications, self._prepare_docs(notifications, key_field='id'))
            self._replace_collection(self._audit_log, self._prepare_docs(audit_log, key_field='id'))
            self._replace_collection(self._profiles, self._prepare_docs(profiles, key_field='userId'))

            self._metadata.replace_one(
                {'_id': 'state'},
                {
                    '_id': 'state',
                    'updatedAt': datetime.now(timezone.utc).isoformat(),
                    'counts': {
                        'users': len(users),
                        'products': len(products),
                        'orders': len(orders),
                        'profiles': len(profiles),
                        'notifications': len(notifications),
                        'audit_log': len(audit_log),
                    },
                },
                upsert=True,
            )
        except PyMongoError as exc:
            raise RuntimeError(f'No se pudo guardar estado en MongoDB: {exc}') from exc
