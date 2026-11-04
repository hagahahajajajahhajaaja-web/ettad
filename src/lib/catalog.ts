/**
 * طبقة الوصول إلى الكتالوج (Repository).
 * كل الصفحات تقرأ المنتجات من هنا فقط، لذلك يمكن لاحقًا استبدال المصدر (ملفات → قاعدة بيانات/لوحة تحكم)
 * دون تعديل الواجهات. البيانات تُتحقق منها عند التحميل ويفشل البناء إذا كانت غير صالحة.
 */
import { z } from 'zod';
import { categories as rawCategories } from '@/data/categories';
import { products as rawProducts } from '@/data/products';
import rawImageManifest from '@/data/product-images.json';
import {
  categorySchema,
  productImageManifestSchema,
  productSchema,
  type Category,
  type Product,
  type ProductImage,
} from '@/lib/schema';

export type CatalogProduct = Product & { images: ProductImage[]; category: Category };

/** نسخة مختصرة من المنتج تُرسل للمتصفح (السلة والبحث). */
export type ProductSummary = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  categoryId: string;
  categoryName: string;
  priceFils: number | null;
  availability: Product['availability'];
  /** استخدام المنتج في سطر قصير */
  useLine: string;
  thumbnail: ProductImage | null;
  /** وصف الصورة الأولى (مثل «علبة ...») أو اسم المنتج */
  thumbnailAlt: string;
  keywords: string[];
  featured: boolean;
  sortOrder: number;
};

export class CatalogError extends Error {}

export function buildCatalog(input: { categories: unknown; products: unknown; images: unknown }) {
  const categories = z.array(categorySchema).parse(input.categories);
  const products = z.array(productSchema).parse(input.products);
  const images = productImageManifestSchema.parse(input.images);

  const categoryIds = new Set<string>();
  for (const category of categories) {
    if (categoryIds.has(category.id)) throw new CatalogError(`قسم مكرر: ${category.id}`);
    categoryIds.add(category.id);
  }

  const productIds = new Set<string>();
  const catalogProducts: CatalogProduct[] = products.map((product) => {
    if (productIds.has(product.id)) throw new CatalogError(`منتج مكرر: ${product.id}`);
    productIds.add(product.id);
    const category = categories.find((c) => c.id === product.categoryId);
    if (!category) throw new CatalogError(`المنتج ${product.id} يشير إلى قسم غير موجود: ${product.categoryId}`);
    return { ...product, category, images: images[product.id] ?? [] };
  });

  for (const slug of Object.keys(images)) {
    if (!productIds.has(slug)) throw new CatalogError(`صور لمنتج غير موجود في البيانات: ${slug}`);
  }

  catalogProducts.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ar'));
  categories.sort((a, b) => a.sortOrder - b.sortOrder);
  return { categories, products: catalogProducts };
}

const catalog = buildCatalog({ categories: rawCategories, products: rawProducts, images: rawImageManifest });

export function getAllProducts(): CatalogProduct[] {
  return catalog.products;
}

export function getProduct(id: string): CatalogProduct | undefined {
  return catalog.products.find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return catalog.products.filter((p) => p.categoryId === categoryId);
}

/** الأقسام التي تحتوي على منتج واحد على الأقل فقط — لا صفحات أقسام فارغة. */
export function activeCategoriesOf(
  categories: Category[],
  products: { categoryId: string }[],
): (Category & { productCount: number })[] {
  return categories
    .map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length }))
    .filter((c) => c.productCount > 0);
}

export function getActiveCategories(): (Category & { productCount: number })[] {
  return activeCategoriesOf(catalog.categories, catalog.products);
}

export function getCategory(id: string): Category | undefined {
  return catalog.categories.find((c) => c.id === id);
}

export function getRelatedProducts(product: CatalogProduct, limit = 4): CatalogProduct[] {
  const sameCategory = catalog.products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
  const others = catalog.products.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId);
  return [...sameCategory, ...others].slice(0, limit);
}

export function toSummary(product: CatalogProduct): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    priceFils: product.priceFils,
    availability: product.availability,
    useLine: product.useLine,
    thumbnail: product.images[0] ?? null,
    thumbnailAlt: product.imageAlts[0] ?? product.name,
    keywords: product.keywords,
    featured: product.featured,
    sortOrder: product.sortOrder,
  };
}

export function getProductSummaries(): ProductSummary[] {
  return catalog.products.map(toSummary);
}

export function getCategoryIconMap(): Record<string, Category['icon']> {
  return Object.fromEntries(catalog.categories.map((c) => [c.id, c.icon]));
}
