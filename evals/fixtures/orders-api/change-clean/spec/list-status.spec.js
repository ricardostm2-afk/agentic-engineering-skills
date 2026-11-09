import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetStore, createOrder, listOrders } from "../src/orders.js";

beforeEach(() => resetStore());

test("status filter keeps only orders in that status", () => {
  const open = createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [] });
  const closed = createOrder("acme", { customer: "Bo", createdAt: "2026-02-02", lines: [] });
  closed.status = "closed";
  assert.deepEqual(listOrders("acme", { status: "open" }).map((o) => o.id), [open.id]);
});

test("status filter stays inside the organization", () => {
  createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [] });
  createOrder("globex", { customer: "Bo", createdAt: "2026-02-02", lines: [] });
  assert.deepEqual(listOrders("acme", { status: "open" }).map((o) => o.customer), ["Ana"]);
});

test("without a filter every order of the organization is listed, oldest first", () => {
  createOrder("acme", { customer: "Late", createdAt: "2026-02-03", lines: [] });
  createOrder("acme", { customer: "Early", createdAt: "2026-02-01", lines: [] });
  assert.deepEqual(listOrders("acme").map((o) => o.customer), ["Early", "Late"]);
});
