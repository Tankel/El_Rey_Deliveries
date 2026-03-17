import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '@/models/Product';
import {
  createProduct as createProductRequest,
  deleteProduct as deleteProductRequest,
  listProducts,
  updateProduct as updateProductRequest,
} from '@/services/api/endpoints/products';
import { useAuth } from '@/state/AuthContext';

type ActionResult = {
  ok: boolean;
  message: string;
};

type ProductInput = Omit<Product, 'id' | 'discountPercent'> & {
  id?: string;
  discountPercent?: number;
};

type ProductUpdate = Partial<Omit<Product, 'id'>> & {
  name?: string;
};

type CatalogContextValue = {
  products: Product[];
  containerTypeOptions: string[];
  packagingOptions: string[];
  isHydrated: boolean;
  refreshCatalog: () => Promise<void>;
  createProduct: (payload: ProductInput) => Promise<ActionResult>;
  updateProduct: (productId: string, payload: ProductUpdate) => Promise<ActionResult>;
  deleteProduct: (productId: string) => Promise<ActionResult>;
  addContainerTypeOption: (value: string) => Promise<ActionResult>;
  addPackagingOption: (value: string) => Promise<ActionResult>;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

function normalizeOptionList(items: string[]) {
  const unique = new Set<string>();
  items.forEach((item) => {
    const value = item.trim();
    if (value) {
      unique.add(value);
    }
  });
  return Array.from(unique);
}

export function CatalogProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [containerTypeOptions, setContainerTypeOptions] = useState<string[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshCatalog = async () => {
    try {
      const response = await listProducts();
      setProducts(response.items);
      setContainerTypeOptions(normalizeOptionList(response.containerTypeOptions));
      setPackagingOptions(normalizeOptionList(response.packagingOptions));
    } catch {
      setProducts([]);
      setContainerTypeOptions([]);
      setPackagingOptions([]);
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    void refreshCatalog();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setContainerTypeOptions([]);
      setPackagingOptions([]);
      return;
    }
    void refreshCatalog();
  }, [isAuthenticated, user?.id]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      containerTypeOptions,
      packagingOptions,
      isHydrated,
      refreshCatalog,
      createProduct: async (payload) => {
        try {
          const response = await createProductRequest({
            ...payload,
            stock: payload.stock ?? 0,
          });
          setProducts((prev) => [response.product, ...prev]);
          setContainerTypeOptions((prev) => normalizeOptionList([...prev, response.product.containerType]));
          setPackagingOptions((prev) => normalizeOptionList([...prev, response.product.packaging]));
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear producto.' };
        }
      },
      updateProduct: async (productId, payload) => {
        try {
          const response = await updateProductRequest(productId, payload);
          setProducts((prev) => prev.map((item) => (item.id === productId ? response.product : item)));
          setContainerTypeOptions((prev) => normalizeOptionList([...prev, response.product.containerType]));
          setPackagingOptions((prev) => normalizeOptionList([...prev, response.product.packaging]));
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar producto.' };
        }
      },
      deleteProduct: async (productId) => {
        try {
          const response = await deleteProductRequest(productId);
          setProducts((prev) => prev.filter((item) => item.id !== productId));
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo eliminar producto.' };
        }
      },
      addContainerTypeOption: async (value) => {
        const normalized = value.trim();
        if (!normalized) {
          return { ok: false, message: 'El tipo de contenedor no puede estar vacio.' };
        }
        const exists = containerTypeOptions.some((item) => item.toLowerCase() === normalized.toLowerCase());
        if (exists) {
          return { ok: false, message: 'Esa opcion ya existe.' };
        }
        setContainerTypeOptions((prev) => [...prev, normalized]);
        return { ok: true, message: 'Opcion agregada.' };
      },
      addPackagingOption: async (value) => {
        const normalized = value.trim();
        if (!normalized) {
          return { ok: false, message: 'El empaque no puede estar vacio.' };
        }
        const exists = packagingOptions.some((item) => item.toLowerCase() === normalized.toLowerCase());
        if (exists) {
          return { ok: false, message: 'Esa opcion ya existe.' };
        }
        setPackagingOptions((prev) => [...prev, normalized]);
        return { ok: true, message: 'Opcion agregada.' };
      },
    }),
    [containerTypeOptions, isHydrated, packagingOptions, products],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used inside CatalogProvider');
  }
  return context;
}
