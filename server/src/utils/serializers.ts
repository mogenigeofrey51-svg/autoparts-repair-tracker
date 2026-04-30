type Entity = Record<string, any>;

const money = (value: unknown) => Number(value);

export function publicUser(user: Entity) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function serializeRepair(repair: Entity) {
  return {
    ...repair,
    cost: money(repair.cost)
  };
}

export function serializeVehicle(vehicle: Entity) {
  const repairs = vehicle.repairs?.map(serializeRepair);
  const totalRepairCost = repairs?.reduce((sum: number, repair: Entity) => sum + Number(repair.cost), 0) ?? 0;
  return {
    ...vehicle,
    repairs,
    totalRepairCost
  };
}

export function serializeProduct(product: Entity) {
  return {
    ...product,
    price: money(product.price)
  };
}

export function serializeCartItem(item: Entity) {
  return {
    ...item,
    product: item.product ? serializeProduct(item.product) : undefined
  };
}

export function serializeOrderItem(item: Entity) {
  return {
    ...item,
    unitPrice: money(item.unitPrice)
  };
}

export function serializeOrder(order: Entity) {
  return {
    ...order,
    total: money(order.total),
    mapUrl: order.shippingAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`
      : undefined,
    items: order.items?.map(serializeOrderItem),
    user: order.user ? publicUser(order.user) : undefined
  };
}
