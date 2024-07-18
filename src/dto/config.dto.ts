import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export type Config = { [key: string]: any };

export const types = {
  boolean: false,
  number: 0,
  string: '',
  bigInt: 0n,
};

export function fillFromEnv(config: Config) {
  Object.keys(config).forEach((name) => {
    const env = process.env[name];

    if (!env) {
      throw new Error(`Enviroment variable ${name} is required`);
    }

    switch (typeof config[name]) {
      case 'boolean':
        config[name] = /^true$/i.test(env);
        break;

      case 'number':
        config[name] = Number(env);
        if (!config[name]) {
          throw new Error(`Enviroment variable ${name} must be a number`);
        }
        break;

      case 'bigint':
        try {
          config[name] = BigInt(env);
        } catch {
          throw new Error(`Enviroment variable ${name} must be a number`);
        }
        break;

      case 'string':
      default:
        config[name] = env;
    }
  });
}
