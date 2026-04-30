import { MapPin, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { AddressAutocomplete } from "../components/AddressAutocomplete";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";
import { googleMapsSearchUrl } from "../utils/maps";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    addressLatitude: user?.addressLatitude ?? null,
    addressLongitude: user?.addressLongitude ?? null
  });
  const [notice, setNotice] = useState("");
  const mapUrl = googleMapsSearchUrl(form.address, form.addressLatitude, form.addressLongitude);

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      addressLatitude: user?.addressLatitude ?? null,
      addressLongitude: user?.addressLongitude ?? null
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
          <AddressAutocomplete
            label="Delivery address"
            value={{
              address: form.address ?? "",
              latitude: form.addressLatitude,
              longitude: form.addressLongitude
            }}
            onChange={(location) =>
              setForm({
                ...form,
                address: location.address,
                addressLatitude: location.latitude ?? null,
                addressLongitude: location.longitude ?? null
              })
            }
          />
          {form.addressLatitude && form.addressLongitude && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              Map pin saved: {form.addressLatitude.toFixed(5)}, {form.addressLongitude.toFixed(5)}
            </p>
          )}
          {mapUrl && (
            <a className="secondary-action w-fit px-3 py-1.5" href={mapUrl} target="_blank" rel="noreferrer">
              <MapPin size={15} />
              Open address in Google Maps
            </a>
          )}
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
