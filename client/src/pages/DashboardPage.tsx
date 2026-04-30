import { Car, ClipboardList, DollarSign, ShoppingCart, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { useCart } from "../context/CartContext";
import type { Order, RepairRecord, Vehicle } from "../types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function DashboardPage() {
  const { count, subtotal } = useCart();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vehicleData, orderData] = await Promise.all([api<Vehicle[]>("/vehicles"), api<Order[]>("/orders")]);
        setVehicles(vehicleData);
        setOrders(orderData);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const repairs = useMemo(
    () =>
      vehicles
        .flatMap((vehicle) =>
          (vehicle.repairs ?? []).map((repair) => ({
            ...repair,
            vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          }))
        )
        .sort((a, b) => Date.parse(b.dateOfRepair) - Date.parse(a.dateOfRepair)),
    [vehicles]
  );

  const totalRepairCost = repairs.reduce((sum, repair) => sum + repair.cost, 0);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A practical snapshot of garage activity, service costs, orders, and cart value."
        actions={
          <>
            <Link className="primary-action" to="/vehicles">
              Add vehicle
            </Link>
            <Link className="secondary-action" to="/catalog">
              Find parts
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehicles" value={String(vehicles.length)} detail="Registered in your garage" icon={<Car size={20} />} />
        <StatCard
          label="Repair spend"
          value={currency.format(totalRepairCost)}
          detail="Across all tracked vehicles"
          icon={<DollarSign size={20} />}
        />
        <StatCard label="Active orders" value={String(activeOrders)} detail="Pending, processing, or shipped" icon={<ClipboardList size={20} />} />
        <StatCard label="Cart" value={currency.format(subtotal)} detail={`${count} item${count === 1 ? "" : "s"} selected`} icon={<ShoppingCart size={20} />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent repair timeline</h3>
            <Wrench size={20} className="text-emerald-700" />
          </div>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading repairs</p>
          ) : repairs.length ? (
            <div className="space-y-4">
              {repairs.slice(0, 5).map((repair: RepairRecord & { vehicleLabel: string }) => (
                <div key={repair.id} className="rounded-md border border-zinc-200 border-l-4 border-l-emerald-700 bg-zinc-50/70 p-4">
                  <p className="text-sm font-semibold">{repair.title}</p>
                  <p className="text-sm text-zinc-500">{repair.vehicleLabel}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {new Date(repair.dateOfRepair).toLocaleDateString()} - {repair.mechanicName} -{" "}
                    {currency.format(repair.cost)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No repairs yet" body="Add a vehicle and create the first repair record to build a useful service history." />
          )}
        </section>

        <section className="app-panel p-5">
          <h3 className="text-lg font-bold">Latest orders</h3>
          <div className="mt-4 space-y-3">
            {orders.slice(0, 4).map((order) => (
              <Link
                to="/orders"
                key={order.id}
                className="block rounded-md border border-zinc-200 bg-zinc-50/70 p-3 transition hover:border-emerald-600 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">#{order.id.slice(-8).toUpperCase()}</p>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">{order.status}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{currency.format(order.total)}</p>
              </Link>
            ))}
            {!orders.length && <p className="text-sm text-zinc-500">Order history will appear after checkout.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
