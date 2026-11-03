// Loads and saves the profile on the phone, and syncs it with Google Play Saved Games.
import { migrate, mergeProfiles, newProfile } from './profile.js';

const KEY = 'sandstone-kingdom:v2';
const OLD_KEY = 'sandstone-kingdom:v1';

function read(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; } }

export class Store {
  constructor() {
    const raw = read(KEY) || read(OLD_KEY);
    this.profile = raw ? migrate(raw) : newProfile();
    this.timer = 0;
    this.cloud = null; // { save(json), load() } from the platform once signed in
  }

  save(now = false) {
    this.profile.updated = Date.now();
    clearTimeout(this.timer);
    const write = () => {
      try { localStorage.setItem(KEY, JSON.stringify(this.profile)); } catch { /* storage full or blocked */ }
      if (this.cloud) this.cloud.save(JSON.stringify(this.profile));
    };
    if (now) write(); else this.timer = setTimeout(write, 400);
  }

  // After sign-in: merge the cloud copy with this phone's, keep the furthest progress.
  async syncFromCloud() {
    if (!this.cloud) return false;
    const json = await this.cloud.load();
    if (json) {
      let remote = null;
      try { remote = JSON.parse(json); } catch { remote = null; }
      if (remote) {
        const settings = this.profile.settings;
        this.profile = mergeProfiles(this.profile, remote);
        this.profile.settings = settings;
      }
    }
    this.save(true);
    return true;
  }

  // Settings > Delete my data: wipes this phone's copy (and the cloud copy on next save).
  reset() {
    const settings = this.profile.settings;
    this.profile = newProfile();
    this.profile.settings = settings;
    this.save(true);
  }
}
