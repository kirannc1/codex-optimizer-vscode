# Codex Optimizer (VSCode Extension)

Token-aware prompt optimizer with automatic model selection, budget enforcement, and streaming AI responses.

---

## 🚀 Features

- ✅ Phase-based prompt templates (design, impl, debug, etc.)
- ✅ Token estimation before sending
- ✅ Automatic context trimming
- ✅ Dynamic model selection (cost-aware)
- ✅ Streaming AI responses directly into editor
- ✅ YAML-driven configuration (no code changes required)

---
## 🔧 Package as VSIX (Installable Extension)
1) Install packaging tool
```
npm install -g @vscode/vsce
```
2) Build your extension
```
npm install
npm run compile
```
3) Generate .vsix
``
vsce package
```
## 🧠 How It Works

1. Select code (optional)
2. Run command:  
   `Codex Optimizer: Run`
3. Choose phase (impl, debug, etc.)
4. Enter requirement
5. Extension:
   - Builds optimized prompt
   - Estimates tokens
   - Selects cheapest valid model
   - Streams response into editor

---

## 📂 Configuration
