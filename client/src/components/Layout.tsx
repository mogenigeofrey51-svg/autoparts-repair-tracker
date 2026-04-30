import {
  Car,
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

export function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const navItems = user?.role === "ADMIN" ? [...baseNav, { to: "/admin", label: "Admin", icon: Settings }] : baseNav;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-200 bg-white px-4 py-5 shadow-soft transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">AutoParts</p>
            <h1 className="text-xl font-bold">Repair Tracker</h1>
          </div>
          <button
            className="focus-ring rounded-md p-2 text-zinc-600 lg:hidden"
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
                  isActive ? "bg-emerald-700 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 border-t border-zinc-200 pt-4">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          <button
            className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-zinc-100/90 px-4 backdrop-blur sm:px-6">
          <button
            className="focus-ring rounded-md p-2 text-zinc-700 lg:hidden"
            onClick={() => setOpen(true)}
            title="Open menu"
            type="button"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-zinc-500">Garage, catalog, cart, and orders in one place</p>
          </div>
          <NavLink
            to="/cart"
            className="focus-ring flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
          >
            <ShoppingCart size={17} />
            Cart
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs text-zinc-950">{count}</span>
          </NavLink>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
