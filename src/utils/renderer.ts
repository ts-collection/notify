import { createLogUpdate } from 'log-update';

// NOTE: terminal output engine, owns render timer and deduplicated ANSI write. Entry-agnostic.
export class RenderLoop {
  private timer: ReturnType<typeof setInterval> | null = null;
  private logUpdate = createLogUpdate(process.stderr);
  private lastOutput = '';
  private tickFn: (() => void) | null = null;

  // NOTE: register tick callback and start interval if not already running
  start(callback: () => void) {
    this.tickFn = callback;
    if (!this.timer) {
      this.timer = setInterval(() => this.tick(), 80);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // NOTE: skip write when output is identical to last frame
  write(lines: string[]) {
    const output = lines.join('\n');
    if (output !== this.lastOutput) {
      this.lastOutput = output;
      this.logUpdate(output);
    }
  }

  // NOTE: only clears if something was previously written
  clear() {
    if (this.lastOutput !== '') {
      this.lastOutput = '';
      this.logUpdate.clear();
    }
  }

  // NOTE: keep Node process alive when entries request it
  syncRefState(keepAlive: boolean) {
    if (this.timer) {
      if (keepAlive) this.timer.ref();
      else this.timer.unref();
    }
  }

  destroy() {
    this.clear();
    this.stop();
    this.tickFn = null;
  }

  private tick() {
    this.tickFn?.();
  }
}
