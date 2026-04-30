import {
  Car,
  CircleGauge,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  ShoppingCart,
  UserCircle,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const baseNav = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/catalog", label: "Parts", icon: PackageSearch },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: UserCircle }
];

const adminNav = [
  { to: "/admin", label: "Business", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserCircle }
];

export function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNav : baseNav;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen text-zinc-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-800 bg-zinc-950 px-4 py-5 text-white shadow-soft transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 p-2 text-emerald-300">
              <CircleGauge size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Parts & service</p>
              <h1 className="text-xl font-bold text-white">Ride254</h1>
            </div>
          </div>
          <button
            className="focus-ring rounded-md p-2 text-zinc-300 lg:hidden"
            onClick={() => setOpen(false)}
            title="Close menu"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/40"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-zinc-400">{user?.email}</p>
          <button
            className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-zinc-950/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/85 px-4 shadow-sm shadow-zinc-900/5 backdrop-blur sm:px-6">
          <button
            className="focus-ring rounded-md p-2 text-zinc-700 lg:hidden"
            onClick={() => setOpen(true)}
            title="Open menu"
            type="button"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-zinc-500">
              {isAdmin ? "Orders, revenue, fulfillment, and inventory in one place" : "Garage, catalog, cart, and orders in one place"}
            </p>
          </div>
          {isAdmin ? (
            <NavLink
              to="/admin"
              className="focus-ring flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Settings size={17} />
              Business
            </NavLink>
          ) : (
            <NavLink
              to="/cart"
              className="focus-ring flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              <ShoppingCart size={17} />
              Cart
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs text-zinc-950">{count}</span>
            </NavLink>
          )}
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
