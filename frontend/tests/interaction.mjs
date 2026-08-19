function cloneAndFreeze(value, ancestors = new WeakSet()) {
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) {
    throw new TypeError("Interaction evidence details must not contain cycles.");
  }
  ancestors.add(value);
  const clone = Array.isArray(value) ? [] : {};
  for (const [key, item] of Object.entries(value)) {
    clone[key] = cloneAndFreeze(item, ancestors);
  }
  ancestors.delete(value);
  return Object.freeze(clone);
}

function namedEntry(name, details) {
  const entry = { name: String(name ?? "") };
  if (details !== undefined) entry.details = cloneAndFreeze(details);
  return Object.freeze(entry);
}

/**
 * The runner owns completion identity. A scenario receives only `create`, so
 * returned plain objects cannot masquerade as recorded interaction evidence.
 */
export function createInteractionRecorder() {
  let completedResult = null;
  const create = (name) => {
    const actions = [];
    const assertions = [];
    return {
      action(actionName, details) {
        actions.push(namedEntry(actionName, details));
      },
      assertion(assertionName, passed, details) {
        assertions.push(Object.freeze({ ...namedEntry(assertionName, details), passed }));
      },
      result() {
        completedResult = Object.freeze({
          name: String(name ?? ""),
          actions: Object.freeze([...actions]),
          assertions: Object.freeze([...assertions]),
        });
        return completedResult;
      },
    };
  };
  return Object.freeze({
    create,
    completedResult: () => completedResult,
    matches: (result) => result !== null && result === completedResult,
  });
}
