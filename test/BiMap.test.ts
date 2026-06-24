import { BiMap } from "../src/index.js";

describe("BiMap — construction", () => {
  test("empty constructor", () => {
    const bm = new BiMap<string, number>();
    expect(bm.size).toBe(0);
  });

  test("constructor with entries", () => {
    const bm = new BiMap([["a", 1], ["b", 2]] as const);
    expect(bm.size).toBe(2);
    expect(bm.get("a")).toBe(1);
    expect(bm.getKey(2)).toBe("b");
  });

  test("fromEntries", () => {
    const bm = BiMap.fromEntries([["x", 10], ["y", 20]] as const);
    expect(bm.get("x")).toBe(10);
    expect(bm.getKey(10)).toBe("x");
  });
});

describe("BiMap — set / get", () => {
  test("set associates key and value bidirectionally", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    expect(bm.get("a")).toBe(1);
    expect(bm.getKey(1)).toBe("a");
  });

  test("set is chainable", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2).set("c", 3);
    expect(bm.size).toBe(3);
  });

  test("set with duplicate key replaces old value and removes old reverse", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    bm.set("a", 2); // replace
    expect(bm.get("a")).toBe(2);
    expect(bm.getKey(2)).toBe("a");
    expect(bm.getKey(1)).toBeUndefined(); // old reverse removed
    expect(bm.size).toBe(1);
  });

  test("set with duplicate value evicts old key", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    bm.set("b", 1); // b steals value 1 from a
    expect(bm.get("b")).toBe(1);
    expect(bm.getKey(1)).toBe("b");
    expect(bm.get("a")).toBeUndefined(); // a was evicted
    expect(bm.size).toBe(1);
  });

  test("get returns undefined for absent key", () => {
    const bm = new BiMap<string, number>();
    expect(bm.get("missing")).toBeUndefined();
  });

  test("getKey returns undefined for absent value", () => {
    const bm = new BiMap<string, number>();
    expect(bm.getKey(99)).toBeUndefined();
  });
});

describe("BiMap — setStrict", () => {
  test("setStrict allows setting same key→value again", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    expect(() => bm.setStrict("a", 1)).not.toThrow();
    expect(bm.size).toBe(1);
  });

  test("setStrict throws when value is already bound to a different key", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    expect(() => bm.setStrict("b", 1)).toThrow(RangeError);
    // Original state unchanged
    expect(bm.get("a")).toBe(1);
    expect(bm.size).toBe(1);
  });

  test("setStrict allows overwriting same key with new value", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    bm.setStrict("a", 2);
    expect(bm.get("a")).toBe(2);
    expect(bm.getKey(1)).toBeUndefined();
  });
});

describe("BiMap — has / hasValue", () => {
  test("has returns true for existing key", () => {
    const bm = new BiMap<string, number>();
    bm.set("k", 7);
    expect(bm.has("k")).toBe(true);
    expect(bm.has("x")).toBe(false);
  });

  test("hasValue returns true for existing value", () => {
    const bm = new BiMap<string, number>();
    bm.set("k", 7);
    expect(bm.hasValue(7)).toBe(true);
    expect(bm.hasValue(99)).toBe(false);
  });
});

describe("BiMap — delete / deleteValue", () => {
  test("delete removes key and its reverse mapping", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    expect(bm.delete("a")).toBe(true);
    expect(bm.has("a")).toBe(false);
    expect(bm.hasValue(1)).toBe(false);
    expect(bm.size).toBe(0);
  });

  test("delete returns false for absent key", () => {
    const bm = new BiMap<string, number>();
    expect(bm.delete("nope")).toBe(false);
  });

  test("deleteValue removes value and its forward mapping", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    expect(bm.deleteValue(1)).toBe(true);
    expect(bm.has("a")).toBe(false);
    expect(bm.hasValue(1)).toBe(false);
    expect(bm.size).toBe(0);
  });

  test("deleteValue returns false for absent value", () => {
    const bm = new BiMap<string, number>();
    expect(bm.deleteValue(99)).toBe(false);
  });
});

describe("BiMap — clear", () => {
  test("clear empties both directions", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    bm.clear();
    expect(bm.size).toBe(0);
    expect(bm.has("a")).toBe(false);
    expect(bm.hasValue(1)).toBe(false);
  });
});

describe("BiMap — iteration", () => {
  test("keys()", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    expect([...bm.keys()]).toEqual(["a", "b"]);
  });

  test("values()", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    expect([...bm.values()]).toEqual([1, 2]);
  });

  test("entries()", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    expect([...bm.entries()]).toEqual([["a", 1], ["b", 2]]);
  });

  test("[Symbol.iterator] same as entries()", () => {
    const bm = new BiMap<string, number>();
    bm.set("x", 9);
    expect([...bm]).toEqual([["x", 9]]);
  });

  test("forEach visits all pairs", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    const seen: [number, string][] = [];
    bm.forEach((v, k) => seen.push([v, k]));
    expect(seen).toEqual([[1, "a"], [2, "b"]]);
  });
});

describe("BiMap — inverse / inverseView", () => {
  test("inverse() returns snapshot with K and V swapped", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    const inv = bm.inverse();
    expect(inv.get(1)).toBe("a");
    expect(inv.get(2)).toBe("b");
    expect(inv.getKey("a")).toBe(1);
    // snapshot — mutating original does not affect inv
    bm.set("c", 3);
    expect(inv.has(3)).toBe(false);
  });

  test("inverseView() is live — mutations on original reflected", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    const view = bm.inverseView();
    expect(view.get(1)).toBe("a");
    bm.set("b", 2);
    expect(view.get(2)).toBe("b"); // live
    expect(view.size).toBe(2);
  });

  test("inverseView() mutations reflected in original", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    const view = bm.inverseView();
    view.set(2, "b"); // inverse: value=2, key="b"
    expect(bm.get("b")).toBe(2); // reflected in original
  });

  test("inverseView() delete propagates", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    const view = bm.inverseView();
    view.delete(1); // removes value=1 → key="a" from the original
    expect(bm.has("a")).toBe(false);
    expect(bm.size).toBe(1);
  });
});

describe("BiMap — serialization", () => {
  test("toObject", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1).set("b", 2);
    const obj = bm.toObject();
    expect(obj["a"]).toBe(1);
    expect(obj["b"]).toBe(2);
  });

  test("toMap returns a copy", () => {
    const bm = new BiMap<string, number>();
    bm.set("a", 1);
    const m = bm.toMap();
    expect(m instanceof Map).toBe(true);
    m.set("z", 99);
    expect(bm.has("z")).toBe(false);
  });
});
