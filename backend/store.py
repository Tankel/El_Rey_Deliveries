from __future__ import annotations

import os
from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Dict, List, Optional
from uuid import uuid4

import bcrypt

from repository import MongoStateRepository
from schemas import (
    AccountProfile,
    AccountProfileUpdate,
    AdminUserInput,
    AdminUserUpdate,
    AuthAuditEvent,
    CreateOrderPayload,
    DriverProfile,
    ForceOrderStatusPayload,
    Order,
    OrderNotification,
    OrderStatusHistoryEntry,
    Product,
    ProductInput,
    ProductUpdate,
    SavedAddress,
    SavedAddressCreate,
    UpdateOrderStatusPayload,
)

ORDER_ALLOWED_TRANSITIONS = {
    'PENDIENTE': ['CONFIRMADO', 'CANCELADO'],
    'CONFIRMADO': ['EN_PREPARACION', 'CANCELADO'],
    'EN_PREPARACION': ['ASIGNADO', 'CANCELADO'],
    'ASIGNADO': ['ACEPTADO_REPARTIDOR', 'CANCELADO'],
    'ACEPTADO_REPARTIDOR': ['EN_CAMINO', 'CANCELADO'],
    'EN_CAMINO': ['ENTREGADO', 'CANCELADO'],
    'ENTREGADO': [],
    'CANCELADO': [],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_bcrypt_hash(value: str) -> bool:
    return isinstance(value, str) and value.startswith(('$2a$', '$2b$', '$2y$'))


def hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.strip().encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(raw_password: str, password_hash: str) -> bool:
    if not isinstance(raw_password, str) or not isinstance(password_hash, str):
        return False

    normalized_hash = password_hash.strip()
    if not normalized_hash:
        return False

    if not is_bcrypt_hash(normalized_hash):
        return raw_password == normalized_hash

    try:
        return bcrypt.checkpw(raw_password.encode('utf-8'), normalized_hash.encode('utf-8'))
    except ValueError:
        return False


def build_default_profile(user: dict) -> AccountProfile:
    normalized = ''.join(ch for ch in user['id'].upper() if ch.isalnum())[:10]
    return AccountProfile(
        userId=user['id'],
        role=user['role'],
        fullName=user['fullName'],
        accountNumber=f'ERD-{normalized}',
        email=user['email'],
        phone=user['phone'],
        businessName='Negocio Demo',
        taxId='XAXX010101000',
        billingAddress='Direccion fiscal pendiente',
        savedAddresses=[],
    )


def compute_discount(price: float, original_price: float) -> int:
    if original_price <= 0 or original_price <= price:
        return 0
    return int(round(((original_price - price) / original_price) * 100))


class AppStore:
    def __init__(self, repository: Optional[MongoStateRepository] = None) -> None:
        self._lock = RLock()
        self._repository = repository
        self.users: List[dict] = []
        self.products: List[Product] = []
        self.orders: List[Order] = []
        self.notifications: List[OrderNotification] = []
        self.audit_log: List[AuthAuditEvent] = []
        self.profiles: Dict[str, AccountProfile] = {}
        self._initialize_data()

    def _initialize_data(self) -> None:
        if not self._repository:
            self.reset_demo_data(persist=False)
            return

        snapshot = self._repository.load_state()
        if snapshot:
            self._restore_state(snapshot)
            return

        self.reset_demo_data()

    def _snapshot_state(self) -> Dict[str, Any]:
        return {
            'users': deepcopy(self.users),
            'products': [item.model_dump() for item in self.products],
            'orders': [item.model_dump() for item in self.orders],
            'notifications': [item.model_dump() for item in self.notifications],
            'audit_log': [item.model_dump() for item in self.audit_log],
            'profiles': {user_id: profile.model_dump() for user_id, profile in self.profiles.items()},
        }

    def _restore_state(self, snapshot: Dict[str, Any]) -> None:
        self.users = deepcopy(snapshot.get('users', []))
        self.products = [Product.model_validate(item) for item in snapshot.get('products', [])]
        self.orders = [Order.model_validate(item) for item in snapshot.get('orders', [])]
        self.notifications = [OrderNotification.model_validate(item) for item in snapshot.get('notifications', [])]
        self.audit_log = [AuthAuditEvent.model_validate(item) for item in snapshot.get('audit_log', [])]

        raw_profiles = snapshot.get('profiles', {})
        if isinstance(raw_profiles, dict):
            self.profiles = {user_id: AccountProfile.model_validate(profile) for user_id, profile in raw_profiles.items()}
        else:
            self.profiles = {}

    def _persist_state(self) -> None:
        if not self._repository:
            return
        self._repository.save_state(self._snapshot_state())

    def _user_public(self, user: dict) -> dict:
        return {
            'id': user['id'],
            'username': user['username'],
            'fullName': user['fullName'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'isActive': user['isActive'],
            'createdAt': user['createdAt'],
        }

    def _make_user(self, payload: dict) -> dict:
        return {
            'id': payload.get('id', f"user-{uuid4().hex[:10]}"),
            'username': payload['username'].strip().lower(),
            'passwordHash': payload['passwordHash'],
            'fullName': payload['fullName'].strip(),
            'email': payload['email'].strip().lower(),
            'phone': payload['phone'].strip(),
            'role': payload['role'],
            'isActive': bool(payload.get('isActive', True)),
            'createdAt': payload.get('createdAt', now_iso()),
        }

    def _seed_users(self) -> List[dict]:
        users = [
            {
                'id': 'admin-demo',
                'username': 'admin-demo',
                'passwordHash': hash_password('admin123'),
                'fullName': 'Administrador Demo',
                'email': 'admin@elrey.local',
                'phone': '+52 555 000 0001',
                'role': 'ADMIN',
                'isActive': True,
                'createdAt': now_iso(),
            },
            {
                'id': 'cliente-demo',
                'username': 'cliente-demo',
                'passwordHash': hash_password('cliente123'),
                'fullName': 'Cliente Demo',
                'email': 'cliente@elrey.local',
                'phone': '+52 555 000 0002',
                'role': 'CLIENT',
                'isActive': True,
                'createdAt': now_iso(),
            },
            {
                'id': 'driver-juan',
                'username': 'driver-juan',
                'passwordHash': hash_password('driver123'),
                'fullName': 'Juan Perez',
                'email': 'driver-juan@elrey.local',
                'phone': '+52 555 000 0003',
                'role': 'DRIVER',
                'isActive': True,
                'createdAt': now_iso(),
            },
            {
                'id': 'driver-marta',
                'username': 'driver-marta',
                'passwordHash': hash_password('driver123'),
                'fullName': 'Marta Diaz',
                'email': 'driver-marta@elrey.local',
                'phone': '+52 555 000 0004',
                'role': 'DRIVER',
                'isActive': True,
                'createdAt': now_iso(),
            },
        ]
        return users

    def _seed_products(self) -> List[Product]:
        base = [
            Product(id='prod-coca-24-355', name='Refresco Cola', brand='Coca Cola', image='https://images.pexels.com/photos/15205136/pexels-photo-15205136.jpeg?auto=compress&cs=tinysrgb&w=1200', price=189, originalPrice=219, discountPercent=0, unit='ml', sizeValue=355, quantityPerPack=24, containerType='Lata', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Paquete de refresco en lata ideal para tienda de barrio o evento.', category='Bebidas', stock=34),
            Product(id='prod-agua-12-1l', name='Agua Natural', brand='Pureza', image='https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=800&q=80', price=129, originalPrice=145, discountPercent=0, unit='l', sizeValue=1, quantityPerPack=12, containerType='Botella PET', packaging='Paquete termoencogido', seller='El Rey Distribuidora', description='Agua natural en presentacion de 1 litro por botella.', category='Bebidas', stock=50),
            Product(id='prod-papas-18-45', name='Papas Clasicas', brand='Crunch', image='https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80', price=165, originalPrice=199, discountPercent=0, unit='g', sizeValue=45, quantityPerPack=18, containerType='Bolsa', packaging='Caja corrugada', seller='El Rey Distribuidora', description='Botana de papa sabor clasico para impulso en mostrador.', category='Snacks', stock=28),
            Product(id='prod-galleta-12-120', name='Galleta Chocolate', brand='Dulce Dia', image='https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80', price=98, originalPrice=115, discountPercent=0, unit='g', sizeValue=120, quantityPerPack=12, containerType='Bolsa', packaging='Caja exhibidora', seller='El Rey Distribuidora', description='Galleta rellena para venta por unidad.', category='Snacks', stock=42),
            Product(id='prod-arroz-10-900', name='Arroz Premium', brand='Casa Blanca', image='https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80', price=210, originalPrice=245, discountPercent=0, unit='g', sizeValue=900, quantityPerPack=10, containerType='Bolsa', packaging='Fardo', seller='El Rey Distribuidora', description='Arroz de grano largo para abarrotes.', category='Abarrotes', stock=22),
            Product(id='prod-cerveza-lager-24-355', name='Cerveza Lager', brand='Corona', image='https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80', price=428, originalPrice=472, discountPercent=0, unit='ml', sizeValue=355, quantityPerPack=24, containerType='Lata', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja mayoreo con 24 latas de cerveza lager.', category='Bebidas', stock=36),
            Product(id='prod-cerveza-light-24-355', name='Cerveza Light', brand='Michelob', image='https://images.unsplash.com/photo-1575367439058-6096bb9cf5a2?auto=format&fit=crop&w=800&q=80', price=418, originalPrice=461, discountPercent=0, unit='ml', sizeValue=355, quantityPerPack=24, containerType='Lata', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Presentacion mayoreo para puntos de venta y eventos.', category='Bebidas', stock=29),
            Product(id='prod-cerveza-oscura-12-355', name='Cerveza Oscura', brand='Bohemia', image='https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80', price=246, originalPrice=279, discountPercent=0, unit='ml', sizeValue=355, quantityPerPack=12, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja con 12 botellas de cerveza oscura premium.', category='Bebidas', stock=24),
            Product(id='prod-cerveza-artesanal-12-473', name='Cerveza Artesanal IPA', brand='Sierra Madre', image='https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=800&q=80', price=334, originalPrice=378, discountPercent=0, unit='ml', sizeValue=473, quantityPerPack=12, containerType='Lata', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja de 12 latas IPA de alta rotacion en bares.', category='Bebidas', stock=18),
            Product(id='prod-tequila-reposado-6-750', name='Tequila Reposado', brand='Don Julio', image='https://images.unsplash.com/photo-1595977437232-9f0d8d835b17?auto=format&fit=crop&w=800&q=80', price=2290, originalPrice=2490, discountPercent=0, unit='ml', sizeValue=750, quantityPerPack=6, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja con 6 botellas para mayoreo en licoreria.', category='Bebidas', stock=14),
            Product(id='prod-ron-anejo-6-750', name='Ron Anejo', brand='Bacardi', image='https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=800&q=80', price=1620, originalPrice=1780, discountPercent=0, unit='ml', sizeValue=750, quantityPerPack=6, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Paquete de 6 botellas ideal para bares y restaurantes.', category='Bebidas', stock=17),
            Product(id='prod-vodka-trigo-6-750', name='Vodka Trigo', brand='Absolut', image='https://images.unsplash.com/photo-1614315517650-3771cf72d18a?auto=format&fit=crop&w=800&q=80', price=1790, originalPrice=1930, discountPercent=0, unit='ml', sizeValue=750, quantityPerPack=6, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja con 6 botellas para venta al mayoreo.', category='Bebidas', stock=11),
            Product(id='prod-whisky-blend-6-700', name='Whisky Blended', brand='Johnnie Walker', image='https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80', price=2590, originalPrice=2810, discountPercent=0, unit='ml', sizeValue=700, quantityPerPack=6, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Formato mayoreo para cuentas premium.', category='Bebidas', stock=9),
            Product(id='prod-energetica-24-473', name='Bebida Energetica', brand='Volt', image='https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', price=398, originalPrice=432, discountPercent=0, unit='ml', sizeValue=473, quantityPerPack=24, containerType='Lata', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja de 24 latas energeticas para tiendas de conveniencia.', category='Bebidas', stock=31),
            Product(id='prod-jugo-mango-12-1l', name='Jugo de Mango', brand='Del Valle', image='https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80', price=238, originalPrice=269, discountPercent=0, unit='l', sizeValue=1, quantityPerPack=12, containerType='Tetra Pak', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja mayoreo con 12 piezas de 1 litro.', category='Bebidas', stock=20),
            Product(id='prod-agua-mineral-24-600', name='Agua Mineral', brand='Topo Chico', image='https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80', price=312, originalPrice=349, discountPercent=0, unit='ml', sizeValue=600, quantityPerPack=24, containerType='Botella vidrio', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja de 24 botellas de agua mineral para restaurantes.', category='Bebidas', stock=23),
            Product(id='prod-harina-10-1kg', name='Harina de Trigo', brand='Selecta', image='https://images.unsplash.com/photo-1627483262457-0f6f2f9b1f6a?auto=format&fit=crop&w=800&q=80', price=298, originalPrice=332, discountPercent=0, unit='kg', sizeValue=1, quantityPerPack=10, containerType='Bolsa', packaging='Fardo', seller='El Rey Distribuidora', description='Fardo de 10 bolsas para panaderia y abarrotes.', category='Abarrotes', stock=26),
            Product(id='prod-azucar-10-1kg', name='Azucar Estandar', brand='Zulka', image='https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80', price=324, originalPrice=359, discountPercent=0, unit='kg', sizeValue=1, quantityPerPack=10, containerType='Bolsa', packaging='Fardo', seller='El Rey Distribuidora', description='Paquete mayoreo de azucar para autoservicios.', category='Abarrotes', stock=27),
            Product(id='prod-frijol-negro-10-900', name='Frijol Negro', brand='La Sierra', image='https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80', price=389, originalPrice=425, discountPercent=0, unit='g', sizeValue=900, quantityPerPack=10, containerType='Bolsa', packaging='Fardo', seller='El Rey Distribuidora', description='Fardo de 10 piezas para venta de mayoreo.', category='Abarrotes', stock=19),
            Product(id='prod-aceite-12-1l', name='Aceite Vegetal', brand='Capullo', image='https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', price=468, originalPrice=512, discountPercent=0, unit='l', sizeValue=1, quantityPerPack=12, containerType='Botella PET', packaging='Caja corrugada', seller='El Rey Distribuidora', description='Caja de 12 litros ideal para cocina economica y fondas.', category='Abarrotes', stock=21),
            Product(id='prod-papel-higienico-24-4pz', name='Papel Higienico 4x24', brand='Suavel', image='https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80', price=598, originalPrice=650, discountPercent=0, unit='pz', sizeValue=4, quantityPerPack=24, containerType='Paquete', packaging='Bulto', seller='El Rey Distribuidora', description='Bulto de 24 paquetes de 4 rollos para mayoreo.', category='Abarrotes', stock=16),
            Product(id='prod-detergente-6-5l', name='Detergente Liquido', brand='Ariel', image='https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80', price=840, originalPrice=910, discountPercent=0, unit='l', sizeValue=5, quantityPerPack=6, containerType='Garrafa', packaging='Caja corrugada', seller='El Rey Distribuidora', description='Caja con 6 garrafas para lavanderias y hoteles.', category='Abarrotes', stock=12),
            Product(id='prod-cloro-12-1l', name='Cloro Hogar', brand='Cloralex', image='https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=800&q=80', price=214, originalPrice=245, discountPercent=0, unit='l', sizeValue=1, quantityPerPack=12, containerType='Botella PET', packaging='Caja corrugada', seller='El Rey Distribuidora', description='Caja mayoreo para limpieza de negocio y hogar.', category='Abarrotes', stock=25),
            Product(id='prod-cafe-soluble-12-200', name='Cafe Soluble', brand='Nescafe', image='https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=800&q=80', price=1198, originalPrice=1280, discountPercent=0, unit='g', sizeValue=200, quantityPerPack=12, containerType='Frasco', packaging='Caja cerrada', seller='El Rey Distribuidora', description='Caja de 12 frascos para abarrotes de alto movimiento.', category='Abarrotes', stock=13),
            Product(id='prod-galleta-salada-18-150', name='Galleta Salada', brand='Ritz', image='https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80', price=276, originalPrice=312, discountPercent=0, unit='g', sizeValue=150, quantityPerPack=18, containerType='Caja', packaging='Caja exhibidora', seller='El Rey Distribuidora', description='Caja exhibidora para impulso en punto de venta.', category='Snacks', stock=33),
        ]
        for item in base:
            item.discountPercent = compute_discount(item.price, item.originalPrice)
        return base

    def _seed_orders(self) -> List[Order]:
        timestamp = now_iso()
        return [
            Order(
                id='order-1001',
                clientId='cliente-demo',
                clientName='Cliente Demo',
                clientPhone='+52 555 000 0002',
                address='Av. Central 123',
                status='PENDIENTE',
                total=320,
                createdAt=timestamp,
                updatedAt=timestamp,
                statusHistory=[OrderStatusHistoryEntry(status='PENDIENTE', at=timestamp)],
                paymentMethod='EFECTIVO',
                paymentStatus='PENDIENTE_PAGO',
                items=[],
            )
        ]

    def reset_demo_data(self, persist: bool = True) -> None:
        with self._lock:
            self.users = self._seed_users()
            self.products = self._seed_products()
            self.orders = self._seed_orders()
            self.notifications = []
            self.audit_log = []
            self.profiles = {}
            for user in self.users:
                self.profiles[user['id']] = build_default_profile(user)
            if persist:
                self._persist_state()

    # auth
    def append_audit(self, action: str, username: str, message: str, role: Optional[str] = None) -> AuthAuditEvent:
        event = AuthAuditEvent(
            id=f"audit-{uuid4().hex[:8]}",
            action=action,
            username=username,
            role=role,
            message=message,
            at=now_iso(),
        )
        with self._lock:
            self.audit_log.insert(0, event)
            self._persist_state()
        return event

    def get_user_by_username(self, username: str) -> Optional[dict]:
        normalized = username.strip().lower()
        return next((item for item in self.users if item['username'] == normalized), None)

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return next((item for item in self.users if item['id'] == user_id), None)

    def verify_user_password(self, raw_password: str, password_hash: str) -> bool:
        return verify_password(raw_password, password_hash)

    def user_password_needs_migration(self, password_hash: str) -> bool:
        return not is_bcrypt_hash(password_hash)

    def migrate_user_password(self, user_id: str, raw_password: str) -> None:
        with self._lock:
            target = self.get_user_by_id(user_id)
            if not target:
                return

            target['passwordHash'] = hash_password(raw_password)
            self._persist_state()

    def list_public_users(self) -> List[dict]:
        return [self._user_public(item) for item in self.users]

    def create_user(self, payload: AdminUserInput) -> dict:
        with self._lock:
            username = payload.username.strip().lower()
            if any(item['username'] == username for item in self.users):
                raise ValueError('Ese username ya existe.')
            password_hash = hash_password(payload.password)
            user = self._make_user({
                'username': username,
                'passwordHash': password_hash,
                'fullName': payload.fullName,
                'email': str(payload.email),
                'phone': payload.phone,
                'role': payload.role,
                'isActive': payload.isActive,
            })
            self.users.insert(0, user)
            self.profiles[user['id']] = build_default_profile(user)
            self._persist_state()
            return self._user_public(user)

    def update_user(self, user_id: str, payload: AdminUserUpdate) -> dict:
        with self._lock:
            target = self.get_user_by_id(user_id)
            if not target:
                raise ValueError('Usuario no encontrado.')

            if payload.username:
                next_username = payload.username.strip().lower()
                duplicate = next((item for item in self.users if item['id'] != user_id and item['username'] == next_username), None)
                if duplicate:
                    raise ValueError('Ese username ya existe.')
                target['username'] = next_username

            if payload.password and payload.password.strip():
                if len(payload.password.strip()) < 6:
                    raise ValueError('La contraseña debe tener al menos 6 caracteres.')
                target['passwordHash'] = hash_password(payload.password)

            if payload.fullName is not None:
                target['fullName'] = payload.fullName.strip()
            if payload.email is not None:
                target['email'] = str(payload.email).strip().lower()
            if payload.phone is not None:
                target['phone'] = payload.phone.strip()
            if payload.role is not None:
                target['role'] = payload.role
            if payload.isActive is not None:
                target['isActive'] = bool(payload.isActive)

            profile = self.profiles.get(user_id)
            if profile:
                profile.fullName = target['fullName']
                profile.email = target['email']
                profile.phone = target['phone']
                profile.role = target['role']

            self._persist_state()
            return self._user_public(target)

    def delete_user(self, user_id: str) -> None:
        with self._lock:
            target = self.get_user_by_id(user_id)
            if not target:
                raise ValueError('Usuario no encontrado.')

            if target['role'] == 'ADMIN':
                active_admins = [item for item in self.users if item['id'] != user_id and item['role'] == 'ADMIN' and item['isActive']]
                if not active_admins:
                    raise ValueError('No puedes eliminar al ultimo admin activo.')

            self.users = [item for item in self.users if item['id'] != user_id]
            self.profiles.pop(user_id, None)
            self._persist_state()

    # products
    def list_products(self) -> List[Product]:
        return deepcopy(self.products)

    def create_product(self, payload: ProductInput) -> Product:
        with self._lock:
            new_id = f"prod-{uuid4().hex[:10]}"
            product = Product(id=new_id, **payload.model_dump())
            product.discountPercent = compute_discount(product.price, product.originalPrice)
            self.products.insert(0, product)
            self._persist_state()
            return deepcopy(product)

    def update_product(self, product_id: str, payload: ProductUpdate) -> Product:
        with self._lock:
            target = next((item for item in self.products if item.id == product_id), None)
            if not target:
                raise ValueError('Producto no encontrado.')
            data = payload.model_dump(exclude_unset=True)
            for key, value in data.items():
                setattr(target, key, value)
            target.discountPercent = compute_discount(target.price, target.originalPrice)
            self._persist_state()
            return deepcopy(target)

    def delete_product(self, product_id: str) -> None:
        with self._lock:
            exists = any(item.id == product_id for item in self.products)
            if not exists:
                raise ValueError('Producto no encontrado.')
            self.products = [item for item in self.products if item.id != product_id]
            self._persist_state()

    def get_product_options(self) -> dict:
        container_types = sorted({item.containerType.strip() for item in self.products if item.containerType.strip()})
        packaging = sorted({item.packaging.strip() for item in self.products if item.packaging.strip()})
        return {'containerTypeOptions': container_types, 'packagingOptions': packaging}

    # profiles
    def get_profile(self, user_id: str) -> AccountProfile:
        with self._lock:
            profile = self.profiles.get(user_id)
            if profile:
                return deepcopy(profile)
            user = self.get_user_by_id(user_id)
            if not user:
                raise ValueError('Usuario no encontrado.')
            generated = build_default_profile(user)
            self.profiles[user_id] = generated
            return deepcopy(generated)

    def update_profile(self, user_id: str, payload: AccountProfileUpdate) -> AccountProfile:
        with self._lock:
            profile = self.profiles.get(user_id)
            if not profile:
                profile = self.get_profile(user_id)
                self.profiles[user_id] = profile
            data = payload.model_dump(exclude_unset=True)
            for key, value in data.items():
                if isinstance(value, str):
                    value = value.strip()
                setattr(profile, key, value)
            self._persist_state()
            return deepcopy(profile)

    def add_saved_address(self, user_id: str, payload: SavedAddressCreate) -> AccountProfile:
        with self._lock:
            profile = self.profiles.get(user_id)
            if not profile:
                profile = self.get_profile(user_id)
                self.profiles[user_id] = profile

            normalized_formatted = payload.formattedAddress.strip().lower()
            normalized_street = payload.street.strip().lower()
            normalized_exterior = payload.exteriorNumber.strip().lower()
            normalized_postal = payload.postalCode.strip()
            duplicate = next(
                (
                    item
                    for item in profile.savedAddresses
                    if (
                        payload.placeId
                        and item.placeId
                        and item.placeId == payload.placeId
                    )
                    or (
                        item.formattedAddress.strip().lower() == normalized_formatted
                        and item.street.strip().lower() == normalized_street
                        and item.exteriorNumber.strip().lower() == normalized_exterior
                        and item.postalCode.strip() == normalized_postal
                    )
                ),
                None,
            )
            if duplicate:
                raise ValueError('Esta direccion ya esta guardada.')

            now = now_iso()
            address = SavedAddress(
                id=f"addr-{uuid4().hex[:8]}",
                createdAt=now,
                updatedAt=now,
                **payload.model_dump(),
            )

            if not profile.savedAddresses:
                address.isDefault = True

            if address.isDefault:
                for item in profile.savedAddresses:
                    item.isDefault = False
                    item.updatedAt = now

            profile.savedAddresses.append(address)
            self._persist_state()
            return deepcopy(profile)

    def remove_saved_address(self, user_id: str, address_id: str) -> AccountProfile:
        with self._lock:
            profile = self.profiles.get(user_id)
            if not profile:
                raise ValueError('Perfil no encontrado.')

            before = len(profile.savedAddresses)
            profile.savedAddresses = [item for item in profile.savedAddresses if item.id != address_id]
            if len(profile.savedAddresses) == before:
                raise ValueError('Direccion no encontrada.')

            if profile.savedAddresses and not any(item.isDefault for item in profile.savedAddresses):
                profile.savedAddresses[0].isDefault = True
                profile.savedAddresses[0].updatedAt = now_iso()

            self._persist_state()
            return deepcopy(profile)

    def set_default_address(self, user_id: str, address_id: str) -> AccountProfile:
        with self._lock:
            profile = self.profiles.get(user_id)
            if not profile:
                raise ValueError('Perfil no encontrado.')

            found = False
            now = now_iso()
            for item in profile.savedAddresses:
                if item.id == address_id:
                    item.isDefault = True
                    item.updatedAt = now
                    found = True
                else:
                    item.isDefault = False
            if not found:
                raise ValueError('Direccion no encontrada.')
            self._persist_state()
            return deepcopy(profile)

    # orders
    def _build_reserve_plan(self, items: list) -> List[dict]:
        quantity_map: Dict[str, int] = {}
        for item in items:
            if item.quantity <= 0:
                raise ValueError(f'Cantidad invalida para {item.productName}.')
            quantity_map[item.productId] = quantity_map.get(item.productId, 0) + item.quantity

        entries = []
        for product_id, quantity in quantity_map.items():
            product = next((item for item in self.products if item.id == product_id), None)
            if not product:
                raise ValueError(f'Producto no encontrado: {product_id}.')
            if product.stock < quantity:
                raise ValueError(f'Stock insuficiente para {product.name}. Disponible: {product.stock}.')
            entries.append({'product': product, 'nextStock': product.stock - quantity})
        return entries

    def _release_stock(self, items: list) -> None:
        quantity_map: Dict[str, int] = {}
        for item in items:
            if item.quantity > 0:
                quantity_map[item.productId] = quantity_map.get(item.productId, 0) + item.quantity
        for product_id, quantity in quantity_map.items():
            product = next((item for item in self.products if item.id == product_id), None)
            if product:
                product.stock += quantity

    def _resolve_client_phone(self, client_id: str) -> Optional[str]:
        user = self.get_user_by_id(client_id)
        if user and user.get('phone'):
            return str(user['phone']).strip()
        profile = self.profiles.get(client_id)
        if profile and profile.phone:
            return profile.phone.strip()
        return None

    def list_orders(self) -> List[Order]:
        orders = deepcopy(self.orders)
        for order in orders:
            if not order.clientPhone:
                order.clientPhone = self._resolve_client_phone(order.clientId)
        return orders

    def list_driver_profiles(self) -> List[DriverProfile]:
        drivers = [item for item in self.users if item['role'] == 'DRIVER' and item['isActive']]
        return [DriverProfile(id=item['id'], name=item['fullName']) for item in drivers]

    def create_order(self, payload: CreateOrderPayload) -> Order:
        with self._lock:
            if not payload.items:
                raise ValueError('El pedido debe contener al menos un producto.')

            expected_total = sum(item.unitPrice * item.quantity for item in payload.items)
            if abs(expected_total - payload.total) > 0.01:
                raise ValueError('El total del pedido no coincide con el detalle de productos.')

            reserve_plan = self._build_reserve_plan(payload.items)
            for entry in reserve_plan:
                entry['product'].stock = entry['nextStock']

            timestamp = now_iso()
            payment_method = payload.paymentMethod or 'EFECTIVO'
            payment_status = 'PENDIENTE_PAGO'
            client_user = self.get_user_by_id(payload.clientId)
            client_phone = None
            if client_user:
                client_phone = client_user.get('phone')
            if not client_phone:
                profile = self.profiles.get(payload.clientId)
                client_phone = profile.phone if profile else None

            order = Order(
                id=f"order-{uuid4().hex[:10]}",
                clientId=payload.clientId,
                clientName=payload.clientName,
                clientPhone=(client_phone or payload.clientPhone or '').strip() or None,
                address=payload.address.strip(),
                notes=payload.notes,
                status='PENDIENTE',
                total=payload.total,
                items=payload.items,
                paymentMethod=payment_method,
                paymentStatus=payment_status,
                deliveryLocation=payload.deliveryLocation,
                stockReservedAt=timestamp,
                createdAt=timestamp,
                updatedAt=timestamp,
                statusHistory=[OrderStatusHistoryEntry(status='PENDIENTE', at=timestamp, byRole='CLIENT', byUserId=payload.clientId)],
            )
            self.orders.insert(0, order)

            self.notifications.insert(
                0,
                OrderNotification(
                    id=f"notif-{uuid4().hex[:8]}",
                    orderId=order.id,
                    type='NEW_ORDER',
                    audience='ADMIN',
                    message=f'Nuevo pedido recibido: {order.id}',
                    createdAt=timestamp,
                    read=False,
                ),
            )

            self._persist_state()
            return deepcopy(order)

    def assign_driver(self, order_id: str, driver_id: str, by_role: str = 'ADMIN') -> Order:
        with self._lock:
            order = next((item for item in self.orders if item.id == order_id), None)
            if not order:
                raise ValueError('Pedido no encontrado.')
            driver = next((item for item in self.users if item['id'] == driver_id and item['role'] == 'DRIVER'), None)
            if not driver:
                raise ValueError('Repartidor no encontrado.')

            timestamp = now_iso()
            if order.status in ['EN_PREPARACION', 'CONFIRMADO', 'PENDIENTE']:
                if order.status in ['EN_PREPARACION', 'CONFIRMADO']:
                    order.status = 'ASIGNADO'
                    order.statusHistory.append(OrderStatusHistoryEntry(status='ASIGNADO', at=timestamp, byRole='ADMIN'))
                order.assignedDriverId = driver_id
                order.assignedDriverName = driver['fullName']
                order.updatedAt = timestamp
            else:
                raise ValueError('Solo puedes asignar repartidor cuando el pedido esta confirmado o en preparacion.')

            self.notifications.insert(
                0,
                OrderNotification(
                    id=f"notif-{uuid4().hex[:8]}",
                    orderId=order.id,
                    type='DRIVER_ASSIGNED',
                    audience='DRIVER',
                    targetUserId=driver_id,
                    message=f'Se te asigno el pedido {order.id}.',
                    createdAt=timestamp,
                    read=False,
                ),
            )

            self._persist_state()
            return deepcopy(order)

    def force_order_status(self, order_id: str, payload: ForceOrderStatusPayload) -> Order:
        with self._lock:
            order = next((item for item in self.orders if item.id == order_id), None)
            if not order:
                raise ValueError('Pedido no encontrado.')
            if order.status == payload.status:
                raise ValueError(f'El pedido ya esta en estado {payload.status}.')

            timestamp = now_iso()
            previous_status = order.status
            order.status = payload.status
            order.updatedAt = timestamp
            order.statusHistory.append(OrderStatusHistoryEntry(status=payload.status, at=timestamp, byRole='ADMIN'))

            if payload.status == 'CANCELADO' and order.stockReservedAt and not order.stockReleasedAt:
                self._release_stock(order.items)
                order.stockReleasedAt = timestamp

            if payload.status == 'ENTREGADO' and order.paymentStatus == 'PENDIENTE_PAGO':
                order.paymentStatus = 'PAGADO_ENTREGA'

            if previous_status == 'CANCELADO' and payload.status != 'CANCELADO' and order.stockReleasedAt:
                reserve_plan = self._build_reserve_plan(order.items)
                for entry in reserve_plan:
                    entry['product'].stock = entry['nextStock']
                order.stockReleasedAt = None
                order.stockReservedAt = timestamp

            self._persist_state()
            return deepcopy(order)

    def update_order_status(self, order_id: str, payload: UpdateOrderStatusPayload) -> Order:
        with self._lock:
            order = next((item for item in self.orders if item.id == order_id), None)
            if not order:
                raise ValueError('Pedido no encontrado.')

            current = order.status
            next_status = payload.status
            if next_status == current:
                raise ValueError(f'El pedido ya esta en estado {next_status}.')
            if next_status not in ORDER_ALLOWED_TRANSITIONS[current]:
                raise ValueError(f'No se puede pasar de {current} a {next_status}.')

            actor_role = payload.actorRole
            if actor_role == 'DRIVER':
                if order.assignedDriverId != payload.actorId:
                    raise ValueError('No puedes cambiar este pedido porque esta asignado a otro repartidor.')
                if next_status == 'CANCELADO':
                    raise ValueError('El repartidor no puede cancelar pedidos.')

            if next_status == 'CONFIRMADO' and not order.assignedDriverId:
                raise ValueError('Debes asignar un repartidor antes de confirmar el pedido.')

            if next_status == 'ENTREGADO':
                note = (payload.deliveryNote or '').strip()
                recipient_name = (payload.deliveryRecipientName or '').strip()
                if len(note) < 8 or len(recipient_name) < 3 or not payload.deliveryRecipientRelation:
                    raise ValueError('Entrega invalida: nota (min 8), receptor y relacion son obligatorios.')

            timestamp = now_iso()
            order.status = next_status
            order.updatedAt = timestamp
            order.statusHistory.append(
                OrderStatusHistoryEntry(
                    status=next_status,
                    at=timestamp,
                    byRole=payload.actorRole,
                    byUserId=payload.actorId,
                    note=(payload.deliveryNote or '').strip() or None,
                )
            )

            if next_status == 'ENTREGADO':
                order.deliveryProof = {
                    'note': (payload.deliveryNote or '').strip(),
                    'recipientName': (payload.deliveryRecipientName or '').strip(),
                    'recipientRelation': payload.deliveryRecipientRelation,
                    'recipientId': (payload.deliveryRecipientId or '').strip() or None,
                    'otp': (payload.deliveryOtp or '').strip() or None,
                    'photoUri': (payload.deliveryPhotoUri or '').strip() or None,
                    'capturedAt': timestamp,
                    'capturedByUserId': payload.actorId,
                }
                if order.paymentStatus == 'PENDIENTE_PAGO':
                    order.paymentStatus = 'PAGADO_ENTREGA'

            if next_status == 'CANCELADO' and order.stockReservedAt and not order.stockReleasedAt:
                self._release_stock(order.items)
                order.stockReleasedAt = timestamp
                if order.assignedDriverId:
                    self.notifications.insert(
                        0,
                        OrderNotification(
                            id=f"notif-{uuid4().hex[:8]}",
                            orderId=order.id,
                            type='ORDER_CANCELLED',
                            audience='DRIVER',
                            targetUserId=order.assignedDriverId,
                            message=f'El pedido {order.id} fue cancelado.',
                            createdAt=timestamp,
                            read=False,
                        ),
                    )

            self._persist_state()
            return deepcopy(order)

    def list_notifications(self) -> List[OrderNotification]:
        return deepcopy(self.notifications)

    def mark_notifications_read(self, notification_ids: List[str]) -> None:
        ids = set(notification_ids)
        with self._lock:
            for notification in self.notifications:
                if notification.id in ids:
                    notification.read = True
            self._persist_state()

    def mark_all_notifications_read(self) -> None:
        with self._lock:
            for notification in self.notifications:
                notification.read = True
            self._persist_state()


def build_repository_from_env() -> Optional[MongoStateRepository]:
    mongodb_uri = os.getenv('EL_REY_MONGODB_URI', '').strip()
    if not mongodb_uri:
        return None

    db_name = os.getenv('EL_REY_MONGODB_DB', 'el_rey_deliveries').strip() or 'el_rey_deliveries'
    collection_prefix = os.getenv('EL_REY_MONGODB_PREFIX', '').strip()
    legacy_collection_name = os.getenv('EL_REY_MONGODB_LEGACY_COLLECTION', os.getenv('EL_REY_MONGODB_COLLECTION', 'app_state')).strip() or 'app_state'
    state_id = os.getenv('EL_REY_MONGODB_STATE_ID', 'default').strip() or 'default'
    return MongoStateRepository(
        uri=mongodb_uri,
        db_name=db_name,
        collection_prefix=collection_prefix,
        legacy_collection_name=legacy_collection_name,
        legacy_state_id=state_id,
    )


store = AppStore(repository=build_repository_from_env())
