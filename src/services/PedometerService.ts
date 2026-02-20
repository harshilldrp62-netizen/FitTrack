/**
 * Lightweight wrapper around pedometer plugins (Capacitor community or Cordova).
 * Uses runtime detection to support multiple plugin shapes and keeps a safe
 * web fallback so the app doesn't break in the browser.
 */

type UpdateCallback = (steps: number) => void;

export default class PedometerService {
  private plugin: any = null;
  private listener: any = null;
  private watchId: any = null;

  // Detect known plugin objects (Capacitor community plugin, window.Pedometer,
  // window.plugins.pedometer, or cordova pedometer)
  async init(): Promise<void> {
    if (this.plugin) return;

    // 1) Try Capacitor community plugin dynamic import
    try {
      const pkg = "@capacitor-community/pedometer";
      // prevent Vite from statically analyzing this optional dependency
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mod = await import(/* @vite-ignore */ pkg);
      this.plugin = mod && (mod as any).Pedometer ? (mod as any).Pedometer : mod;
      if (this.plugin) return;
    } catch (e) {
      // ignore — not installed
    }

    // 2) Check for global Capacitor/cordova plugin exposures
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w.Pedometer) this.plugin = w.Pedometer;
      else if (w.plugins && w.plugins.pedometer) this.plugin = w.plugins.pedometer;
      else if (w.cordova && (w as any).pedometer) this.plugin = (w as any).pedometer;
      else if ((w as any).cordova && (w as any).cordova.plugins && (w as any).cordova.plugins.pedometer) this.plugin = (w as any).cordova.plugins.pedometer;
    }
  }

  // Start receiving step updates. Returns true if a native plugin was started.
  async start(onUpdate: UpdateCallback): Promise<boolean> {
    await this.init();
    if (!this.plugin) return false;

    try {
      // Capacitor-style listener
      if (this.plugin.addListener) {
        this.listener = await this.plugin.addListener("pedometer", (data: any) => {
          const steps = data?.steps ?? data?.numberOfSteps ?? data?.value ?? 0;
          const stepCount = Number(steps) || 0;
onUpdate(stepCount);

        });
        if (this.plugin.startUpdates) await this.plugin.startUpdates();
        if (this.plugin.start) await this.plugin.start();
        return true;
      }

      // Cordova-style: many pedometer plugins expose startPedometerUpdates(success, error)
      if (typeof this.plugin.startPedometerUpdates === "function") {
        this.plugin.startPedometerUpdates(
          (data: any) => {
            const steps = data?.numberOfSteps ?? data?.steps ?? data?.value ?? 0;
            const stepCount = Number(steps) || 0;
onUpdate(stepCount);

          },
          (err: any) => {
            // ignore
          }
        );
        return true;
      }

      // Some plugins use a watch pattern returning an id that must be cleared
      if (typeof this.plugin.watchStepCount === "function") {
        this.watchId = this.plugin.watchStepCount(
          (data: any) => {
            const steps = data?.steps ?? data?.numberOfSteps ?? 0;
            const stepCount = Number(steps) || 0;
onUpdate(stepCount);

          },
          (err: any) => {
            // ignore
          }
        );
        return true;
      }

      // Some expose start/stop with callbacks
      if (typeof this.plugin.start === "function") {
        try {
          await this.plugin.start();
        } catch (_) {
          // some start require callbacks — try passing handlers
          try {
            this.plugin.start(
              (data: any) => onUpdate(Number(data?.steps ?? data?.numberOfSteps ?? 0) || 0),
              () => {}
            );
          } catch (e) {
            // fallback
          }
        }
        return true;
      }
    } catch (e) {
      // swallow errors — will return false at the end
    }

    return false;
  }

  // Stop pedometer/listener
  async stop(): Promise<void> {
    try {
      if (this.listener && typeof this.listener.remove === "function") {
        await this.listener.remove();
        this.listener = null;
      }

      if (this.watchId && this.plugin && typeof this.plugin.clearWatch === "function") {
        try {
          this.plugin.clearWatch(this.watchId);
        } catch (e) {
          // ignore
        }
        this.watchId = null;
      }

      if (this.plugin && typeof this.plugin.stopPedometerUpdates === "function") {
        try {
          this.plugin.stopPedometerUpdates();
        } catch (e) {
          // ignore
        }
      }

      if (this.plugin && typeof this.plugin.stop === "function") {
        try {
          await this.plugin.stop();
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
