import { WebPlugin } from '@capacitor/core';

import type { HealthStepsPluginPlugin } from './definitions';

export class HealthStepsPluginWeb extends WebPlugin implements HealthStepsPluginPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
