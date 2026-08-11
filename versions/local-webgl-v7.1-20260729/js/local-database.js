/* Neon Racer V7.1 local persistence. Uses IndexedDB and gracefully falls back to localStorage. */
(function () {
  'use strict';

  const DB_NAME = 'neon-racer-v7.1';
  const DB_VERSION = 1;
  const LEGACY_PREFIXES = ['racing-v7.1', 'racing-v7.0', 'racing-v6.9', 'racing-v6.8'];

  function requestAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
    });
  }

  class RacingLocalDatabase {
    constructor() {
      this.db = null;
      this.available = typeof indexedDB !== 'undefined';
    }

    async init() {
      if (!this.available) return false;
      try {
        const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
        openRequest.onupgradeneeded = () => {
          const db = openRequest.result;
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('bestTimes')) db.createObjectStore('bestTimes', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('raceResults')) {
            const results = db.createObjectStore('raceResults', { keyPath: 'id', autoIncrement: true });
            results.createIndex('finishedAt', 'finishedAt');
            results.createIndex('configuration', ['laps', 'cars']);
          }
        };
        this.db = await requestAsPromise(openRequest);
        this.db.onversionchange = () => this.db.close();
        await this.migrateLegacyData();
        return true;
      } catch (error) {
        console.warn('Local database unavailable; using localStorage fallback.', error);
        this.available = false;
        this.db = null;
        return false;
      }
    }

    async get(storeName, key) {
      if (!this.db) return null;
      const transaction = this.db.transaction(storeName, 'readonly');
      return requestAsPromise(transaction.objectStore(storeName).get(key));
    }

    async put(storeName, record) {
      if (!this.db) return false;
      const transaction = this.db.transaction(storeName, 'readwrite');
      await requestAsPromise(transaction.objectStore(storeName).put(record));
      return true;
    }

    async migrateLegacyData() {
      if (!this.db || await this.getSetting('legacy_migration_v1')) return;
      const settingMap = {
        laps: LEGACY_PREFIXES.map((prefix) => `${prefix}-laps`),
        cars: LEGACY_PREFIXES.map((prefix) => `${prefix}-cars`)
      };
      for (const [key, candidates] of Object.entries(settingMap)) {
        const value = candidates.map((candidate) => localStorage.getItem(candidate)).find((item) => item !== null);
        if (value !== undefined) await this.setSetting(key, Number(value));
      }
      for (const laps of [1, 3, 5]) {
        for (const cars of [1, 3, 6]) {
          const key = this.bestKey(laps, cars);
          const oldValue = localStorage.getItem(`racing-v6.8-best-${laps}-${cars}`);
          if (oldValue !== null && Number(oldValue) > 0 && !(await this.get('bestTimes', key))) {
            await this.put('bestTimes', { key, laps, cars, seconds: Number(oldValue), updatedAt: new Date().toISOString() });
          }
        }
      }
      await this.setSetting('legacy_migration_v1', true);
    }

    async getSetting(key) {
      const record = await this.get('settings', key);
      return record ? record.value : null;
    }

    async setSetting(key, value) {
      return this.put('settings', { key, value, updatedAt: new Date().toISOString() });
    }

    bestKey(laps, cars) {
      return `best:${laps}:${cars}`;
    }

    async getBest(laps, cars) {
      const record = await this.get('bestTimes', this.bestKey(laps, cars));
      return record ? Number(record.seconds) : 0;
    }

    async setBest(laps, cars, seconds) {
      const current = await this.getBest(laps, cars);
      if (current && current <= seconds) return false;
      await this.put('bestTimes', {
        key: this.bestKey(laps, cars), laps, cars, seconds,
        updatedAt: new Date().toISOString()
      });
      return true;
    }

    async recordRace(result) {
      return this.put('raceResults', { ...result, finishedAt: new Date().toISOString() });
    }
  }

  window.RacingLocalDatabase = RacingLocalDatabase;
})();
