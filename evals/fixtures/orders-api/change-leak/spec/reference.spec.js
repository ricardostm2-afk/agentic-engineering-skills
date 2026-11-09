import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetStore, createOrder, findByReference, NotFoundError } from "../src/orders.js";

beforeEach(() => resetStore());

test("finds an order by its invoice reference", () => {
  createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [], reference: "INV-2026-0042" });
  assert.equal(findByReference("acme", "INV-2026-0042").customer, "Ana");
});

test("an unknown reference is NotFound", () => {
  assert.throws(() => findByReference("acme", "INV-0000"), NotFoundError);
});
