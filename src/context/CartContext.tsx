import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { requiresPrepayment } from '@/domain/rules/orderRules';
import { Product } from '@/models/Product';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { DeliveryLocation, PaymentMethod, PaymentStatus } from '@/types/domain';

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
  deliveryLocation?: DeliveryLocation;
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
  getItemQuantity: (productId: string) => number;
  addItem: (product: Product, quantity?: number) => ActionResult;
  updateItemQuantity: (productId: string, quantity: number) => ActionResult;
  removeItem: (productId: string) => ActionResult;
  clearCart: () => void;
  confirmOrder: (payload?: ConfirmOrderPayload) => Promise<ActionResult>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getLineSavings(item: CartItem): number {
  const perUnit = Math.max(item.product.originalPrice - item.product.price, 0);
  return perUnit * item.quantity;
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { products } = useCatalog();

  const getItemQuantity = useCallback(
    (productId: string) => items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items],
  );

  const addItem = useCallback(
    (product: Product, quantity = 1): ActionResult => {
      if (quantity <= 0) {
        return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
      }

      const sourceProduct = products.find((item) => item.id === product.id) ?? product;
      const existing = items.find((item) => item.product.id === product.id)?.quantity ?? 0;

      if (sourceProduct.stock !== undefined) {
        if (sourceProduct.stock <= 0) {
          return { ok: false, message: 'Este producto ya no tiene stock.' };
        }
        if (existing + quantity > sourceProduct.stock) {
          return { ok: false, message: `Stock insuficiente. Disponible: ${sourceProduct.stock - existing}.` };
        }
      }

      setItems((prev) => {
        const existingItem = prev.find((item) => item.product.id === product.id);
        if (!existingItem) {
          return [...prev, { product: sourceProduct, quantity }];
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

      return { ok: true, message: 'Producto agregado al carrito.' };
    },
    [items, products],
  );

  const updateItemQuantity = useCallback(
    (productId: string, quantity: number): ActionResult => {
      if (quantity <= 0) {
        return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
      }

      const target = items.find((item) => item.product.id === productId);
      if (!target) {
        return { ok: false, message: 'Producto no encontrado en el carrito.' };
      }

      const sourceProduct = products.find((item) => item.id === productId) ?? target.product;
      if (sourceProduct.stock !== undefined && quantity > sourceProduct.stock) {
        return { ok: false, message: 'La cantidad supera el stock disponible.' };
      }

      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? {
                ...item,
                product: sourceProduct,
                quantity,
              }
            : item,
        ),
      );
      return { ok: true, message: 'Cantidad actualizada.' };
    },
    [items, products],
  );

  const removeItem = useCallback(
    (productId: string): ActionResult => {
      const exists = items.some((item) => item.product.id === productId);
      if (!exists) {
        return { ok: false, message: 'Producto no encontrado en el carrito.' };
      }

      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return { ok: true, message: 'Producto eliminado del carrito.' };
    },
    [items],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const confirmOrder = useCallback(
    async (payload?: ConfirmOrderPayload): Promise<ActionResult> => {
      if (!items.length) {
        return { ok: false, message: 'No puedes confirmar un pedido vacio.' };
      }

      if (!user) {
        return { ok: false, message: 'Debes iniciar sesion para confirmar el pedido.' };
      }
      const normalizedAddress = payload?.address?.trim();
      if (!normalizedAddress) {
        return { ok: false, message: 'Debes confirmar el domicilio de entrega antes de pagar.' };
      }

      if (!payload?.deliveryLocation) {
        return { ok: false, message: 'Domicilio no validado. Vuelve a confirmar la direccion.' };
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

      const computedTotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      if (computedTotal <= 0) {
        return { ok: false, message: 'El total del carrito es invalido.' };
      }

      const result = await createOrder({
        clientId: user.id,
        clientName: user.username,
        address: normalizedAddress,
        deliveryLocation: payload.deliveryLocation,
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
        notes: payload?.notes ?? items.map((item) => `${item.quantity}x ${item.product.name}`).join(', '),
      });

      if (result.ok) {
        setItems([]);
      }
      return result;
    },
    [createOrder, items, user],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isHydrated: true,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      totalSavings: items.reduce((total, item) => total + getLineSavings(item), 0),
      getItemQuantity,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      confirmOrder,
    }),
    [addItem, clearCart, confirmOrder, getItemQuantity, items, removeItem, updateItemQuantity],
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
