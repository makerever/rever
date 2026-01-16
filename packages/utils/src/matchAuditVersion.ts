// Checks whether a value is a primitive (null, undefined, string, number, boolean, symbol)
const isPrimitive = (val: any) =>
  val === null || typeof val !== "object";

// Keys that should be ignored during comparison
const IGNORED_KEYS = new Set(["created_at", "updated_at"]);

// Maximum depth allowed for deep comparison
const MAX_DEPTH = 5;

export function deepMatchAuditVersion(
  a: any,
  b: any,
  depth = 0
): any {
  // Stop recursion once maximum depth is reached
  // Returning true means deeper differences are ignored
  if (depth >= MAX_DEPTH) {
    return true;
  }

  // Primitive value comparison (leaf nodes)
  // Uses Object.is to handle edge cases like NaN
  if (isPrimitive(a) || isPrimitive(b)) {
    return Object.is(a, b);
  }

  // Array comparison
  // Ensures both values are arrays and compares index-wise
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;

    const maxLength = Math.max(a.length, b.length);

    return Array.from({ length: maxLength }, (_, i) =>
      deepMatchAuditVersion(a[i], b[i], depth + 1)
    );
  }

  // Object comparison
  // Merges keys from both objects and compares each recursively
  const result: Record<string, any> = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);

  keys.forEach((key) => {
    // Skip ignored timestamp fields
    if (IGNORED_KEYS.has(key)) return;

    result[key] = deepMatchAuditVersion(
      a?.[key],
      b?.[key],
      depth + 1
    );
  });

  // Returns a structure mirroring the input
  // with boolean values at leaf nodes
  return result;
}
