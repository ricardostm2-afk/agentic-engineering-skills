# Task list

`src/labels.js` exports `statusLabel(status)`: known statuses have a display label, unknown statuses
display `Unknown`. `src/access.js` exports `canRead(actorOrg, recordOrg)`; organization identity must
match. `web/index.html` shows a static toolbar using the spacing tokens in `web/styles.css`.

Run `npm test`. This fixture has no dependencies, backend, database, paid services or deployment.
