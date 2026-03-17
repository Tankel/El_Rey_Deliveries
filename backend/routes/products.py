from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user, require_roles
from schemas import ProductInput, ProductUpdate
from store import store

router = APIRouter(prefix='/products', tags=['Products'])


@router.get('')
def list_products(_: dict = Depends(get_current_user)):
    return {'items': store.list_products(), **store.get_product_options()}


@router.post('')
def create_product(payload: ProductInput, _: dict = Depends(require_roles('ADMIN'))):
    try:
        product = store.create_product(payload)
        return {'ok': True, 'message': 'Producto creado.', 'product': product}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put('/{product_id}')
def update_product(product_id: str, payload: ProductUpdate, _: dict = Depends(require_roles('ADMIN'))):
    try:
        product = store.update_product(product_id, payload)
        return {'ok': True, 'message': 'Producto actualizado.', 'product': product}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete('/{product_id}')
def delete_product(product_id: str, _: dict = Depends(require_roles('ADMIN'))):
    try:
        store.delete_product(product_id)
        return {'ok': True, 'message': 'Producto eliminado.'}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
