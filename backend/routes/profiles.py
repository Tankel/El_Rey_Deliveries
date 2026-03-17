from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user
from schemas import AccountProfileUpdate, SavedAddressCreate
from store import store

router = APIRouter(prefix='/profiles', tags=['Profiles'])


@router.get('/me')
def get_my_profile(current_user: dict = Depends(get_current_user)):
    profile = store.get_profile(current_user['id'])
    return {'profile': profile}


@router.put('/me')
def update_my_profile(payload: AccountProfileUpdate, current_user: dict = Depends(get_current_user)):
    profile = store.update_profile(current_user['id'], payload)
    return {'ok': True, 'message': 'Perfil actualizado.', 'profile': profile}


@router.post('/me/addresses')
def add_my_address(payload: SavedAddressCreate, current_user: dict = Depends(get_current_user)):
    try:
        profile = store.add_saved_address(current_user['id'], payload)
        return {'ok': True, 'message': 'Direccion guardada.', 'profile': profile}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete('/me/addresses/{address_id}')
def delete_my_address(address_id: str, current_user: dict = Depends(get_current_user)):
    try:
        profile = store.remove_saved_address(current_user['id'], address_id)
        return {'ok': True, 'message': 'Direccion eliminada.', 'profile': profile}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch('/me/addresses/{address_id}/default')
def set_default_address(address_id: str, current_user: dict = Depends(get_current_user)):
    try:
        profile = store.set_default_address(current_user['id'], address_id)
        return {'ok': True, 'message': 'Direccion predeterminada actualizada.', 'profile': profile}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
