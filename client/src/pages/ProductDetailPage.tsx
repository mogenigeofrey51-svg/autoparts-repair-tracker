import { ArrowLeft, Package, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (id) {
      void api<Product>(`/products/${id}`).then(setProduct);
    }
  }, [id]);

  async function addToCart() {
    if (!product) return;
    setNotice("");
    try {
      await addItem(product.id, quantity);
      setNotice("Part added to cart.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add item.");
    }
  }

  if (!product) {
    return <p className="text-sm text-zinc-500">Loading product</p>;
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${product.brand} - ${product.category?.name ?? "Uncategorized"}`}
        actions={
          <Link to="/catalog" className="focus-ring inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex aspect-square items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-md object-cover" />
            ) : (
              <Package size={72} />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{product.brand}</p>
              <h3 className="mt-1 text-2xl font-bold">{product.name}</h3>
              <p className="mt-3 max-w-2xl text-zinc-600">{product.description}</p>
            </div>
            <p className="text-3xl font-bold">{currency.format(product.price)}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Stock</p>
              <p className="mt-1 text-xl font-bold">{product.stockQuantity}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Category</p>
              <p className="mt-1 text-xl font-bold">{product.category?.name}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Compatibility</p>
              <p className="mt-1 text-xl font-bold">{product.compatibleMakes.length} makes</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-500">
              <ShieldCheck size={16} />
              Compatible vehicles
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.compatibleMakes.map((make) => (
                <span key={make} className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  {make}
                </span>
              ))}
              {product.compatibleModels.map((model) => (
                <span key={model} className="rounded-md bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                  {model}
                </span>
              ))}
              {product.compatibleYears.length > 0 && (
                <span className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">
                  {Math.min(...product.compatibleYears)}-{Math.max(...product.compatibleYears)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2 sm:w-28"
              min={1}
              max={product.stockQuantity}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white disabled:bg-zinc-300"
              onClick={addToCart}
              disabled={product.stockQuantity < 1}
              type="button"
            >
              <Plus size={18} />
              Add to cart
            </button>
          </div>
          {notice && <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}
        </section>
      </div>
    </div>
  );
}
