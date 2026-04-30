import { Package, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (productId: string) => Promise<void> }) {
  return (
    <article className="app-panel group flex h-full flex-col overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-soft">
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 text-zinc-400">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,120,87,0.10)_0,rgba(4,120,87,0.10)_1px,transparent_1px,transparent_14px)]" />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-emerald-700 shadow-sm">
          {product.category?.name ?? "Part"}
        </span>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="relative h-full w-full rounded-md object-cover transition group-hover:scale-105" />
        ) : (
          <Package size={46} className="relative" />
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{product.brand}</p>
            <h3 className="mt-1 text-base font-bold">{product.name}</h3>
          </div>
          <p className="rounded-md bg-emerald-50 px-2 py-1 text-base font-bold text-emerald-800">${product.price.toFixed(2)}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {product.compatibleMakes.slice(0, 2).map((make) => (
            <span key={make} className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
              {make}
            </span>
          ))}
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
            {product.stockQuantity} in stock
          </span>
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <Link
            to={`/products/${product.id}`}
            className="secondary-action flex-1 px-3"
          >
            <Search size={16} />
            Details
          </Link>
          <button
            className="primary-action flex-1 px-3"
            onClick={() => onAdd(product.id)}
            disabled={product.stockQuantity < 1}
            type="button"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
