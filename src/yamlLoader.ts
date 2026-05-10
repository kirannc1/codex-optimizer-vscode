import * as fs from "fs";
import * as yaml from "js-yaml";

export function loadYamlConfig(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`YAML config not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  let config: any;
  try {
    config = yaml.load(raw);
  } catch (err) {
    throw new Error(`Failed to parse YAML: ${err}`);
  }

  validateConfig(config);

  return config;
}

function validateConfig(config: any) {
  if (!config) throw new Error("Empty config");

  if (!config.models) {
    throw new Error("Missing 'models' section in YAML");
  }

  if (!config.phases) {
    throw new Error("Missing 'phases' section in YAML");
  }

  if (!config.routing || !config.routing.rules) {
    throw new Error("Missing routing rules");
  }

  // Validate phases
  for (const [key, phase] of Object.entries<any>(config.phases)) {
    if (!phase.task_type) {
      throw new Error(`Phase '${key}' missing task_type`);
    }

    if (!phase.template) {
      throw new Error(`Phase '${key}' missing template`);
    }

    if (!phase.budgets) {
      throw new Error(`Phase '${key}' missing budgets`);
    }
  }
}