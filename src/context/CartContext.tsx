import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
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
  const { products } = useCatalog();
  const itemsRef = useRef<CartItem[]>([]);
  const userRef = useRef(user);
  const productsRef = useRef(products);
  const createOrderRef = useRef(createOrder);
  const cartStorageKey = useMemo(
    () => `${CART_STORAGE_KEY}.${user?.id ?? 'guest'}`,
    [user?.id],
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    createOrderRef.current = createOrder;
  }, [createOrder]);

  useEffect(() => {
    let isMounted = true;
    setIsHydrated(false);

    const hydrate = async () => {
      const storedItems = await jsonStorage.read<CartItem[]>(cartStorageKey, []);
      if (!isMounted) {
        return;
      }
      const nextItems = sanitizeItems(storedItems);
      itemsRef.current = nextItems;
      setItems(nextItems);
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

  const getItemQuantity = useCallback((productId: string) => {
    return itemsRef.current.find((item) => item.product.id === productId)?.quantity ?? 0;
  }, []);

  const addItem = useCallback((product: Product, quantity = 1): ActionResult => {
    if (quantity <= 0) {
      return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
    }

    const sourceProduct = productsRef.current.find((item) => item.id === product.id) ?? product;
    const existing = itemsRef.current.find((item) => item.product.id === product.id)?.quantity ?? 0;

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
      const next = !existingItem
        ? [...prev, { product: sourceProduct, quantity }]
        : prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      itemsRef.current = next;
      return next;
    });

    if (sourceProduct.stock !== undefined) {
      const remaining = sourceProduct.stock - (existing + quantity);
      if (remaining <= 0) {
        return { ok: true, message: 'Producto agregado. Ya alcanzaste el maximo disponible.' };
      }
      if (remaining <= 5) {
        return { ok: true, message: `Producto agregado. Quedan pocas unidades (${remaining}).` };
      }
    }

    return { ok: true, message: 'Producto agregado al carrito.' };
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number): ActionResult => {
    if (quantity <= 0) {
      return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
    }

    const target = itemsRef.current.find((item) => item.product.id === productId);
    if (!target) {
      return { ok: false, message: 'Producto no encontrado en el carrito.' };
    }

    const sourceProduct = productsRef.current.find((item) => item.id === productId) ?? target.product;
    if (sourceProduct.stock !== undefined && quantity > sourceProduct.stock) {
      return { ok: false, message: 'La cantidad supera el stock disponible.' };
    }

    setItems((prev) =>
      {
        const next = prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: sourceProduct,
              quantity,
            }
          : item,
        );
        itemsRef.current = next;
        return next;
      },
    );
    return { ok: true, message: 'Cantidad actualizada.' };
  }, []);

  const removeItem = useCallback((productId: string): ActionResult => {
    const exists = itemsRef.current.some((item) => item.product.id === productId);
    if (!exists) {
      return { ok: false, message: 'Producto no encontrado en el carrito.' };
    }

    setItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      itemsRef.current = next;
      return next;
    });
    return { ok: true, message: 'Producto eliminado del carrito.' };
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
  }, []);

  const confirmOrder = useCallback((payload?: ConfirmOrderPayload): ActionResult => {
    const currentItems = itemsRef.current;
    const currentUser = userRef.current;
    const currentProducts = productsRef.current;

    if (currentItems.length === 0) {
      return { ok: false, message: 'No puedes confirmar un pedido vacio.' };
    }

    if (!currentUser) {
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

    for (const item of currentItems) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return { ok: false, message: `Cantidad invalida para ${item.product.name}.` };
      }
    }

    for (const item of currentItems) {
      const sourceProduct = currentProducts.find((product) => product.id === item.product.id);
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
    const computedTotal = currentItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    if (computedTotal <= 0) {
      return { ok: false, message: 'El total del carrito es invalido.' };
    }

    const result = createOrderRef.current({
      clientId: currentUser.id,
      clientName: currentUser.username,
      address: normalizedAddress,
      deliveryLocation: payload.deliveryLocation,
      total: computedTotal,
      paymentMethod,
      paymentStatus,
      items: currentItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
      })),
      notes:
        payload?.notes ??
        currentItems.map((item) => `${item.quantity}x ${item.product.name}`).join(', '),
    });

    if (result.ok) {
      itemsRef.current = [];
      setItems([]);
    }
    return result;
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isHydrated,
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
    [addItem, clearCart, confirmOrder, getItemQuantity, isHydrated, items, removeItem, updateItemQuantity],
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
