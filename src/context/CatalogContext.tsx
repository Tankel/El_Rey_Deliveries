import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { PRODUCT_SEED } from '@/data/products';
import { Product, computeDiscountPercent } from '@/models/Product';

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
  createProduct: (payload: ProductInput) => ActionResult;
  updateProduct: (productId: string, payload: ProductUpdate) => ActionResult;
  deleteProduct: (productId: string) => ActionResult;
  addContainerTypeOption: (value: string) => ActionResult;
  addPackagingOption: (value: string) => ActionResult;
};

const CATALOG_STORAGE_KEY = 'mvp.catalog.products';
const CATALOG_CONTAINER_OPTIONS_STORAGE_KEY = 'mvp.catalog.container.options';
const CATALOG_PACKAGING_OPTIONS_STORAGE_KEY = 'mvp.catalog.packaging.options';
const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function ensureProductDiscount(product: Product): Product {
  return {
    ...product,
    discountPercent: computeDiscountPercent(product.price, product.originalPrice),
  };
}

function getSeedCopy() {
  return PRODUCT_SEED.map((item) => ({ ...item }));
}

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

function getSeedContainerOptions() {
  return normalizeOptionList(getSeedCopy().map((item) => item.containerType));
}

function getSeedPackagingOptions() {
  return normalizeOptionList(getSeedCopy().map((item) => item.packaging));
}

export function CatalogProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<Product[]>(getSeedCopy());
  const [containerTypeOptions, setContainerTypeOptions] = useState<string[]>(getSeedContainerOptions());
  const [packagingOptions, setPackagingOptions] = useState<string[]>(getSeedPackagingOptions());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await jsonStorage.read<Product[]>(CATALOG_STORAGE_KEY, getSeedCopy());
      const storedContainerOptions = await jsonStorage.read<string[]>(
        CATALOG_CONTAINER_OPTIONS_STORAGE_KEY,
        getSeedContainerOptions(),
      );
      const storedPackagingOptions = await jsonStorage.read<string[]>(
        CATALOG_PACKAGING_OPTIONS_STORAGE_KEY,
        getSeedPackagingOptions(),
      );

      const nextProducts = stored.map(ensureProductDiscount);
      setProducts(nextProducts);
      setContainerTypeOptions(
        normalizeOptionList([...storedContainerOptions, ...nextProducts.map((item) => item.containerType)]),
      );
      setPackagingOptions(
        normalizeOptionList([...storedPackagingOptions, ...nextProducts.map((item) => item.packaging)]),
      );
      setIsHydrated(true);
    };
    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(CATALOG_STORAGE_KEY, products);
  }, [isHydrated, products]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(CATALOG_CONTAINER_OPTIONS_STORAGE_KEY, containerTypeOptions);
  }, [containerTypeOptions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(CATALOG_PACKAGING_OPTIONS_STORAGE_KEY, packagingOptions);
  }, [isHydrated, packagingOptions]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      containerTypeOptions,
      packagingOptions,
      isHydrated,
      createProduct: (payload: ProductInput) => {
        if (!payload.name.trim()) {
          return { ok: false, message: 'El nombre del producto es obligatorio.' };
        }
        if (payload.price <= 0) {
          return { ok: false, message: 'El precio debe ser mayor a 0.' };
        }
        if (payload.originalPrice < payload.price) {
          return { ok: false, message: 'El precio original debe ser mayor o igual al precio actual.' };
        }

        const baseId = payload.id?.trim() || `prod-${slugify(payload.name)}-${Date.now()}`;
        const exists = products.some((item) => item.id === baseId);
        const productId = exists ? `${baseId}-${Math.floor(Math.random() * 1000)}` : baseId;

        const next: Product = ensureProductDiscount({
          ...payload,
          id: productId,
          discountPercent: payload.discountPercent ?? 0,
        });

        setProducts((prev) => [next, ...prev]);
        setContainerTypeOptions((prev) => normalizeOptionList([...prev, next.containerType]));
        setPackagingOptions((prev) => normalizeOptionList([...prev, next.packaging]));
        return { ok: true, message: 'Producto creado.' };
      },
      updateProduct: (productId: string, payload: ProductUpdate) => {
        const existing = products.find((item) => item.id === productId);
        if (!existing) {
          return { ok: false, message: 'Producto no encontrado.' };
        }

        const merged: Product = ensureProductDiscount({
          ...existing,
          ...payload,
          id: existing.id,
        });

        if (!merged.name.trim()) {
          return { ok: false, message: 'El nombre del producto es obligatorio.' };
        }
        if (merged.price <= 0) {
          return { ok: false, message: 'El precio debe ser mayor a 0.' };
        }
        if (merged.originalPrice < merged.price) {
          return { ok: false, message: 'El precio original debe ser mayor o igual al precio actual.' };
        }

        setProducts((prev) => prev.map((item) => (item.id === productId ? merged : item)));
        setContainerTypeOptions((prev) => normalizeOptionList([...prev, merged.containerType]));
        setPackagingOptions((prev) => normalizeOptionList([...prev, merged.packaging]));
        return { ok: true, message: 'Producto actualizado.' };
      },
      deleteProduct: (productId: string) => {
        const exists = products.some((item) => item.id === productId);
        if (!exists) {
          return { ok: false, message: 'Producto no encontrado.' };
        }

        setProducts((prev) => prev.filter((item) => item.id !== productId));
        return { ok: true, message: 'Producto eliminado.' };
      },
      addContainerTypeOption: (value: string) => {
        const normalized = value.trim();
        if (!normalized) {
          return { ok: false, message: 'El tipo de contenedor no puede estar vacio.' };
        }
        const exists = containerTypeOptions.some(
          (item) => item.toLowerCase() === normalized.toLowerCase(),
        );
        if (exists) {
          return { ok: false, message: 'Esa opcion ya existe.' };
        }
        setContainerTypeOptions((prev) => [...prev, normalized]);
        return { ok: true, message: 'Opcion agregada.' };
      },
      addPackagingOption: (value: string) => {
        const normalized = value.trim();
        if (!normalized) {
          return { ok: false, message: 'El empaque no puede estar vacio.' };
        }
        const exists = packagingOptions.some(
          (item) => item.toLowerCase() === normalized.toLowerCase(),
        );
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
