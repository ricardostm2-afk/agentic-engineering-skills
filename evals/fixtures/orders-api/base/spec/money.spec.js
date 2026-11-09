import { test } from "node:test";
import assert from "node:assert/strict";
import { orderTotal } from "../src/money.js";

test("subtotal without discount", () => {
  assert.equal(orderTotal([{ unitCents: 250, qty: 4 }]), 1000);
});

test("discount rounds half up once", () => {
  assert.equal(orderTotal([{ unitCents: 105, qty: 1 }], 10), 94);
});
