import { ClipboardCheck, CreditCard, Edit, MapPin, PackageCheck, PackageOpen, Plus, Save, Trash2, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import type { Category, Order, OrderStatus, PaymentStatus, Product, RepairRecord, User, Vehicle } from "../types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const tabs = ["Overview", "Orders", "Products", "Categories", "Users", "Vehicles", "Repairs"] as const;
type Tab = (typeof tabs)[number];
type AdminRepair = RepairRecord & { vehicle: Vehicle };

const emptyProductForm = {
  categoryId: "",
  name: "",
  brand: "",
  compatibleMakes: "",
  compatibleModels: "",
  compatibleYears: "",
  price: "",
  stockQuantity: "",
  description: "",
  imageUrl: ""
};

const emptyCategoryForm = {
  name: "",
  slug: "",
  description: ""
};

function listFromText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [repairs, setRepairs] = useState<AdminRepair[]>([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function loadAdminData() {
    const [productData, categoryData, userData, orderData, vehicleData, repairData] = await Promise.all([
      api<Product[]>("/admin/products"),
      api<Category[]>("/categories"),
      api<User[]>("/admin/users"),
      api<Order[]>("/admin/orders"),
      api<Vehicle[]>("/admin/vehicles"),
      api<AdminRepair[]>("/admin/repairs")
    ]);
    setProducts(productData);
    setCategories(categoryData);
    setUsers(userData);
    setOrders(orderData);
    setVehicles(vehicleData);
    setRepairs(repairData);
    if (!productForm.categoryId && categoryData[0]) {
      setProductForm((current) => ({ ...current, categoryId: categoryData[0].id }));
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  const productPayload = useMemo(
    () => ({
      categoryId: productForm.categoryId,
      name: productForm.name,
      brand: productForm.brand,
      compatibleMakes: listFromText(productForm.compatibleMakes),
      compatibleModels: listFromText(productForm.compatibleModels),
      compatibleYears: listFromText(productForm.compatibleYears).map(Number).filter(Number.isFinite),
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity),
      description: productForm.description,
      imageUrl: productForm.imageUrl
    }),
    [productForm]
  );

  const orderMetrics = useMemo(() => {
    const openOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
    const completedOrders = orders.filter((order) => order.status === "DELIVERED");
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const readyToRelease = orders.filter(
      (order) => order.paymentStatus === "PAID" && !order.releasedAt && !["DELIVERED", "CANCELLED"].includes(order.status)
    );
    const pendingPayment = orders.filter((order) => order.paymentStatus === "UNPAID" && order.status !== "CANCELLED");
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      openOrders,
      completedOrders,
      paidOrders,
      readyToRelease,
      pendingPayment,
      paidRevenue,
      completedRevenue
    };
  }, [orders]);

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    if (editingProductId) {
      await api<Product>(`/admin/products/${editingProductId}`, { method: "PATCH", body: productPayload });
      setNotice("Product updated.");
    } else {
      await api<Product>("/admin/products", { method: "POST", body: productPayload });
      setNotice("Product added.");
    }
    setProductForm({ ...emptyProductForm, categoryId: categories[0]?.id ?? "" });
    setEditingProductId(null);
    await loadAdminData();
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      categoryId: product.categoryId,
      name: product.name,
      brand: product.brand,
      compatibleMakes: product.compatibleMakes.join(", "),
      compatibleModels: product.compatibleModels.join(", "),
      compatibleYears: product.compatibleYears.join(", "),
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      description: product.description,
      imageUrl: product.imageUrl ?? ""
    });
    setActiveTab("Products");
  }

  async function deleteProduct(productId: string) {
    await api(`/admin/products/${productId}`, { method: "DELETE" });
    await loadAdminData();
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (editingCategoryId) {
      await api<Category>(`/admin/categories/${editingCategoryId}`, { method: "PATCH", body: categoryForm });
      setNotice("Category updated.");
    } else {
      await api<Category>("/admin/categories", { method: "POST", body: categoryForm });
      setNotice("Category added.");
    }
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
    await loadAdminData();
  }

  function editCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? ""
    });
    setActiveTab("Categories");
  }

  async function deleteCategory(categoryId: string) {
    await api(`/admin/categories/${categoryId}`, { method: "DELETE" });
    await loadAdminData();
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await api<Order>(`/admin/orders/${orderId}/status`, { method: "PATCH", body: { status } });
    await loadAdminData();
  }

  async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    await api<Order>(`/admin/orders/${orderId}/payment`, { method: "PATCH", body: { paymentStatus } });
    setNotice(paymentStatus === "PAID" ? "Order marked as paid." : "Payment status updated.");
    await loadAdminData();
  }

  async function releaseOrder(orderId: string) {
    await api<Order>(`/admin/orders/${orderId}/release`, { method: "POST" });
    setNotice("Paid order released for fulfillment.");
    await loadAdminData();
  }

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Business operations for paid orders, release workflow, fulfillment, inventory, customers, vehicles, and repair records."
      />

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`focus-ring whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold ${
              activeTab === tab ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white text-zinc-700"
            }`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p>}

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open orders"
              value={String(orderMetrics.openOrders.length)}
              detail="Pending, processing, or shipped"
              icon={<PackageOpen size={20} />}
            />
            <StatCard
              label="Ready to release"
              value={String(orderMetrics.readyToRelease.length)}
              detail="Paid orders waiting for release"
              icon={<Truck size={20} />}
            />
            <StatCard
              label="Completed orders"
              value={String(orderMetrics.completedOrders.length)}
              detail={currency.format(orderMetrics.completedRevenue)}
              icon={<ClipboardCheck size={20} />}
            />
            <StatCard
              label="Paid revenue"
              value={currency.format(orderMetrics.paidRevenue)}
              detail={`${orderMetrics.pendingPayment.length} unpaid order${orderMetrics.pendingPayment.length === 1 ? "" : "s"}`}
              icon={<CreditCard size={20} />}
            />
          </div>

          <section className="app-panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">Paid orders awaiting release</h3>
                <p className="mt-1 text-sm text-zinc-500">Release paid orders so the fulfillment team can process them.</p>
              </div>
              <button className="secondary-action" onClick={() => setActiveTab("Orders")} type="button">
                View all orders
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {orderMetrics.readyToRelease.length ? (
                orderMetrics.readyToRelease.slice(0, 5).map((order) => (
                  <div key={order.id} className="rounded-md border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-bold">#{order.id.slice(-8).toUpperCase()} - {currency.format(order.total)}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {order.user?.email} - {order.items.length} item{order.items.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">{order.shippingAddress}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.mapUrl && (
                          <a className="secondary-action px-3" href={order.mapUrl} target="_blank" rel="noreferrer">
                            <MapPin size={15} />
                            Map
                          </a>
                        )}
                        <button className="primary-action px-3" onClick={() => void releaseOrder(order.id)} type="button">
                          <PackageCheck size={15} />
                          Release
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                  No paid orders are waiting for release.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "Products" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={saveProduct}>
            <h3 className="text-lg font-bold">{editingProductId ? "Edit product" : "Add product"}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                Category
                <select
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={productForm.categoryId}
                  onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["name", "Name"],
                ["brand", "Brand"],
                ["price", "Price"],
                ["stockQuantity", "Stock quantity"],
                ["compatibleMakes", "Compatible makes"],
                ["compatibleModels", "Compatible models"],
                ["compatibleYears", "Compatible years"],
                ["imageUrl", "Image placeholder URL"]
              ].map(([key, label]) => (
                <label key={key} className="block text-sm font-medium">
                  {label}
                  <input
                    className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                    value={productForm[key as keyof typeof productForm]}
                    onChange={(event) => setProductForm({ ...productForm, [key]: event.target.value })}
                    required={!["imageUrl"].includes(key)}
                  />
                </label>
              ))}
              <label className="block text-sm font-medium sm:col-span-2">
                Description
                <textarea
                  className="focus-ring mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={productForm.description}
                  onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" type="submit">
                {editingProductId ? <Save size={17} /> : <Plus size={17} />}
                {editingProductId ? "Save" : "Add"}
              </button>
              {editingProductId && (
                <button
                  className="focus-ring rounded-md border border-zinc-300 px-4 py-2 font-semibold"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({ ...emptyProductForm, categoryId: categories[0]?.id ?? "" });
                  }}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Products</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2">Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="py-3 font-medium">{product.name}</td>
                      <td>{product.category?.name}</td>
                      <td>{currency.format(product.price)}</td>
                      <td>{product.stockQuantity}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="focus-ring rounded-md border border-zinc-300 p-2" onClick={() => editProduct(product)} title="Edit product" type="button">
                            <Edit size={15} />
                          </button>
                          <button className="focus-ring rounded-md border border-red-200 p-2 text-red-700" onClick={() => void deleteProduct(product.id)} title="Delete product" type="button">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "Categories" && (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={saveCategory}>
            <h3 className="text-lg font-bold">{editingCategoryId ? "Edit category" : "Add category"}</h3>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Name
                <input
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Slug
                <input
                  className="focus-ring mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={categoryForm.slug}
                  onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="focus-ring mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                />
              </label>
            </div>
            <button className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" type="submit">
              {editingCategoryId ? <Save size={17} /> : <Plus size={17} />}
              {editingCategoryId ? "Save category" : "Add category"}
            </button>
          </form>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Categories</h3>
            <div className="mt-4 divide-y divide-zinc-100">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-zinc-500">
                      {category.slug} - {category._count?.products ?? 0} products
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="focus-ring rounded-md border border-zinc-300 p-2" onClick={() => editCategory(category)} title="Edit category" type="button">
                      <Edit size={15} />
                    </button>
                    <button className="focus-ring rounded-md border border-red-200 p-2 text-red-700" onClick={() => void deleteCategory(category.id)} title="Delete category" type="button">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "Users" && (
        <AdminTable
          headers={["Name", "Email", "Role", "Vehicles", "Orders"]}
          rows={users.map((user) => [user.name, user.email, user.role, String(user._count?.vehicles ?? 0), String(user._count?.orders ?? 0)])}
        />
      )}

      {activeTab === "Orders" && (
        <section className="app-panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">Orders</h3>
              <p className="mt-1 text-sm text-zinc-500">Confirm payments, release paid orders, update fulfillment, and open delivery locations.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">{orderMetrics.paidOrders.length} paid</span>
              <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">{orderMetrics.pendingPayment.length} unpaid</span>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Order</th>
                  <th>User</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Release</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-medium">#{order.id.slice(-8).toUpperCase()}</td>
                    <td>{order.user?.email}</td>
                    <td>{currency.format(order.total)}</td>
                    <td>{order.items.length}</td>
                    <td>
                      <select
                        className="focus-ring rounded-md border border-zinc-300 px-3 py-2"
                        value={order.paymentStatus}
                        onChange={(event) => void updatePaymentStatus(order.id, event.target.value as PaymentStatus)}
                      >
                        {["UNPAID", "PAID", "REFUNDED"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="focus-ring rounded-md border border-zinc-300 px-3 py-2"
                        value={order.status}
                        onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus)}
                      >
                        {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {order.mapUrl ? (
                        <a className="secondary-action px-3 py-1.5" href={order.mapUrl} target="_blank" rel="noreferrer">
                          <MapPin size={15} />
                          Map
                        </a>
                      ) : (
                        <span className="text-zinc-400">No address</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="primary-action px-3 py-1.5 disabled:bg-zinc-300"
                        disabled={
                          order.paymentStatus !== "PAID" ||
                          Boolean(order.releasedAt) ||
                          ["CANCELLED", "DELIVERED"].includes(order.status)
                        }
                        onClick={() => void releaseOrder(order.id)}
                        type="button"
                      >
                        <PackageCheck size={15} />
                        {order.releasedAt ? "Released" : "Release"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "Vehicles" && (
        <AdminTable
          headers={["Owner", "Vehicle", "Plate", "VIN", "Mileage", "Repairs"]}
          rows={vehicles.map((vehicle) => [
            vehicle.user?.email ?? "",
            `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle.registrationNumber,
            vehicle.vin,
            vehicle.mileage.toLocaleString(),
            String(vehicle.repairs?.length ?? 0)
          ])}
        />
      )}

      {activeTab === "Repairs" && (
        <AdminTable
          headers={["Vehicle", "Owner", "Repair", "Garage", "Cost", "Date"]}
          rows={repairs.map((repair) => [
            `${repair.vehicle.year} ${repair.vehicle.make} ${repair.vehicle.model}`,
            repair.vehicle.user?.email ?? "",
            repair.title,
            repair.mechanicName,
            currency.format(repair.cost),
            new Date(repair.dateOfRepair).toLocaleDateString()
          ])}
        />
      )}
    </div>
  );
}

function AdminTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row, rowIndex) => (
              <tr key={row.join("-") || rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className={cellIndex === 0 ? "py-3 font-medium" : "py-3"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
