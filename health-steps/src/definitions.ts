export interface HealthStepsPluginPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
