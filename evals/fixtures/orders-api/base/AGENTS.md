# orders-api

Small in-memory orders module (Node 20+, no dependencies). Read `README.md` for the API and rules.

- Test: `npm test` (node:test, files in `spec/`).
- Sensitive zones: organization isolation (`findOwned` and every `orgId` check in `src/orders.js`)
  and money (`src/money.js`). Nothing else is sensitive.
- Work on `main`, one commit per cause. Never push.
