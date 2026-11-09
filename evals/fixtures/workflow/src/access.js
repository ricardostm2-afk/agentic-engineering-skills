export function canRead(actorOrg, recordOrg) {
  return typeof actorOrg === 'string' && actorOrg.length > 0 && actorOrg === recordOrg;
}
