import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, updateItem, removeItem, checkout } = useCart();
  const [form, setForm] = useState({
    shippingName: user?.name ?? "",
    shippingPhone: user?.phone ?? "",
    shippingAddress: user?.address ?? ""
  });
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  async function submitCheckout(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPlacingOrder(true);
    try {
      await checkout(form);
      navigate("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div>
      <PageHeader title="Cart" description="Review selected parts and place a placeholder checkout order." />
      {!items.length ? (
        <EmptyState
          title="Your cart is empty"
          body="Find parts by vehicle make, model, year, category, or keyword."
          action={
            <Link className="focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" to="/catalog">
              <ShoppingBag size={16} />
              Browse catalog
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="divide-y divide-zinc-200">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-zinc-500">
                      {item.product.brand} - {currency.format(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="focus-ring rounded-md border border-zinc-300 p-2"
                      onClick={() => void updateItem(item.id, Math.max(1, item.quantity - 1))}
                      title="Decrease quantity"
                      type="button"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      className="focus-ring rounded-md border border-zinc-300 p-2"
                      onClick={() => void updateItem(item.id, item.quantity + 1)}
                      title="Increase quantity"
                      type="button"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      className="focus-ring rounded-md border border-red-200 p-2 text-red-700"
                      onClick={() => void removeItem(item.id)}
                      title="Remove item"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={submitCheckout}>
            <h3 className="text-lg font-bold">Checkout</h3>
            <p className="mt-1 text-sm text-zinc-500">Payment can be added later; this creates an order record now.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Shipping name
                <input
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={form.shippingName}
                  onChange={(event) => setForm({ ...form, shippingName: event.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={form.shippingPhone ?? ""}
                  onChange={(event) => setForm({ ...form, shippingPhone: event.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Address
                <textarea
                  className="focus-ring mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={form.shippingAddress ?? ""}
                  onChange={(event) => setForm({ ...form, shippingAddress: event.target.value })}
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-4">
              <span className="font-semibold">Subtotal</span>
              <span className="text-xl font-bold">{currency.format(subtotal)}</span>
            </div>
            {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <button
              className="focus-ring mt-5 w-full rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:bg-zinc-300"
              disabled={placingOrder}
              type="submit"
            >
              {placingOrder ? "Creating order" : "Place order"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
