const labels = Object.assign(Object.create(null), { open: 'Open', closed: 'Closed' });
export function statusLabel(status) { return labels[status] ?? 'Unknown'; }
