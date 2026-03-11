import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { useCatalog } from '@/context/CatalogContext';
import { Product } from '@/models/Product';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PaymentMethod, PaymentStatus } from '@/types/domain';

type CartItem = {
  product: Product;
  quantity: number;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

type ConfirmOrderPayload = {
  address?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

type CartContextValue = {
  items: CartItem[];
  isHydrated: boolean;
  itemCount: number;
  subtotal: number;
  totalSavings: number;
  addItem: (product: Product, quantity?: number) => ActionResult;
  updateItemQuantity: (productId: string, quantity: number) => ActionResult;
  removeItem: (productId: string) => ActionResult;
  clearCart: () => void;
  confirmOrder: (payload?: ConfirmOrderPayload) => ActionResult;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_STORAGE_KEY = 'mvp.cart.items';

function sanitizeItems(items: CartItem[]): CartItem[] {
  return items.filter((item) => item.quantity > 0);
}

function getLineSavings(item: CartItem): number {
  const perUnit = Math.max(item.product.originalPrice - item.product.price, 0);
  return perUnit * item.quantity;
}

function requiresPrepayment(method: PaymentMethod) {
  return method === 'TARJETA' || method === 'TRANSFERENCIA';
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { products } = useCatalog();
  const cartStorageKey = useMemo(
    () => `${CART_STORAGE_KEY}.${user?.id ?? 'guest'}`,
    [user?.id],
  );

  useEffect(() => {
    let isMounted = true;
    setIsHydrated(false);

    const hydrate = async () => {
      const storedItems = await jsonStorage.read<CartItem[]>(cartStorageKey, []);
      if (!isMounted) {
        return;
      }
      setItems(sanitizeItems(storedItems));
      setIsHydrated(true);
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, [cartStorageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(cartStorageKey, items);
  }, [cartStorageKey, isHydrated, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isHydrated,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      totalSavings: items.reduce((total, item) => total + getLineSavings(item), 0),
      addItem: (product: Product, quantity = 1) => {
        if (quantity <= 0) {
          return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
        }
        const sourceProduct = products.find((item) => item.id === product.id) ?? product;
        if (sourceProduct.stock !== undefined) {
          const existing = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
          if (sourceProduct.stock <= 0) {
            return { ok: false, message: 'Este producto ya no tiene stock.' };
          }
          if (existing + quantity > sourceProduct.stock) {
            return { ok: false, message: `Stock insuficiente. Disponible: ${sourceProduct.stock - existing}.` };
          }
        }

        setItems((prev) => {
          const existing = prev.find((item) => item.product.id === product.id);
          if (!existing) {
            return [...prev, { product, quantity }];
          }
          return prev.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                }
              : item,
          );
        });

        if (sourceProduct.stock !== undefined) {
          const existing = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
          const remaining = sourceProduct.stock - (existing + quantity);
          if (remaining <= 0) {
            return { ok: true, message: 'Producto agregado. Ya alcanzaste el maximo disponible.' };
          }
          if (remaining <= 5) {
            return { ok: true, message: `Producto agregado. Quedan pocas unidades (${remaining}).` };
          }
        }

        return { ok: true, message: 'Producto agregado al carrito.' };
      },
      updateItemQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
        }

        const target = items.find((item) => item.product.id === productId);
        if (!target) {
          return { ok: false, message: 'Producto no encontrado en el carrito.' };
        }

        if (target.product.stock !== undefined && quantity > target.product.stock) {
          return { ok: false, message: 'La cantidad supera el stock disponible.' };
        }

        setItems((prev) =>
          prev.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity,
                }
              : item,
          ),
        );
        return { ok: true, message: 'Cantidad actualizada.' };
      },
      removeItem: (productId: string) => {
        const exists = items.some((item) => item.product.id === productId);
        if (!exists) {
          return { ok: false, message: 'Producto no encontrado en el carrito.' };
        }

        setItems((prev) => prev.filter((item) => item.product.id !== productId));
        return { ok: true, message: 'Producto eliminado del carrito.' };
      },
      clearCart: () => setItems([]),
      confirmOrder: (payload?: ConfirmOrderPayload) => {
        if (items.length === 0) {
          return { ok: false, message: 'No puedes confirmar un pedido vacio.' };
        }

        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para confirmar el pedido.' };
        }
        const paymentMethod = payload?.paymentMethod ?? 'EFECTIVO';
        const paymentStatus = payload?.paymentStatus ?? 'PENDIENTE_PAGO';
        if (paymentStatus === 'RECHAZADO') {
          return { ok: false, message: 'No puedes confirmar con pago rechazado.' };
        }
        if (requiresPrepayment(paymentMethod) && paymentStatus !== 'PAGADO_SIMULADO') {
          return {
            ok: false,
            message: 'Debes confirmar el pago antes de enviar el pedido.',
          };
        }

        for (const item of items) {
          if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            return { ok: false, message: `Cantidad invalida para ${item.product.name}.` };
          }
        }

        for (const item of items) {
          const sourceProduct = products.find((product) => product.id === item.product.id);
          if (!sourceProduct || sourceProduct.stock === undefined) {
            continue;
          }
          if (sourceProduct.stock <= 0) {
            return { ok: false, message: `${item.product.name} ya no tiene stock.` };
          }
          if (item.quantity > sourceProduct.stock) {
            return {
              ok: false,
              message: `Stock insuficiente para ${item.product.name}. Disponible: ${sourceProduct.stock}.`,
            };
          }
        }
        const computedTotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
        if (computedTotal <= 0) {
          return { ok: false, message: 'El total del carrito es invalido.' };
        }

        const result = createOrder({
          clientId: user.id,
          clientName: user.username,
          address: payload?.address?.trim() || 'Direccion pendiente de confirmar',
          total: computedTotal,
          paymentMethod,
          paymentStatus,
          items: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            lineTotal: item.product.price * item.quantity,
          })),
          notes:
            payload?.notes ??
            items.map((item) => `${item.quantity}x ${item.product.name}`).join(', '),
        });

        if (result.ok) {
          setItems([]);
        }
        return result;
      },
    }),
    [createOrder, isHydrated, items, products, user],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
