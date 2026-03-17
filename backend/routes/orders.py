from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user, require_roles
from schemas import (
    AssignDriverPayload,
    CreateOrderPayload,
    ForceOrderStatusPayload,
    ReadNotificationsPayload,
    UpdateOrderStatusPayload,
)
from store import store

router = APIRouter(prefix='/orders', tags=['Orders'])


@router.get('')
def list_orders(_: dict = Depends(get_current_user)):
    return {
        'items': store.list_orders(),
        'drivers': store.list_driver_profiles(),
    }


@router.post('')
def create_order(payload: CreateOrderPayload, _: dict = Depends(get_current_user)):
    try:
        order = store.create_order(payload)
        return {'ok': True, 'message': 'Pedido creado correctamente.', 'order': order}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch('/{order_id}/assign-driver')
def assign_driver(order_id: str, payload: AssignDriverPayload, _: dict = Depends(require_roles('ADMIN'))):
    try:
        order = store.assign_driver(order_id, payload.driverId)
        return {'ok': True, 'message': 'Repartidor asignado.', 'order': order}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch('/{order_id}/status')
def update_status(order_id: str, payload: UpdateOrderStatusPayload, _: dict = Depends(get_current_user)):
    try:
        order = store.update_order_status(order_id, payload)
        return {'ok': True, 'message': f'Estado actualizado a {payload.status}.', 'order': order}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch('/{order_id}/force-status')
def force_status(order_id: str, payload: ForceOrderStatusPayload, _: dict = Depends(require_roles('ADMIN'))):
    try:
        order = store.force_order_status(order_id, payload)
        return {'ok': True, 'message': f'Estado forzado a {payload.status}.', 'order': order}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get('/notifications')
def list_notifications(current_user: dict = Depends(get_current_user)):
    role = current_user['role']
    user_id = current_user['id']
    items = store.list_notifications()

    if role == 'ADMIN':
        filtered = [item for item in items if item.audience == 'ADMIN']
    elif role == 'DRIVER':
        filtered = [item for item in items if item.audience == 'DRIVER' and item.targetUserId == user_id]
    else:
        filtered = []

    return {'items': filtered}


@router.patch('/notifications/read')
def mark_notifications_read(payload: ReadNotificationsPayload, _: dict = Depends(get_current_user)):
    store.mark_notifications_read(payload.notificationIds)
    return {'ok': True, 'message': 'Notificaciones actualizadas.'}


@router.patch('/notifications/read-all')
def mark_all_notifications_read(_: dict = Depends(get_current_user)):
    store.mark_all_notifications_read()
    return {'ok': True, 'message': 'Notificaciones actualizadas.'}
