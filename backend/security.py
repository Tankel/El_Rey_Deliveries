import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import HTTPException, status
from jose import JWTError, jwt

SECRET_KEY = os.getenv('EL_REY_SECRET_KEY', 'dev-secret-change-me')
ALGORITHM = 'HS256'
TOKEN_EXPIRE_HOURS = int(os.getenv('EL_REY_TOKEN_EXPIRE_HOURS', '24'))


def build_token(payload: Dict[str, Any], secret_key: str = SECRET_KEY, expires_in_hours: int = TOKEN_EXPIRE_HOURS) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=expires_in_hours)
    to_encode = {
        **payload,
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)


def decode_token(token: str, secret_key: str = SECRET_KEY) -> Dict[str, Any]:
    try:
        return jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token invalido o expirado.',
        ) from exc
