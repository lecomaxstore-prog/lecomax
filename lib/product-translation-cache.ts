// Bounded process cache also keeps translation available during schema rollout.
// The database remains the durable cache and coordinates work across servers.
export class ProductTranslationCache {
  private ready = new Map<string, { description: string; expires: number }>();
  private pending = new Map<string, Promise<string>>();

  get(key: string) {
    const item = this.ready.get(key);
    if (item && item.expires > Date.now()) return item.description;
    this.ready.delete(key);
    return undefined;
  }

  async generate(key: string, generate: () => Promise<string>) {
    const cached = this.get(key);
    if (cached) return cached;
    const existing = this.pending.get(key);
    if (existing) return existing;
    if (this.pending.size >= 8) throw new Error("Translation capacity reached");
    const work = Promise.resolve().then(generate).then((description) => {
      if (this.ready.size >= 100) this.ready.delete(this.ready.keys().next().value!);
      this.ready.set(key, { description, expires: Date.now() + 3600000 });
      return description;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, work);
    return work;
  }
}
