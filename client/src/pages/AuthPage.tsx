import { CarFront, KeyRound, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "customer@autoparts.test",
    password: "password123",
    phone: "",
    address: ""
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await signup(form);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not authenticate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-lg bg-zinc-950 p-6 text-white shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 p-3 text-emerald-300">
              <CarFront size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Ride254</p>
              <h1 className="text-3xl font-bold tracking-normal text-white">Parts, repairs, and vehicles together</h1>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300">
            A practical workspace for owners who want their vehicle records, service history, and spare-parts orders in one place.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Vehicles", "Keep plates, VINs, mileage, and notes organized."],
              ["Repairs", "Track costs, parts used, garage names, and service dates."],
              ["Parts", "Search stock by make, model, year, category, and keyword."]
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel-strong p-6">
          <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1">
            <button
              className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${
                mode === "login" ? "bg-white shadow-sm" : "text-zinc-500"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Log in
            </button>
            <button
              className={`focus-ring rounded-md px-3 py-2 text-sm font-semibold ${
                mode === "signup" ? "bg-white shadow-sm" : "text-zinc-500"
              }`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {mode === "signup" && (
              <label className="block text-sm font-medium">
                Name
                <input
                  className="field-control"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Email
              <input
                className="field-control"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Password
              <input
                className="field-control"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>

            {mode === "signup" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Phone
                  <input
                    className="field-control"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Address
                  <input
                    className="field-control"
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                  />
                </label>
              </div>
            )}

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

            <button
              className="primary-action w-full py-2.5"
              disabled={submitting}
              type="submit"
            >
              {mode === "login" ? <KeyRound size={18} /> : <UserPlus size={18} />}
              {submitting ? "Please wait" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Admin seed login: <span className="font-semibold">admin@autoparts.test</span> /{" "}
            <span className="font-semibold">admin12345</span>
          </div>
        </section>
      </div>
    </main>
  );
}
