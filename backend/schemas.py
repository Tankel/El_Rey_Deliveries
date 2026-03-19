from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

UserRole = Literal['CLIENT', 'ADMIN', 'DRIVER']
PaymentMethod = Literal['TARJETA', 'TERMINAL', 'EFECTIVO', 'TRANSFERENCIA']
PaymentStatus = Literal['PENDIENTE_PAGO', 'PAGADO_ENTREGA', 'PAGADO_SIMULADO', 'RECHAZADO']
OrderStatus = Literal[
    'PENDIENTE',
    'CONFIRMADO',
    'EN_PREPARACION',
    'ASIGNADO',
    'ACEPTADO_REPARTIDOR',
    'EN_CAMINO',
    'ENTREGADO',
    'CANCELADO',
]
DeliveryRecipientRelation = Literal['CLIENTE', 'ENCARGADO', 'FAMILIAR', 'PORTERIA', 'OTRO']
AddressValidationProvider = Literal['GOOGLE', 'MANUAL']


class LoginRequest(BaseModel):
    username: str
    password: str


class PublicUser(BaseModel):
    id: str
    username: str
    fullName: str
    email: str
    phone: str
    role: UserRole
    isActive: bool
    createdAt: str


class LoginResponse(BaseModel):
    token: str
    user: PublicUser


class AuthAuditEvent(BaseModel):
    id: str
    action: Literal['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT']
    username: str
    role: Optional[UserRole] = None
    message: str
    at: str


class AdminUserInput(BaseModel):
    username: str
    password: str = Field(min_length=6)
    fullName: str
    email: EmailStr
    phone: str
    role: UserRole
    isActive: bool = True


class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    isActive: Optional[bool] = None


class Product(BaseModel):
    id: str
    name: str
    brand: str
    image: str
    price: float
    originalPrice: float
    discountPercent: int
    unit: Literal['ml', 'g', 'pz', 'l', 'kg']
    sizeValue: float
    quantityPerPack: int
    containerType: str
    packaging: str
    seller: str
    description: str
    category: Literal['Bebidas', 'Snacks', 'Abarrotes', 'Promociones']
    stock: int = 0


class ProductInput(BaseModel):
    name: str
    brand: str
    image: str
    price: float
    originalPrice: float
    unit: Literal['ml', 'g', 'pz', 'l', 'kg']
    sizeValue: float
    quantityPerPack: int
    containerType: str
    packaging: str
    seller: str
    description: str
    category: Literal['Bebidas', 'Snacks', 'Abarrotes', 'Promociones']
    stock: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = None
    originalPrice: Optional[float] = None
    unit: Optional[Literal['ml', 'g', 'pz', 'l', 'kg']] = None
    sizeValue: Optional[float] = None
    quantityPerPack: Optional[int] = None
    containerType: Optional[str] = None
    packaging: Optional[str] = None
    seller: Optional[str] = None
    description: Optional[str] = None
    category: Optional[Literal['Bebidas', 'Snacks', 'Abarrotes', 'Promociones']] = None
    stock: Optional[int] = None


class DeliveryLocation(BaseModel):
    formattedAddress: str
    placeId: Optional[str] = None
    lat: float
    lng: float
    validatedBy: AddressValidationProvider
    validatedAt: str


class DeliveryProof(BaseModel):
    note: str
    recipientName: str
    recipientRelation: DeliveryRecipientRelation
    recipientId: Optional[str] = None
    otp: Optional[str] = None
    photoUri: Optional[str] = None
    capturedAt: str
    capturedByUserId: Optional[str] = None


class OrderItem(BaseModel):
    productId: str
    productName: str
    quantity: int
    unitPrice: float
    lineTotal: float


class OrderStatusHistoryEntry(BaseModel):
    status: OrderStatus
    at: str
    byRole: Optional[UserRole] = None
    byUserId: Optional[str] = None
    note: Optional[str] = None


class Order(BaseModel):
    id: str
    clientId: str
    clientName: str
    clientPhone: Optional[str] = None
    address: str
    notes: Optional[str] = None
    status: OrderStatus
    total: float
    items: List[OrderItem] = []
    paymentMethod: PaymentMethod = 'EFECTIVO'
    paymentStatus: PaymentStatus = 'PENDIENTE_PAGO'
    assignedDriverId: Optional[str] = None
    assignedDriverName: Optional[str] = None
    statusHistory: List[OrderStatusHistoryEntry] = []
    deliveryProof: Optional[DeliveryProof] = None
    deliveryLocation: Optional[DeliveryLocation] = None
    stockReservedAt: Optional[str] = None
    stockReleasedAt: Optional[str] = None
    createdAt: str
    updatedAt: str


class CreateOrderPayload(BaseModel):
    clientId: str
    clientName: str
    clientPhone: Optional[str] = None
    address: str
    deliveryLocation: Optional[DeliveryLocation] = None
    total: float
    notes: Optional[str] = None
    items: List[OrderItem]
    paymentMethod: Optional[PaymentMethod] = None
    paymentStatus: Optional[PaymentStatus] = None


class AssignDriverPayload(BaseModel):
    driverId: str


class UpdateOrderStatusPayload(BaseModel):
    status: OrderStatus
    actorId: Optional[str] = None
    actorRole: Optional[UserRole] = None
    deliveryNote: Optional[str] = None
    deliveryRecipientName: Optional[str] = None
    deliveryRecipientRelation: Optional[DeliveryRecipientRelation] = None
    deliveryRecipientId: Optional[str] = None
    deliveryOtp: Optional[str] = None
    deliveryPhotoUri: Optional[str] = None


class ForceOrderStatusPayload(BaseModel):
    status: OrderStatus


class DriverProfile(BaseModel):
    id: str
    name: str


class OrderNotification(BaseModel):
    id: str
    orderId: str
    type: Literal['NEW_ORDER', 'DRIVER_ASSIGNED', 'ORDER_CANCELLED']
    audience: Literal['ADMIN', 'DRIVER']
    targetUserId: Optional[str] = None
    message: str
    createdAt: str
    read: bool = False


class ReadNotificationsPayload(BaseModel):
    notificationIds: List[str]


class SavedAddress(BaseModel):
    id: str
    label: str
    formattedAddress: str
    street: str
    exteriorNumber: str
    interiorNumber: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    postalCode: str
    references: Optional[str] = None
    lat: float
    lng: float
    placeId: Optional[str] = None
    validatedBy: AddressValidationProvider
    createdAt: str
    updatedAt: str
    isDefault: bool = False


class AccountProfile(BaseModel):
    userId: str
    role: UserRole
    fullName: str
    accountNumber: str
    email: str
    phone: str
    businessName: str
    taxId: str
    billingAddress: str
    savedAddresses: List[SavedAddress] = []


class AccountProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    accountNumber: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    businessName: Optional[str] = None
    taxId: Optional[str] = None
    billingAddress: Optional[str] = None


class SavedAddressCreate(BaseModel):
    label: str
    formattedAddress: str
    street: str
    exteriorNumber: str
    interiorNumber: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    postalCode: str
    references: Optional[str] = None
    lat: float
    lng: float
    placeId: Optional[str] = None
    validatedBy: AddressValidationProvider
    isDefault: bool = False
