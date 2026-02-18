import { registerPlugin } from '@capacitor/core';

import type { HealthStepsPluginPlugin } from './definitions';

const HealthStepsPlugin = registerPlugin<HealthStepsPluginPlugin>('HealthStepsPlugin', {
  web: () => import('./web').then((m) => new m.HealthStepsPluginWeb()),
});

export * from './definitions';
export { HealthStepsPlugin };
