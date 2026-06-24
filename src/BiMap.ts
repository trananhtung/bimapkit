/**
 * BiMap<K, V> — a bidirectional 1-to-1 map.
 *
 * Every key maps to exactly one value, and every value maps back to exactly
 * one key. This invariant is maintained automatically:
 *   - Forcing a new key→value pair that reuses an existing value evicts the
 *     old key that held that value.
 *   - Forcing a new key→value pair that reuses an existing key replaces the
 *     old value for that key (and removes the reverse mapping).
 *
 * Inspired by Java Guava's BiMap and Python's bidict.
 */
export class BiMap<K, V> {
  private readonly _fwd: Map<K, V>;
  private readonly _inv: Map<V, K>;

  constructor(entries?: Iterable<readonly [K, V]>) {
    this._fwd = new Map();
    this._inv = new Map();
    if (entries) {
      for (const [k, v] of entries) this.set(k, v);
    }
  }

  /** Number of key-value pairs. */
  get size(): number {
    return this._fwd.size;
  }

  /**
   * Set `key → value`.
   *
   * If `key` already maps to a different value, the old value's reverse entry
   * is removed. If `value` is already mapped from a different key, that key's
   * forward entry is removed — preserving the 1-to-1 invariant.
   *
   * Returns `this` for chaining.
   */
  set(key: K, value: V): this {
    // Remove stale reverse entry for the old value of this key
    if (this._fwd.has(key)) {
      this._inv.delete(this._fwd.get(key)!);
    }
    // Remove stale forward entry for the old key of this value
    if (this._inv.has(value)) {
      this._fwd.delete(this._inv.get(value)!);
    }
    this._fwd.set(key, value);
    this._inv.set(value, key);
    return this;
  }

  /**
   * Like `set`, but throws a `RangeError` if `value` is already mapped from
   * a *different* key — instead of silently evicting it.
   * Use this when you want strict duplicate-value detection.
   */
  setStrict(key: K, value: V): this {
    const existingKey = this._inv.get(value);
    if (existingKey !== undefined && !Object.is(existingKey, key)) {
      throw new RangeError(
        `BiMap: value is already bound to a different key`,
      );
    }
    return this.set(key, value);
  }

  /** Get the value mapped from `key`, or `undefined`. */
  get(key: K): V | undefined {
    return this._fwd.get(key);
  }

  /** Get the key mapped from `value`, or `undefined`. */
  getKey(value: V): K | undefined {
    return this._inv.get(value);
  }

  /** True if the map contains `key`. */
  has(key: K): boolean {
    return this._fwd.has(key);
  }

  /** True if the map contains `value`. */
  hasValue(value: V): boolean {
    return this._inv.has(value);
  }

  /**
   * Delete the entry whose key is `key`.
   * Returns `true` if an entry was removed.
   */
  delete(key: K): boolean {
    if (!this._fwd.has(key)) return false;
    this._inv.delete(this._fwd.get(key)!);
    this._fwd.delete(key);
    return true;
  }

  /**
   * Delete the entry whose value is `value`.
   * Returns `true` if an entry was removed.
   */
  deleteValue(value: V): boolean {
    if (!this._inv.has(value)) return false;
    this._fwd.delete(this._inv.get(value)!);
    this._inv.delete(value);
    return true;
  }

  /** Remove all entries. */
  clear(): void {
    this._fwd.clear();
    this._inv.clear();
  }

  /** Iterate over all keys. */
  keys(): IterableIterator<K> {
    return this._fwd.keys();
  }

  /** Iterate over all values. */
  values(): IterableIterator<V> {
    return this._fwd.values();
  }

  /** Iterate over `[key, value]` pairs. */
  entries(): IterableIterator<[K, V]> {
    return this._fwd.entries();
  }

  /** Iterate over `[key, value]` pairs (same as `entries()`). */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._fwd.entries();
  }

  /** Execute `fn` for each `[value, key]` pair (matches `Map#forEach` signature). */
  forEach(fn: (value: V, key: K, map: this) => void): void {
    for (const [k, v] of this._fwd) fn(v, k, this);
  }

  /**
   * Return a new `BiMap<V, K>` that is the inverse of this map.
   * The inverse is a *snapshot* — mutations to either do not affect the other.
   *
   * For a live two-way view, use `inverseView()`.
   */
  inverse(): BiMap<V, K> {
    return new BiMap<V, K>(this._inv.entries());
  }

  /**
   * Return a live `InverseBiMapView<V, K>` backed by this map.
   * All reads and writes on the view are reflected in the original and
   * vice-versa — they share the same underlying Maps.
   */
  inverseView(): InverseBiMapView<V, K> {
    return new InverseBiMapView<V, K>(this._inv, this._fwd);
  }

  /** Convert to a plain object `{ [key]: value }` (K must be string). */
  toObject(): Record<string, V> {
    const out: Record<string, V> = Object.create(null) as Record<string, V>;
    for (const [k, v] of this._fwd) out[String(k)] = v;
    return out;
  }

  /** Convert to a `Map<K, V>` (copy). */
  toMap(): Map<K, V> {
    return new Map(this._fwd);
  }

  /** Build a BiMap from an iterable of `[key, value]` pairs. */
  static fromEntries<K, V>(entries: Iterable<readonly [K, V]>): BiMap<K, V> {
    return new BiMap<K, V>(entries);
  }

  get [Symbol.toStringTag](): string {
    return "BiMap";
  }
}

/**
 * InverseBiMapView<K, V> — a live bidirectional view where the roles of
 * keys and values are swapped. Backed by the same Maps as the parent BiMap.
 *
 * Created via `bimap.inverseView()`.
 */
export class InverseBiMapView<K, V> {
  constructor(
    private readonly _fwd: Map<K, V>,
    private readonly _inv: Map<V, K>,
  ) {}

  get size(): number { return this._fwd.size; }

  set(key: K, value: V): this {
    if (this._fwd.has(key)) this._inv.delete(this._fwd.get(key)!);
    if (this._inv.has(value)) this._fwd.delete(this._inv.get(value)!);
    this._fwd.set(key, value);
    this._inv.set(value, key);
    return this;
  }

  get(key: K): V | undefined { return this._fwd.get(key); }
  getKey(value: V): K | undefined { return this._inv.get(value); }
  has(key: K): boolean { return this._fwd.has(key); }
  hasValue(value: V): boolean { return this._inv.has(value); }

  delete(key: K): boolean {
    if (!this._fwd.has(key)) return false;
    this._inv.delete(this._fwd.get(key)!);
    this._fwd.delete(key);
    return true;
  }

  deleteValue(value: V): boolean {
    if (!this._inv.has(value)) return false;
    this._fwd.delete(this._inv.get(value)!);
    this._inv.delete(value);
    return true;
  }

  clear(): void { this._fwd.clear(); this._inv.clear(); }

  keys(): IterableIterator<K> { return this._fwd.keys(); }
  values(): IterableIterator<V> { return this._fwd.values(); }
  entries(): IterableIterator<[K, V]> { return this._fwd.entries(); }
  [Symbol.iterator](): IterableIterator<[K, V]> { return this._fwd.entries(); }

  get [Symbol.toStringTag](): string { return "InverseBiMapView"; }
}
