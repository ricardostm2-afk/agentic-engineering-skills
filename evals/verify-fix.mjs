#!/usr/bin/env node
// Independent final-state oracle for retained fix-case workspaces. It executes the supplied
// fixture code, not the agent's tests. This is a local check, NOT a native Claude grader and
// NOT proof of red-before-green ordering. Run the transcript rubric separately.
// Usage: node evals/verify-fix.mjs fix-sort-order|fix-isolation-class <workspace>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [caseName, workspace, ...extra] = process.argv.slice(2);
const cases = ["fix-sort-order", "fix-isolation-class"];
if (!cases.includes(caseName) || !workspace || extra.length) {
  console.error("Usage: node evals/verify-fix.mjs fix-sort-order|fix-isolation-class <workspace>");
  process.exitCode = 2;
} else {
  const checks = [];
  const check = (name, verify) => {
    try {
      verify();
      checks.push({ name, passed: true });
    } catch (error) {
      checks.push({ name, passed: false, error: error.message });
    }
  };
  try {
    const root = path.resolve(workspace);
    const orders = await import(pathToFileURL(path.join(root, "src", "orders.js")).href);
    const { createOrder, resetStore, getOrder, updateCustomer, orderTotalFor, listOrders, NotFoundError } = orders;

    if (caseName === "fix-sort-order") {
      const { byOldest } = await import(pathToFileURL(path.join(root, "src", "sort.js")).href);
      check("comparator returns negative, zero and positive numbers", () => {
        const old = { createdAt: new Date("2025-12-31") }, recent = { createdAt: new Date("2026-02-12") };
        assert.equal(typeof byOldest(old, recent), "number");
        assert.ok(byOldest(old, recent) < 0, "older order must compare before newer order");
        assert.ok(byOldest(old, { ...old }) === 0, "equal dates must compare as equal");
        assert.ok(byOldest(recent, old) > 0, "newer order must compare after older order");
      });
      const dates = { old: "2025-12-31", mid: "2026-02-01", recent: "2026-02-12" };
      for (const insertion of [
        ["old", "mid", "recent"], ["old", "recent", "mid"], ["mid", "old", "recent"],
        ["mid", "recent", "old"], ["recent", "old", "mid"], ["recent", "mid", "old"],
      ]) {
        check(`oldest first, organization scoped: ${insertion.join(",")}`, () => {
          resetStore();
          for (const customer of insertion) {
            createOrder("acme", { customer, createdAt: dates[customer], lines: [] });
            createOrder("globex", { customer: "other", createdAt: dates[customer], lines: [] });
          }
          assert.deepEqual(listOrders("acme").map((order) => order.customer), ["old", "mid", "recent"]);
          assert.equal(listOrders("globex").length, 3, "sorting must not remove other organizations' orders");
          assert.deepEqual(listOrders("missing"), []);
        });
      }
      check("empty, singleton and equal-date lists retain their orders", () => {
        resetStore();
        assert.deepEqual(listOrders("acme"), []);
        const first = createOrder("acme", { customer: "first", createdAt: dates.mid, lines: [] });
        assert.deepEqual(listOrders("acme").map((order) => order.id), [first.id]);
        const second = createOrder("acme", { customer: "second", createdAt: dates.mid, lines: [] });
        assert.deepEqual(listOrders("acme").map((order) => order.id).sort(), [first.id, second.id].sort());
      });
    } else {
      function seed() {
        resetStore();
        return [
          createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [{ unitCents: 333, qty: 3 }], discountPct: 10 }),
          createOrder("globex", { customer: "Bo", createdAt: "2026-02-02", lines: [{ unitCents: 250, qty: 2 }] }),
        ];
      }
      check("same-organization reads, updates and totals still work", () => {
        const own = seed();
        for (const [index, order] of own.entries()) {
          assert.equal(getOrder(order.orgId, order.id).customer, order.customer);
          assert.equal(orderTotalFor(order.orgId, order.id), [899, 500][index]);
          assert.equal(updateCustomer(order.orgId, order.id, "updated").customer, "updated");
          assert.equal(getOrder(order.orgId, order.id).customer, "updated");
        }
      });
      for (const caller of ["acme", "globex", "outsider"]) {
        for (const operation of ["getOrder", "updateCustomer", "orderTotalFor"]) {
          check(`${operation} denies ${caller} access to another organization's order without mutation`, () => {
            const own = seed();
            const target = own.find((order) => order.orgId !== caller);
            const original = getOrder(target.orgId, target.id).customer;
            assert.equal(typeof NotFoundError, "function", "NotFoundError must remain exported");
            assert.throws(() => orders[operation](caller, target.id, "unauthorized"), NotFoundError);
            assert.equal(getOrder(target.orgId, target.id).customer, original, "denied update must not mutate its target");
          });
        }
      }
      check("missing IDs remain NotFoundError for reads, writes and totals", () => {
        seed();
        for (const operation of ["getOrder", "updateCustomer", "orderTotalFor"]) {
          assert.throws(() => orders[operation]("acme", 9999, "missing"), NotFoundError);
        }
      });
      check("lists remain scoped to each organization", () => {
        const own = seed();
        for (const order of own) assert.deepEqual(listOrders(order.orgId).map((value) => value.id), [order.id]);
        assert.deepEqual(listOrders("outsider"), []);
      });
    }
  } catch (error) {
    checks.push({ name: "load and execute fixture", passed: false, error: error.message });
  }
  const passed = checks.length > 0 && checks.every((check) => check.passed);
  console.log(JSON.stringify({ schemaVersion: 1, caseName, passed, checks }, null, 2));
  process.exitCode = passed ? 0 : 1;
}
