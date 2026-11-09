// Orders are listed oldest first: a negative result puts `a` before `b`.
export function byOldest(a, b) {
  return a.createdAt - b.createdAt;
}
