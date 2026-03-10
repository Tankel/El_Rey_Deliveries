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

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { products, updateProduct } = useCatalog();

  useEffect(() => {
    const hydrate = async () => {
      const storedItems = await jsonStorage.read<CartItem[]>(CART_STORAGE_KEY, []);
      setItems(sanitizeItems(storedItems));
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(CART_STORAGE_KEY, items);
  }, [isHydrated, items]);

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

        const result = createOrder({
          clientId: user.id,
          clientName: user.username,
          address: payload?.address ?? 'Direccion pendiente de confirmar',
          total: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
          paymentMethod: payload?.paymentMethod ?? 'EFECTIVO',
          paymentStatus: payload?.paymentStatus ?? 'PENDIENTE_PAGO',
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
          items.forEach((item) => {
            const sourceProduct = products.find((product) => product.id === item.product.id);
            if (!sourceProduct || sourceProduct.stock === undefined) {
              return;
            }
            const nextStock = Math.max(sourceProduct.stock - item.quantity, 0);
            updateProduct(sourceProduct.id, { stock: nextStock });
          });
          setItems([]);
        }
        return result;
      },
    }),
    [createOrder, isHydrated, items, products, updateProduct, user],
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
