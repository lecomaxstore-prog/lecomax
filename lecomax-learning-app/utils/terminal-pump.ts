/** One request at a time: input wakes an idle poll without replaying commands on failure. */
export function createTerminalPump(options: {
  read: (data: string) => Promise<boolean>;
  active: () => boolean;
  fail: (error: unknown) => void;
}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false, stopped = false, input = '', busyUntil = 0;
  const schedule = (delay: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), delay);
  };
  async function run() {
    if (stopped || running) return;
    running = true;
    const data = input.slice(0, 4000);
    input = input.slice(4000);
    try {
      const more = await options.read(data);
      if (!more) { stopped = true; return; }
      if (!stopped) schedule(input ? 0 : !options.active() ? 5000 : Date.now() < busyUntil ? 50 : 500);
    } catch (error) {
      stopped = true;
      input = ''; // The server may have executed it. Never automatically resend.
      options.fail(error);
    } finally { running = false; }
  }
  return {
    start: () => { if (!stopped) schedule(0); },
    write(data: string) {
      if (stopped) return;
      if (input.length + data.length > 64000) {
        stopped = true;
        clearTimeout(timer);
        options.fail(new Error('INPUT_TOO_LARGE'));
        return;
      }
      input += data;
      busyUntil = Date.now() + 1500;
      if (!running) schedule(8);
    },
    wake() { if (!stopped && !running) schedule(0); },
    stop() { stopped = true; clearTimeout(timer); input = ''; },
  };
}
