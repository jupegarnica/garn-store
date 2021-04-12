import { existsSync } from "./deps.ts";

import { BaseStore } from "./BaseStore.ts";
/**
 * A super simple key-value database.
 * Keys always are strings.
 * Value type can be specified through generics.
 */
export class Store extends BaseStore {
  /**
   * Load stored data from disk into cache.
   * Won't update cache values if hash in store file matches current cache file.
   *
   * @param storePath Custom file path used by read operation
   * @param force Ignore hash comparison and force read
   */
  protected load(storePath?: string, force = false): void {
    if (!storePath) storePath = this._storePath;
    else this._storePath = storePath;
    if (!existsSync(storePath)) return;

    // Load data from file.
    const data = Deno.readFileSync(storePath);
    const decoder = new TextDecoder("utf-8");
    const decoded = JSON.parse(decoder.decode(data));

    // Reload probably not necessary.
    if (!force && decoded._hash === this._dataHash) return;

    // Store new data.
    this._data = decoded.data;
    this._lastKnownStoreHash = decoded._hash;

    return;
  }

  /**
   * Writes cached data to disk.
   * Won't perform write if the last known hash from the store file
   * matches the current cache hash.
   *
   * @param storePath Custom file path used by write operation
   * @param force Ignore hashe comparison and force write
   */
  public write(storePath?: string, force = false): void {
    // Write probably not necessary.
    if (!force && this._lastKnownStoreHash === this._dataHash) {
      return;
    }
    if (!storePath) storePath = this._storePath;

    // Write data.
    const data = JSON.stringify({
      _hash: this._dataHash,
      data: this._data,
    });
    const encoder = new TextEncoder();
    return Deno.writeFileSync(storePath, encoder.encode(data));
  }

  /**
   * Deletes a store file / directory.
   *
   * @param storePath Custom path used by delete operation. Defaults to the default storage file path
   */
  public deleteStore(storePath?: string): void {
    if (!storePath) storePath = this._storePath;
    if (!existsSync(storePath)) {
      throw new Error(`${storePath} not exists`);
    }
    return Deno.removeSync(storePath);
  }
}
