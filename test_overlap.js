function getShiftInterval(startMins, endMins) {
  let effectiveEnd = endMins;
  if (effectiveEnd <= startMins) {
    effectiveEnd += 1440;
  }
  return { start: startMins, end: effectiveEnd };
}

const a = getShiftInterval(6*60 + 20, 13*60 + 15);
const b = getShiftInterval(13*60 + 25, 20*60 + 25);

console.log("a", a);
console.log("b", b);
console.log("overlaps", a.start < b.end && a.end > b.start);
