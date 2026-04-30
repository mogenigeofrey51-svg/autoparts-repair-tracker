import { ClipboardList, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import type { Order, OrderItem } from "../types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function vehicleLabel(item: OrderItem) {
  if (item.vehicleYear && item.vehicleMake && item.vehicleModel) {
    return `${item.vehicleYear} ${item.vehicleMake} ${item.vehicleModel}${
      item.vehicleRegistrationNumber ? ` (${item.vehicleRegistrationNumber})` : ""
    }`;
  }

  if (item.vehicle) {
    return `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model} (${item.vehicle.registrationNumber})`;
  }

  return "";
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setOrders(await api<Order[]>("/orders"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Order history" description="Track submitted part orders and fulfillment status." />
      {loading ? (
        <p className="text-sm text-zinc-500">Loading orders</p>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <section key={order.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-500">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <h3 className="mt-1 text-xl font-bold">{currency.format(order.total)}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="w-fit rounded-md bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{order.status}</span>
                  <span className="w-fit rounded-md bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                <span>{order.shippingAddress}</span>
                {order.mapUrl && (
                  <a className="secondary-action w-fit px-3 py-1.5" href={order.mapUrl} target="_blank" rel="noreferrer">
                    <MapPin size={15} />
                    Map
                  </a>
                )}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="py-2">Part</th>
                      <th>Brand</th>
                      <th>Linked vehicle</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-medium">{item.productName}</td>
                        <td>{item.brand}</td>
                        <td>
                          {vehicleLabel(item) ? (
                            <span className="font-medium text-emerald-700">{vehicleLabel(item)}</span>
                          ) : (
                            <span className="text-zinc-400">Not linked</span>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{currency.format(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="No orders yet" body="Your checkout history will appear here after the first parts order." action={<ClipboardList className="mx-auto text-emerald-700" />} />
      )}
    </div>
  );
}
