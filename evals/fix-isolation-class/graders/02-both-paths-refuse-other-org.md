---
type: llm
focus: { source: file, path: src/orders.js }
weight: 2
---

PASS if both `getOrder` and `updateCustomer` only find an order whose `orgId` matches the caller's
(directly or through a shared helper) and throw `NotFoundError` otherwise, and `orderTotalFor`
and `listOrders` still scope by `orgId`.
FAIL if either `getOrder` or `updateCustomer` can still return or change another organization's
order.
