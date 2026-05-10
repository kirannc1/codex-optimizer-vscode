import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export class Optimizer {
  config: any;

  constructor(configPath: string) {
    const raw = fs.readFileSync(configPath, "utf-8");
    this.config = yaml.load(raw);
  }

  estimateTokens(text: string): number {
    if (!text) return 0;
    const codeMarkers = [";", "{", "}", "(", ")", "=>", "==", "import ", "class "];
    let score = 0;
    codeMarkers.forEach(m => score += (text.split(m).length - 1));
    const avg = score > 10 ? 3.2 : 4.0;
    return Math.floor(text.length / avg);
  }

  buildPrompt(phaseKey: string, placeholders: Record<string, string>) {
    const phase = this.config.phases[phaseKey];
    let task = phase.template.task;
    let context = phase.template.context;
    const outputFormat = phase.template.output_format;

    Object.entries(placeholders).forEach(([k, v]) => {
      task = task.replace(`<${k}>`, v);
      context = context.replace(`<${k}>`, v);
    });

    const header = [
      "[GLOBAL RULES]",
      ...this.config.globals.rules.map((r: string) => `- ${r}`),
      "",
      "[TOKEN CONTROL]",
      `- Input ≤ ${phase.budgets.input}`,
      `- Output ≤ ${phase.budgets.output}`,
      "",
      "[OPTIMIZATION HINT]",
      ...this.config.globals.optimization_hints.map((h: string) => `- ${h}`),
      "",
      "[TASK]",
      task,
      "",
      "[CONTEXT]",
      context,
      "",
      "[OUTPUT FORMAT]",
      outputFormat
    ].join("\n");

    return { prompt: header, context, phase };
  }

  enforceBudget(prompt: string, context: string, maxInput: number) {
    let total = this.estimateTokens(prompt) + this.estimateTokens(context);
    if (total <= maxInput) return { prompt, context, total };

    const trimmed = context.slice(-Math.floor(context.length * 0.5));
    const newTotal = this.estimateTokens(prompt) + this.estimateTokens(trimmed);

    if (newTotal > maxInput) {
      throw new Error("Token budget exceeded");
    }

    return {
      prompt: prompt.replace(context, trimmed),
      context: trimmed,
      total: newTotal
    };
  }

  chooseModel(taskType: string, inTokens: number, outTokens: number) {
    const rules = this.config.routing.rules[taskType];
    let best = null;
    let bestCost = Infinity;

    for (const m of rules) {
      const model = this.config.models[m];
      if (inTokens + outTokens > model.max_context) continue;

      const cost =
        (inTokens / 1000) * model.input_cost_per_1k +
        (outTokens / 1000) * model.output_cost_per_1k;

      if (cost < bestCost) {
        best = m;
        bestCost = cost;
      }
    }

    return { model: best, cost: bestCost };
  }

  prepare(phaseKey: string, placeholders: Record<string, string>) {
    const { prompt, context, phase } = this.buildPrompt(phaseKey, placeholders);

    const enforced = this.enforceBudget(
      prompt,
      context,
      phase.budgets.input
    );

    const outTokens = phase.budgets.output;

    const { model, cost } = this.chooseModel(
      phase.task_type,
      enforced.total,
      outTokens
    );

    return {
      model,
      prompt: enforced.prompt,
      tokens: enforced.total,
      outTokens,
      cost
    };
  }
}