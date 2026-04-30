import { Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? ""
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? ""
    });
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    await api<User>("/users/profile", { method: "PATCH", body: form });
    await refreshUser();
    setNotice("Profile saved.");
  }

  return (
    <div>
      <PageHeader title="Profile" description="Keep contact and delivery details current for orders and repair records." />
      <form className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={saveProfile}>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Name
            <input
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-500" value={user?.email ?? ""} disabled />
          </label>
          <label className="block text-sm font-medium">
            Phone number
            <input
              className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={form.phone ?? ""}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium">
            Address
            <textarea
              className="focus-ring mt-1 min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={form.address ?? ""}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" type="submit">
            <Save size={17} />
            Save profile
          </button>
          {notice && <p className="text-sm font-medium text-emerald-700">{notice}</p>}
        </div>
      </form>
    </div>
  );
}
