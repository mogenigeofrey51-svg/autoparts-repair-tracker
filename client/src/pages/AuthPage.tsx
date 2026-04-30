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
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="p-2 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-700 p-3 text-white">
              <CarFront size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">AutoParts & Repair Tracker</p>
              <h1 className="text-3xl font-bold tracking-normal">Parts, repairs, and vehicles together</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Vehicles", "Keep plates, VINs, mileage, and notes organized."],
              ["Repairs", "Track costs, parts used, garage names, and service dates."],
              ["Parts", "Search stock by make, model, year, category, and keyword."]
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
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
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Email
              <input
                className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Password
              <input
                className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
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
                    className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Address
                  <input
                    className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                  />
                </label>
              </div>
            )}

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

            <button
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:bg-zinc-300"
              disabled={submitting}
              type="submit"
            >
              {mode === "login" ? <KeyRound size={18} /> : <UserPlus size={18} />}
              {submitting ? "Please wait" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            Admin seed login: <span className="font-semibold">admin@autoparts.test</span> /{" "}
            <span className="font-semibold">admin12345</span>
          </div>
        </section>
      </div>
    </main>
  );
}
