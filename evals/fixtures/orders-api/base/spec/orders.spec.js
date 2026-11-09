import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetStore, createOrder, getOrder, listOrders, updateCustomer, orderTotalFor, NotFoundError } from "../src/orders.js";

const line = (unitCents, qty) => ({ unitCents, qty });
beforeEach(() => resetStore());

test("an organization reads its own order", () => {
  const order = createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [line(1000, 1)] });
  assert.equal(getOrder("acme", order.id).customer, "Ana");
});

test("a missing order is NotFound", () => {
  assert.throws(() => getOrder("acme", 99), NotFoundError);
});

test("list returns only the organization's orders", () => {
  createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [] });
  createOrder("globex", { customer: "Bo", createdAt: "2026-02-02", lines: [] });
  assert.deepEqual(listOrders("acme").map((o) => o.customer), ["Ana"]);
});

test("updateCustomer changes the customer", () => {
  const order = createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [] });
  assert.equal(updateCustomer("acme", order.id, "Rui").customer, "Rui");
});

test("total applies the discount to the subtotal", () => {
  const order = createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [line(333, 3)], discountPct: 10 });
  assert.equal(orderTotalFor("acme", order.id), 899);
});
