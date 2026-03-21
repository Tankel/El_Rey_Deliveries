import os

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user, require_roles
from schemas import LoginRequest, LoginResponse
from security import build_token
from store import store

router = APIRouter(prefix='/auth', tags=['Auth'])
ALLOW_DEMO_RESET = os.getenv('EL_REY_ENABLE_DEMO_RESET', 'true').strip().lower() in {'1', 'true', 'yes'}


@router.post('/login', response_model=LoginResponse)
def login(payload: LoginRequest):
    username = payload.username.strip().lower()
    user = store.get_user_by_username(username)

    if not user:
        store.append_audit('LOGIN_FAILED', username, 'Usuario no encontrado.')
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario o contraseña incorrectos.')

    if not user.get('isActive'):
        store.append_audit('LOGIN_FAILED', username, 'Usuario inactivo.', user.get('role'))
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Tu usuario esta inactivo.')

    if not store.verify_user_password(payload.password, user['passwordHash']):
        store.append_audit('LOGIN_FAILED', username, 'Contraseña incorrecta.', user.get('role'))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario o contraseña incorrectos.')

    if store.user_password_needs_migration(user['passwordHash']):
        store.migrate_user_password(user['id'], payload.password)
        user = store.get_user_by_id(user['id']) or user

    token = build_token({'user_id': user['id'], 'role': user['role']})
    store.append_audit('LOGIN_SUCCESS', username, 'Inicio de sesion exitoso.', user.get('role'))

    return {
        'token': token,
        'user': store._user_public(user),
    }


@router.get('/me')
def me(current_user: dict = Depends(get_current_user)):
    return {
        'user': store._user_public(current_user),
    }


@router.post('/logout')
def logout(current_user: dict = Depends(get_current_user)):
    store.append_audit('LOGOUT', current_user['username'], 'Cierre de sesion manual.', current_user.get('role'))
    return {'ok': True, 'message': 'Sesion cerrada.'}


@router.get('/audit-log')
def audit_log(_: dict = Depends(require_roles('ADMIN'))):
    return {'items': store.audit_log}


@router.post('/reset-demo')
def reset_demo_data(_: dict = Depends(require_roles('ADMIN'))):
    if not ALLOW_DEMO_RESET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Reset demo deshabilitado en este ambiente.')
    store.reset_demo_data()
    return {'ok': True, 'message': 'Datos demo restaurados.'}
