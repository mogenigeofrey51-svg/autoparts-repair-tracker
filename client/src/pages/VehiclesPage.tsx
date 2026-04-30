import { Car, Pencil, Plus, Save, Trash2, Wrench } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import type { RepairRecord, Vehicle } from "../types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const emptyVehicleForm = {
  make: "",
  model: "",
  year: "",
  registrationNumber: "",
  vin: "",
  engineNumber: "",
  mileage: "",
  fuelType: "Petrol",
  transmissionType: "Automatic",
  notes: ""
};

const emptyRepairForm = {
  title: "",
  description: "",
  dateOfRepair: new Date().toISOString().slice(0, 10),
  mileageAtRepair: "",
  partsUsed: "",
  mechanicName: "",
  cost: "",
  receiptUrl: "",
  nextServiceDate: ""
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [repairForm, setRepairForm] = useState(emptyRepairForm);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedId) ?? vehicles[0],
    [vehicles, selectedId]
  );

  async function loadVehicles() {
    setLoading(true);
    try {
      const data = await api<Vehicle[]>("/vehicles");
      setVehicles(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicles();
  }, []);

  function startEdit(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      registrationNumber: vehicle.registrationNumber,
      vin: vehicle.vin,
      engineNumber: vehicle.engineNumber,
      mileage: String(vehicle.mileage),
      fuelType: vehicle.fuelType,
      transmissionType: vehicle.transmissionType,
      notes: vehicle.notes ?? ""
    });
  }

  function resetVehicleForm() {
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
  }

  async function saveVehicle(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const payload = {
      ...vehicleForm,
      year: Number(vehicleForm.year),
      mileage: Number(vehicleForm.mileage)
    };
    const saved = editingVehicleId
      ? await api<Vehicle>(`/vehicles/${editingVehicleId}`, { method: "PATCH", body: payload })
      : await api<Vehicle>("/vehicles", { method: "POST", body: payload });
    await loadVehicles();
    setSelectedId(saved.id);
    resetVehicleForm();
    setNotice(editingVehicleId ? "Vehicle updated." : "Vehicle added.");
  }

  async function deleteVehicle(vehicleId: string) {
    await api(`/vehicles/${vehicleId}`, { method: "DELETE" });
    if (selectedId === vehicleId) {
      setSelectedId("");
    }
    await loadVehicles();
  }

  async function saveRepair(event: FormEvent) {
    event.preventDefault();
    if (!selectedVehicle) return;
    const payload = {
      ...repairForm,
      mileageAtRepair: Number(repairForm.mileageAtRepair),
      cost: Number(repairForm.cost),
      partsUsed: repairForm.partsUsed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      nextServiceDate: repairForm.nextServiceDate || null
    };
    await api<RepairRecord>(`/vehicles/${selectedVehicle.id}/repairs`, { method: "POST", body: payload });
    setRepairForm(emptyRepairForm);
    await loadVehicles();
    setSelectedId(selectedVehicle.id);
  }

  async function deleteRepair(repairId: string) {
    await api(`/vehicles/repairs/${repairId}`, { method: "DELETE" });
    await loadVehicles();
  }

  const repairs = [...(selectedVehicle?.repairs ?? [])].sort(
    (a, b) => Date.parse(b.dateOfRepair) - Date.parse(a.dateOfRepair)
  );

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage every vehicle, then build a repair timeline with costs, parts, garages, and next service dates."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-6">
          <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={saveVehicle}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingVehicleId ? "Edit vehicle" : "Add vehicle"}</h3>
              {editingVehicleId && (
                <button className="focus-ring rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold" onClick={resetVehicleForm} type="button">
                  Cancel
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["make", "Make"],
                ["model", "Model"],
                ["year", "Year"],
                ["registrationNumber", "Plate number"],
                ["vin", "Chassis number / VIN"],
                ["engineNumber", "Engine number"],
                ["mileage", "Mileage"]
              ].map(([key, label]) => (
                <label key={key} className="block text-sm font-medium">
                  {label}
                  <input
                    className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                    value={vehicleForm[key as keyof typeof vehicleForm]}
                    onChange={(event) => setVehicleForm({ ...vehicleForm, [key]: event.target.value })}
                    required
                  />
                </label>
              ))}
              <label className="block text-sm font-medium">
                Fuel type
                <select
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={vehicleForm.fuelType}
                  onChange={(event) => setVehicleForm({ ...vehicleForm, fuelType: event.target.value })}
                >
                  {["Petrol", "Diesel", "Hybrid", "Electric", "LPG"].map((fuel) => (
                    <option key={fuel}>{fuel}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Transmission
                <select
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={vehicleForm.transmissionType}
                  onChange={(event) => setVehicleForm({ ...vehicleForm, transmissionType: event.target.value })}
                >
                  {["Manual", "Automatic", "CVT"].map((transmission) => (
                    <option key={transmission}>{transmission}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                Notes
                <textarea
                  className="focus-ring mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={vehicleForm.notes}
                  onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })}
                />
              </label>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" type="submit">
                {editingVehicleId ? <Save size={17} /> : <Plus size={17} />}
                {editingVehicleId ? "Save vehicle" : "Add vehicle"}
              </button>
              {notice && <p className="text-sm font-medium text-emerald-700">{notice}</p>}
            </div>
          </form>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Garage</h3>
            <div className="mt-4 space-y-3">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  className={`focus-ring w-full rounded-md border p-3 text-left ${
                    selectedVehicle?.id === vehicle.id ? "border-emerald-700 bg-emerald-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                  onClick={() => setSelectedId(vehicle.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {vehicle.registrationNumber} - {vehicle.mileage.toLocaleString()} km
                      </p>
                    </div>
                    <Car size={18} className="text-emerald-700" />
                  </div>
                </button>
              ))}
              {!vehicles.length && !loading && <p className="text-sm text-zinc-500">No vehicles added yet.</p>}
            </div>
          </section>
        </section>

        <section className="space-y-6">
          {!selectedVehicle ? (
            <EmptyState title="No vehicle selected" body="Add a vehicle to start tracking repairs and service costs." />
          ) : (
            <>
              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{selectedVehicle.registrationNumber}</p>
                    <h3 className="mt-1 text-2xl font-bold">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      VIN {selectedVehicle.vin} - Engine {selectedVehicle.engineNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="focus-ring rounded-md border border-zinc-300 p-2 text-zinc-700"
                      onClick={() => startEdit(selectedVehicle)}
                      title="Edit vehicle"
                      type="button"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="focus-ring rounded-md border border-red-200 p-2 text-red-700"
                      onClick={() => void deleteVehicle(selectedVehicle.id)}
                      title="Delete vehicle"
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Fuel</p>
                    <p className="font-bold">{selectedVehicle.fuelType}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Transmission</p>
                    <p className="font-bold">{selectedVehicle.transmissionType}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Repair total</p>
                    <p className="font-bold">{currency.format(selectedVehicle.totalRepairCost ?? 0)}</p>
                  </div>
                </div>
                {selectedVehicle.notes && <p className="mt-4 text-sm text-zinc-600">{selectedVehicle.notes}</p>}
              </section>

              <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={saveRepair}>
                <div className="mb-4 flex items-center gap-2">
                  <Wrench size={18} className="text-emerald-700" />
                  <h3 className="text-lg font-bold">Add repair record</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Repair title
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.title}
                      onChange={(event) => setRepairForm({ ...repairForm, title: event.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Date of repair
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      type="date"
                      value={repairForm.dateOfRepair}
                      onChange={(event) => setRepairForm({ ...repairForm, dateOfRepair: event.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Mileage at repair
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.mileageAtRepair}
                      onChange={(event) => setRepairForm({ ...repairForm, mileageAtRepair: event.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Cost
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.cost}
                      onChange={(event) => setRepairForm({ ...repairForm, cost: event.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Mechanic / garage
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.mechanicName}
                      onChange={(event) => setRepairForm({ ...repairForm, mechanicName: event.target.value })}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Next service date
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      type="date"
                      value={repairForm.nextServiceDate}
                      onChange={(event) => setRepairForm({ ...repairForm, nextServiceDate: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Parts used
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.partsUsed}
                      onChange={(event) => setRepairForm({ ...repairForm, partsUsed: event.target.value })}
                      placeholder="Oil Filter Z418, 5W-30 oil"
                    />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Receipt upload placeholder
                    <input
                      className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.receiptUrl}
                      onChange={(event) => setRepairForm({ ...repairForm, receiptUrl: event.target.value })}
                      placeholder="Future file upload URL"
                    />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Description
                    <textarea
                      className="focus-ring mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
                      value={repairForm.description}
                      onChange={(event) => setRepairForm({ ...repairForm, description: event.target.value })}
                      required
                    />
                  </label>
                </div>
                <button className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" type="submit">
                  <Plus size={17} />
                  Add repair
                </button>
              </form>

              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold">Repair timeline</h3>
                {repairs.length ? (
                  <div className="mt-5 space-y-5">
                    {repairs.map((repair) => (
                      <div key={repair.id} className="border-l-2 border-emerald-700 pl-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{repair.title}</p>
                            <p className="text-sm text-zinc-500">
                              {new Date(repair.dateOfRepair).toLocaleDateString()} - {repair.mileageAtRepair.toLocaleString()} km
                            </p>
                          </div>
                          <button
                            className="focus-ring rounded-md border border-red-200 p-2 text-red-700"
                            onClick={() => void deleteRepair(repair.id)}
                            title="Delete repair"
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600">{repair.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-md bg-zinc-100 px-2 py-1">{repair.mechanicName}</span>
                          <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">{currency.format(repair.cost)}</span>
                          {repair.nextServiceDate && (
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                              Next {new Date(repair.nextServiceDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {repair.partsUsed.length > 0 && (
                          <p className="mt-2 text-sm text-zinc-500">Parts: {repair.partsUsed.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">No repair records for this vehicle yet.</p>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
