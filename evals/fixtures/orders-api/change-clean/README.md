# orders-api

In-memory orders module for a multi-organization back office. Node 20+, no dependencies.

## API (`src/orders.js`)

- `createOrder(orgId, { customer, createdAt, lines, discountPct })` creates an open order.
- `getOrder(orgId, id)` returns the organization's order.
- `updateCustomer(orgId, id, customer)` changes the order's customer.
- `listOrders(orgId, { status })` returns the organization's orders, **oldest first**; `status`
  is optional and keeps only orders in that status.
- `orderTotalFor(orgId, id)` returns the order total in cents.

## Rules

- An order from another organization behaves exactly like a missing one: `NotFoundError`.
- Money is integer cents. The discount applies once, to the subtotal, rounded half up (`src/money.js`).

## Test

```bash
npm test
```
