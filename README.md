# bimapkit

<!-- ALL-CONTRIBUTORS-BADGE:START --><!-- ALL-CONTRIBUTORS-BADGE:END -->
[![npm version](https://img.shields.io/npm/v/bimapkit.svg)](https://www.npmjs.com/package/bimapkit)
[![npm downloads](https://img.shields.io/npm/dm/bimapkit.svg)](https://www.npmjs.com/package/bimapkit)
[![CI](https://img.shields.io/github/actions/workflow/status/trananhtung/bimapkit/ci.yml?branch=main)](https://github.com/trananhtung/bimapkit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero-dependency typed BiMap (bidirectional map) — look up by key or by value.**

Inspired by [Java Guava's `BiMap`](https://guava.dev/releases/snapshot/api/docs/com/google/common/collect/BiMap.html) and [Python's `bidict`](https://github.com/jab/bidict), now in pure TypeScript with no runtime dependencies.

```ts
import { BiMap } from "bimapkit";

const statusCodes = new BiMap<string, number>();
statusCodes.set("OK", 200).set("NOT_FOUND", 404).set("ERROR", 500);

statusCodes.get("OK");        // 200  — forward lookup
statusCodes.getKey(404);      // "NOT_FOUND"  — reverse lookup
statusCodes.inverseView().get(200);  // "OK"  — live inverse view
```

## Features

- **`BiMap<K, V>`** — bidirectional 1-to-1 map; both directions are always in sync
- **`set(key, value)`** — evicts stale entries to preserve the 1-to-1 invariant automatically
- **`setStrict(key, value)`** — throws `RangeError` instead of evicting duplicate values
- **`getKey(value)`** — O(1) reverse lookup
- **`inverseView()`** — live `InverseBiMapView<V, K>` backed by the same data; mutations propagate both ways
- **`inverse()`** — snapshot copy with keys and values swapped
- Full iteration: `keys()`, `values()`, `entries()`, `forEach()`, `[Symbol.iterator]`
- `toObject()`, `toMap()`, `fromEntries()` static factory
- Zero dependencies, TypeScript-first, ESM + CJS

## Install

```bash
npm install bimapkit
```

## Usage

### Basic lookup

```ts
import { BiMap } from "bimapkit";

const currencies = new BiMap<string, string>();
currencies.set("US Dollar", "USD").set("Euro", "EUR").set("Yen", "JPY");

currencies.get("Euro");       // "EUR"
currencies.getKey("JPY");     // "Yen"
currencies.has("Euro");       // true
currencies.hasValue("USD");   // true
```

### 1-to-1 invariant — automatic eviction

```ts
const bm = new BiMap<string, number>();
bm.set("a", 1).set("b", 2);

// "b" steals value 2 from another key
bm.set("c", 2);        // evicts "b" since 2 is now owned by "c"
bm.get("b");           // undefined  — evicted
bm.getKey(2);          // "c"

// "a" gets a new value
bm.set("a", 99);       // old reverse mapping 1 → "a" is removed
bm.getKey(1);          // undefined
```

### Strict mode — no silent eviction

```ts
bm.set("a", 1);
bm.setStrict("b", 1);  // throws RangeError: value already bound to a different key
```

### Live inverse view

```ts
const bm = new BiMap<string, number>([["a", 1], ["b", 2]]);
const inv = bm.inverseView();  // InverseBiMapView<number, string>

inv.get(1);       // "a"  — reverse lookup
inv.has(2);       // true

// Mutations on the view propagate to the original
inv.set(3, "c");  // in the view: key=3 → value="c"
bm.get("c");      // 3  — reflected in original

// Mutations on the original propagate to the view
bm.set("d", 4);
inv.get(4);       // "d"
```

### Snapshot inverse copy

```ts
const inv = bm.inverse();  // BiMap<number, string> — independent snapshot
bm.set("z", 99);
inv.has(99);  // false — snapshot, not live
```

## API

### `BiMap<K, V>`

| Method / Property | Description |
|---|---|
| `set(key, value)` | Add entry; evicts stale entries to maintain 1-to-1. Chainable. |
| `setStrict(key, value)` | Like `set`, but throws `RangeError` on duplicate value for a different key. |
| `get(key)` | `V \| undefined` — forward lookup. |
| `getKey(value)` | `K \| undefined` — reverse lookup. |
| `has(key)` | `boolean` |
| `hasValue(value)` | `boolean` |
| `delete(key)` | Remove by key; returns `boolean`. |
| `deleteValue(value)` | Remove by value; returns `boolean`. |
| `clear()` | Remove all entries. |
| `size` | Number of key-value pairs. |
| `keys()` | `IterableIterator<K>` |
| `values()` | `IterableIterator<V>` |
| `entries()` | `IterableIterator<[K, V]>` |
| `forEach(fn)` | Calls `fn(value, key, map)` for each pair. |
| `[Symbol.iterator]` | Same as `entries()`. |
| `inverse()` | Returns a new `BiMap<V, K>` snapshot. |
| `inverseView()` | Returns a live `InverseBiMapView<V, K>`. |
| `toObject()` | `Record<string, V>` |
| `toMap()` | `Map<K, V>` (copy) |
| `BiMap.fromEntries(pairs)` | Static factory. |

### `InverseBiMapView<K, V>`

Same interface as `BiMap<K, V>` minus `inverse()` / `inverseView()` / `toObject()` / `toMap()` / `fromEntries()`. All reads and writes are live-reflected in the parent.

## vs. alternatives

| Package | TypeScript | ESM | Reverse lookup | Live inverse | Maintained |
|---------|-----------|-----|----------------|--------------|------------|
| **bimapkit** | ✅ | ✅ | ✅ O(1) | ✅ | ✅ |
| bimap | ❌ | ❌ | ✅ | ❌ | ❌ (2014) |

## Contributors ✨

Contributions of any kind are welcome! See the [contributing guide](https://github.com/all-contributors/all-contributors) and add yourself via `@all-contributors please add @<username> for <contributions>`.

<!-- ALL-CONTRIBUTORS-LIST:START --><!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT © [trananhtung](https://github.com/trananhtung)
