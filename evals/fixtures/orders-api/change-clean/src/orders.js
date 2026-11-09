import { orderTotal } from "./money.js";
import { byOldest } from "./sort.js";

// In-memory store. Every read and write is scoped to the caller's organization:
// an order from another organization behaves exactly like a missing one.
const orders = [];
let nextId = 1;

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function resetStore() {
  orders.length = 0;
  nextId = 1;
}

export function createOrder(orgId, { customer, createdAt, lines, discountPct = 0 }) {
  const order = { id: nextId++, orgId, customer, createdAt: new Date(createdAt), lines, discountPct, status: "open" };
  orders.push(order);
  return order;
}

function findOwned(orgId, id) {
  const order = orders.find((o) => o.id === id && o.orgId === orgId);
  if (!order) throw new NotFoundError(`order ${id} not found`);
  return order;
}

export function getOrder(orgId, id) {
  return findOwned(orgId, id);
}

export function updateCustomer(orgId, id, customer) {
  const order = findOwned(orgId, id);
  order.customer = customer;
  return order;
}

// Oldest first. `status`, when given, keeps only orders in that status.
export function listOrders(orgId, { status } = {}) {
  return orders
    .filter((o) => o.orgId === orgId && (status === undefined || o.status === status))
    .sort(byOldest);
}

export function orderTotalFor(orgId, id) {
  const order = findOwned(orgId, id);
  return orderTotal(order.lines, order.discountPct);
}
