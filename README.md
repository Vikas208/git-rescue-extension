# GitRescue

**Rescue code from previous Git commits directly inside VS Code.**  

GitRescue allows developers to quickly restore previous versions of functions, classes, or methods from a file’s Git history without leaving the editor. It works for **JavaScript** and **TypeScript** projects.

---

## Features

- Automatically shows a **Recover CodeLens** above each function, class, or method.
- Pick any **previous commit** and view a **diff** before restoring.
- Instantly replace the current code with the selected version.
- Supports **JS/TS files** in Git repositories.
- Lightweight and language-focused — no extra configuration needed.

---

## How it works

1. Open a **JavaScript or TypeScript file** in a Git-tracked workspace.
2. GitRescue will automatically show **“Recover” buttons** above functions, classes, or methods.
3. Click a button to select a **commit** from the file history.
4. A **diff view** shows changes between the current code and the selected commit.
5. GitRescue automatically replaces the code in your file with the commit version and closes the temporary diff file.

---

## Requirements

- Git installed and the project must be a Git repository.
- VS Code ≥ 1.103.0
- Works for **JavaScript** and **TypeScript** files.

---

## Extension Settings

None required — GitRescue works out-of-the-box.

---

## Known Issues

- Currently supports only **function/class/method-level recovery**.
- Works only for files tracked in Git.

---

## Release Notes

### 1.0.0

- Initial release of GitRescue
- Recover functions, classes, and methods from previous Git commits
- Automatic CodeLens and inline diff preview
- Auto replacement of selected code

---