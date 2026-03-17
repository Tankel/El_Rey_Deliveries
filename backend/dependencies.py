from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from security import decode_token
from store import store

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='No autenticado.')

    payload = decode_token(credentials.credentials)
    user_id = payload.get('user_id')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token invalido.')

    user = store.get_user_by_id(user_id)
    if not user or not user.get('isActive'):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario invalido o inactivo.')

    return user


def require_roles(*roles: str):
    def _guard(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get('role') not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='No autorizado.')
        return current_user

    return _guard
