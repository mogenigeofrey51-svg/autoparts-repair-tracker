import { Filter, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import type { Category, Product } from "../types";

const initialFilters = {
  keyword: "",
  make: "",
  model: "",
  year: "",
  category: ""
};

export function CatalogPage() {
  const { addItem } = useCart();
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadProducts(nextFilters = filters) {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    });
    try {
      setProducts(await api<Product[]>(`/products${params.toString() ? `?${params}` : ""}`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadProducts(initialFilters), api<Category[]>("/categories").then(setCategories)]);
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void loadProducts();
  }

  async function onAdd(productId: string) {
    setNotice("");
    try {
      await addItem(productId, 1);
      setNotice("Part added to cart.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add item.");
    }
  }

  return (
    <div>
      <PageHeader title="Parts catalog" description="Search stock by vehicle details, category, brand, or part keyword." />

      <form className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={onSearch}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm font-medium xl:col-span-2">
            Keyword
            <div className="mt-1 flex items-center rounded-md border border-zinc-300 bg-white px-3">
              <Search size={16} className="text-zinc-400" />
              <input
                className="focus-ring w-full border-0 px-2 py-2 outline-none"
                value={filters.keyword}
                onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
                placeholder="oil filter, brake pads"
              />
            </div>
          </label>
          <label className="text-sm font-medium">
            Make
            <input
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={filters.make}
              onChange={(event) => setFilters({ ...filters, make: event.target.value })}
              placeholder="Toyota"
            />
          </label>
          <label className="text-sm font-medium">
            Model
            <input
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={filters.model}
              onChange={(event) => setFilters({ ...filters, model: event.target.value })}
              placeholder="Corolla"
            />
          </label>
          <label className="text-sm font-medium">
            Year
            <input
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={filters.year}
              onChange={(event) => setFilters({ ...filters, year: event.target.value })}
              placeholder="2015"
              inputMode="numeric"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <select
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
            <Filter size={16} />
            Apply filters
          </button>
          <button
            className="focus-ring rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              setFilters(initialFilters);
              void loadProducts(initialFilters);
            }}
            type="button"
          >
            Reset
          </button>
          {notice && <p className="text-sm font-medium text-emerald-700">{notice}</p>}
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading products</p>
        ) : products.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
          </div>
        ) : (
          <EmptyState title="No parts found" body="Try clearing a filter or searching with a broader vehicle model or part keyword." />
        )}
      </div>
    </div>
  );
}
