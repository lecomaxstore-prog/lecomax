// Platform-independent state machine, exercised with injected transport and secure storage.
export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  sessionId: string;
  remembered: boolean;
};
export type AuthState =
  'loading' | 'signedOut' | 'choice' | 'authenticated' | 'offline' | 'background';
export class SessionError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function createSessionClient(deps: {
  request: (action: string, body?: unknown, access?: string, method?: string) => Promise<any>;
  read: () => Promise<string | null>;
  save: (token: string) => Promise<void>;
  remove: () => Promise<void>;
  device: string;
}) {
  let session: Session | null = null,
    challenge = '',
    state: AuthState = 'loading',
    queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const publish = (next: AuthState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(fn, fn);
    queue = next.catch(() => {});
    return next;
  };
  async function clear() {
    session = null;
    challenge = '';
    publish('signedOut');
    await deps.remove();
  }
  async function accept(next: Session) {
    try {
      if (next.remembered) await deps.save(next.refreshToken);
      else await deps.remove();
    } catch {
      await deps.request('logout', { refreshToken: next.refreshToken }).catch(() => {});
      await clear();
      throw new SessionError(0, 'SECURE_STORAGE_UNAVAILABLE');
    }
    session = next;
    publish('authenticated');
  }
  async function renew() {
    if (!session) throw new SessionError(401, 'OWNER_LOGIN_REQUIRED');
    try {
      await accept(await deps.request('refresh', { refreshToken: session.refreshToken }));
    } catch (e) {
      if (e instanceof SessionError && e.status === 401) await clear();
      else if (state !== 'signedOut') publish('offline');
      throw e;
    }
  }
  async function validate() {
    if (!session) {
      publish('signedOut');
      return;
    }
    try {
      if (session.expiresAt <= Date.now() + 30000) await renew();
      else {
        await deps.request('sessions', undefined, session.accessToken, 'GET');
        publish('authenticated');
      }
    } catch (e) {
      if (e instanceof SessionError && e.status === 401) await clear();
      else if (!session?.accessToken || session.expiresAt <= Date.now()) publish('offline');
      throw e;
    }
  }
  async function restore() {
    publish('loading');
    try {
      const refresh = await deps.read();
      if (!refresh) {
        publish('signedOut');
        return;
      }
      session = {
        refreshToken: refresh,
        accessToken: '',
        expiresAt: 0,
        sessionId: '',
        remembered: true,
      };
      await renew();
    } catch (e) {
      if (state !== 'signedOut') publish('offline');
      throw e;
    }
  }
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    snapshot: () => state,
    restore: () => serial(restore),
    login: (email: string, password: string) =>
      serial(async () => {
        const result = await deps.request('', { email, password });
        challenge = result.challenge;
        publish('choice');
      }),
    choose: (remember: boolean) =>
      serial(async () => {
        try {
          const next = await deps.request('confirm', { challenge, remember, device: deps.device });
          challenge = '';
          await accept(next);
        } catch (e) {
          if (e instanceof SessionError && e.status === 401) {
            challenge = '';
            publish('signedOut');
          }
          throw e;
        }
      }),
    cancel: () =>
      serial(async () => {
        challenge = '';
        publish('signedOut');
      }),
    retry: () =>
      serial(async () => {
        // A failed storage read must be retried, not treated as a missing login.
        if (!session) return restore();
        // Keep a recoverable error screen if validation fails again.
        await validate();
      }),
    background() {
      // Keep navigation and unsaved screen state mounted. Foreground validation
      // still revokes rejected credentials, without flashing a verification page.
    },
    validate: () => serial(validate),
    token: () =>
      serial(async () => {
        if (!session) throw new SessionError(401, 'OWNER_LOGIN_REQUIRED');
        if (session.expiresAt <= Date.now() + 30000) await renew();
        if (state !== 'authenticated') throw new SessionError(401, 'OWNER_LOGIN_REQUIRED');
        return session!.accessToken;
      }),
    invalidate: () => serial(clear),
    logout: () =>
      serial(async () => {
        if (session) await deps.request('logout', { refreshToken: session.refreshToken });
        await clear();
      }),
    sessions: () =>
      serial(async () => {
        if (!session) throw new SessionError(401, 'OWNER_LOGIN_REQUIRED');
        if (session.expiresAt <= Date.now() + 30000) await renew();
        return deps.request('sessions', undefined, session!.accessToken, 'GET');
      }),
    revoke: (target: string) =>
      serial(async () => {
        if (!session) throw new SessionError(401, 'OWNER_LOGIN_REQUIRED');
        if (session.expiresAt <= Date.now() + 30000) await renew();
        await deps.request('sessions', { target }, session!.accessToken);
        if (target === 'all' || target === session!.sessionId) await clear();
      }),
  };
}
