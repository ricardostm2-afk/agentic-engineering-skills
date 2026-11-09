// Amounts are integer cents. The discount applies once, to the subtotal, rounded half up.
export function orderTotal(lines, discountPct = 0) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitCents * line.qty, 0);
  return subtotal - Math.round((subtotal * discountPct) / 100);
}
