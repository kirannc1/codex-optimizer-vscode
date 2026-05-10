import * as vscode from "vscode";
import { Optimizer } from "./optimizer";
import * as path from "path";

async function collectInputs(phaseConfig: any): Promise<Record<string, string>> {
  const values: Record<string, string> = {};

  if (!phaseConfig.inputs) return values;

  for (const input of phaseConfig.inputs) {
    const val = await vscode.window.showInputBox({
      prompt: input.prompt,
      placeHolder: input.key
    });

    // handle cancel explicitly (recommended)
    if (val === undefined) {
      throw new Error(`Input cancelled: ${input.key}`);
    }

    values[input.key] = val || "";
  }

  return values;
}

export function activate(context: vscode.ExtensionContext) {
  const optimizer = new Optimizer(
    path.join(context.extensionPath, "codex-optimizer.yaml")
  );

  let disposable = vscode.commands.registerCommand(
    "codexOptimizer.run",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selectedText = editor.document.getText(editor.selection);

      const phase = await vscode.window.showQuickPick(
        Object.keys(optimizer.config.phases),
        { placeHolder: "Select phase" }
      );

      if (!phase) return;

      const phaseConfig = optimizer.config.phases[phase];
      const dynamicInputs = await collectInputs(phaseConfig);

      const requirement = await vscode.window.showInputBox({
        prompt: "Enter requirement / instruction"
      });

      const moduleName = await vscode.window.showInputBox({
        prompt: "Enter module name"
      });

      const archState = await vscode.window.showInputBox({
        prompt: "Enter ARCH_STATE (or short description)"
      });

      const result = optimizer.prepare(phase, {
        ...dynamicInputs,
        MODULE_NAME: moduleName || "UnknownModule",
        ARCH_STATE: archState || "No context provided",
        REQUIREMENT: requirement || "",
        FUNCTION: selectedText
      });

      vscode.window.showInformationMessage(
        `Model: ${result.model} | Tokens: ${result.tokens} | Cost: ${result.cost.toFixed(4)}`
      );

      editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.start, result.prompt + "\n\n");
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}