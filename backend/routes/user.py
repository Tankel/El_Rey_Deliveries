from fastapi import APIRouter, Depends, HTTPException

from dependencies import require_roles
from schemas import AdminUserInput, AdminUserUpdate
from store import store

router = APIRouter(prefix='/users', tags=['Users'])


@router.get('')
def list_users(_: dict = Depends(require_roles('ADMIN'))):
    return {'items': store.list_public_users()}


@router.post('')
def create_user(payload: AdminUserInput, _: dict = Depends(require_roles('ADMIN'))):
    try:
        user = store.create_user(payload)
        return {'ok': True, 'message': 'Usuario creado.', 'user': user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put('/{user_id}')
def update_user(user_id: str, payload: AdminUserUpdate, _: dict = Depends(require_roles('ADMIN'))):
    try:
        user = store.update_user(user_id, payload)
        return {'ok': True, 'message': 'Usuario actualizado.', 'user': user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete('/{user_id}')
def delete_user(user_id: str, _: dict = Depends(require_roles('ADMIN'))):
    try:
        store.delete_user(user_id)
        return {'ok': True, 'message': 'Usuario eliminado.'}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
