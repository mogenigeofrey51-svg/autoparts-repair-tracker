import { Package, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (productId: string) => Promise<void> }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex h-36 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-md object-cover" />
        ) : (
          <Package size={42} />
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{product.brand}</p>
            <h3 className="mt-1 text-base font-bold">{product.name}</h3>
          </div>
          <p className="text-base font-bold text-zinc-950">${product.price.toFixed(2)}</p>
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
            className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            <Search size={16} />
            Details
          </Link>
          <button
            className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
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
