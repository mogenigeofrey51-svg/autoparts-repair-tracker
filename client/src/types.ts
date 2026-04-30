export type Role = "USER" | "ADMIN";
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vehicles?: number;
    orders?: number;
  };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: {
    products?: number;
  };
};

export type RepairRecord = {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  dateOfRepair: string;
  mileageAtRepair: number;
  partsUsed: string[];
  mechanicName: string;
  cost: number;
  receiptUrl?: string | null;
  nextServiceDate?: string | null;
};

export type Vehicle = {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vin: string;
  engineNumber: string;
  mileage: number;
  fuelType: string;
  transmissionType: string;
  notes?: string | null;
  repairs?: RepairRecord[];
  totalRepairCost?: number;
  user?: User;
};

export type Product = {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  brand: string;
  compatibleMakes: string[];
  compatibleModels: string[];
  compatibleYears: number[];
  price: number;
  stockQuantity: number;
  description: string;
  imageUrl?: string | null;
};

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  brand: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  shippingName: string;
  shippingPhone?: string | null;
  shippingAddress: string;
  mapUrl?: string;
  paidAt?: string | null;
  releasedAt?: string | null;
  items: OrderItem[];
  user?: User;
  createdAt: string;
  updatedAt: string;
};
