import * as vscode from "vscode";
import { GitUtils } from "./git-helper";
import { extractEntities, CodeEntity } from "./parser";
import { RecoverCodeLensProvider } from "./code-lens-provider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new RecoverCodeLensProvider();

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: "javascript", scheme: "file" },
        { language: "typescript", scheme: "file" },
      ],
      provider
    )
  );

  // Refresh CodeLens for already opened documents on extension activation
  vscode.workspace.textDocuments.forEach((doc) => {
    if (["javascript", "typescript"].includes(doc.languageId)) {
      provider.refresh();
    }
  });

  // Refresh CodeLens when a new file is opened
  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (["javascript", "typescript"].includes(doc.languageId)) {
      provider.refresh();
    }
  });

  // refresh on save or editor change
  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (["javascript", "typescript"].includes(doc.languageId)) {
      provider.refresh();
    }
  });
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (
      editor &&
      ["javascript", "typescript"].includes(editor.document.languageId)
    ) {
      provider.refresh();
    }
  });

  vscode.commands.registerCommand(
  "git-rescue.recoverEntity",
  async (uri: vscode.Uri, entity: CodeEntity) => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const gitUtils = new GitUtils(workspaceFolders[0].uri.fsPath);
    const filePath = uri.fsPath;

    // Get recent commits
    const commits = await gitUtils.getFileCommits(filePath, 20);
    if (commits.length === 0) {
      vscode.window.showInformationMessage("No commits found for this file.");
      return;
    }

    const picked = await vscode.window.showQuickPick(
      commits.map((c) => ({ label: c.message, description: c.hash })),
      { placeHolder: `Select a commit for ${entity.type} "${entity.name}"` }
    );
    if (!picked) return;

    const commitContent = await gitUtils.getFileContentAtCommit(
      filePath,
      picked.description!
    );
    if (!commitContent) return;

    // Find the entity in the commit content
    const oldEntities = extractEntities(commitContent);
    const match = oldEntities.find(
      (e) => e.name === entity.name && e.type === entity.type
    );
    if (!match) {
      vscode.window.showWarningMessage(
        `Entity "${entity.name}" not found in commit ${picked.description}`
      );
      return;
    }

    const replacement = commitContent.slice(match.range[0], match.range[1]);

    // Extract current entity text
    const currentDoc = await vscode.workspace.openTextDocument(uri);
    const currentText = currentDoc.getText(
      new vscode.Range(
        currentDoc.positionAt(entity.range[0]),
        currentDoc.positionAt(entity.range[1])
      )
    );

    // Prepare two virtual docs for diff
    const leftUri = vscode.Uri.parse(`untitled:${entity.name}-from-commit.js`);
    const rightUri = vscode.Uri.parse(`untitled:${entity.name}-current.js`);

    // Insert commit version
    await vscode.workspace.openTextDocument(leftUri).then((doc) =>
      vscode.window.showTextDocument(doc, { preview: true }).then((editor) => {
        editor.edit((edit) => edit.insert(new vscode.Position(0, 0), replacement));
      })
    );

    // Insert current version
    await vscode.workspace.openTextDocument(rightUri).then((doc) =>
      vscode.window.showTextDocument(doc, { preview: true }).then((editor) => {
        editor.edit((edit) => edit.insert(new vscode.Position(0, 0), currentText));
      })
    );

    // Show diff **only for the function**
    vscode.commands.executeCommand(
      "vscode.diff",
      leftUri,
      rightUri,
      `Diff: ${entity.type} "${entity.name}" (commit ${picked.description}) ↔ Current`
    ).then(async () => {
      // Ask confirmation to replace
      const confirm = await vscode.window.showInformationMessage(
        `Replace current ${entity.type} "${entity.name}" with selected commit version?`,
        "Yes",
        "No"
      );
      if (confirm === "Yes") {
        const editor = await vscode.window.showTextDocument(uri);
        editor.edit((editBuilder) => {
          const range = new vscode.Range(
            editor.document.positionAt(entity.range[0]),
            editor.document.positionAt(entity.range[1])
          );
          editBuilder.replace(range, replacement);
        });
      }

      // Clean up temp docs
      vscode.workspace.textDocuments.forEach((doc) => {
        if (
          doc.uri.toString() === leftUri.toString() ||
          doc.uri.toString() === rightUri.toString()
        ) {
          vscode.window.showTextDocument(doc).then(() => {
            vscode.commands.executeCommand(
              "workbench.action.revertAndCloseActiveEditor"
            );
          });
        }
      });
    });
  }
);


  // vscode.commands.registerCommand(
  //   "git-rescue.recoverEntity",
  //   async (uri: vscode.Uri, entity: CodeEntity) => {
  //     const workspaceFolders = vscode.workspace.workspaceFolders;
  //     if (!workspaceFolders) return;

  //     const gitUtils = new GitUtils(workspaceFolders[0].uri.fsPath);
  //     const filePath = uri.fsPath;

  //     // Get recent commits
  //     const commits = await gitUtils.getFileCommits(filePath, 20);
  //     if (commits.length === 0) {
  //       vscode.window.showInformationMessage("No commits found for this file.");
  //       return;
  //     }

  //     const picked = await vscode.window.showQuickPick(
  //       commits.map((c) => ({ label: c.message, description: c.hash })),
  //       { placeHolder: `Select a commit for ${entity.type} "${entity.name}"` }
  //     );
  //     if (!picked) return;

  //     const commitContent = await gitUtils.getFileContentAtCommit(
  //       filePath,
  //       picked.description!
  //     );
  //     if (!commitContent) return;

  //     // Find the entity in the commit content
  //     const oldEntities = extractEntities(commitContent);
  //     const match = oldEntities.find(
  //       (e) => e.name === entity.name && e.type === entity.type
  //     );
  //     if (!match) {
  //       vscode.window.showWarningMessage(
  //         `Entity "${entity.name}" not found in commit ${picked.description}`
  //       );
  //       return;
  //     }

  //     const replacement = commitContent.slice(match.range[0], match.range[1]);

  //     // Show diff in a temporary readonly document
  //     const currentDoc = await vscode.workspace.openTextDocument(uri);
  //     const currentText = currentDoc.getText(
  //       new vscode.Range(
  //         currentDoc.positionAt(entity.range[0]),
  //         currentDoc.positionAt(entity.range[1])
  //       )
  //     );

  //     const leftUri = vscode.Uri.parse(`untitled:${entity.name}-from-commit`);
  //     await vscode.workspace.openTextDocument(leftUri).then((doc) =>
  //       vscode.window
  //         .showTextDocument(doc, {
  //           preview: true,
  //           viewColumn: vscode.ViewColumn.Beside,
  //         })
  //         .then((editor) => {
  //           editor.edit((edit) => {
  //             edit.insert(new vscode.Position(0, 0), replacement);
  //           });
  //         })
  //     );

  //     // Show diff editor
  //     vscode.commands
  //       .executeCommand(
  //         "vscode.diff",
  //         leftUri,
  //         uri,
  //         `Diff: ${entity.name} (commit ${picked.description}) ↔ Current`
  //       )
  //       .then(async () => {
  //         // Ask confirmation to replace
  //         const confirm = await vscode.window.showInformationMessage(
  //           `Replace current ${entity.type} "${entity.name}" with selected commit version?`,
  //           "Yes",
  //           "No"
  //         );
  //         if (confirm === "Yes") {
  //           const editor = await vscode.window.showTextDocument(uri);
  //           editor.edit((editBuilder) => {
  //             const range = new vscode.Range(
  //               editor.document.positionAt(entity.range[0]),
  //               editor.document.positionAt(entity.range[1])
  //             );
  //             editBuilder.replace(range, replacement);
  //           });
  //         }

  //         // Close the temporary diff file
  //         vscode.workspace.textDocuments.forEach((doc) => {
  //           if (doc.uri.toString() === leftUri.toString()) {
  //             vscode.window.showTextDocument(doc).then(() => {
  //               vscode.commands.executeCommand(
  //                 "workbench.action.revertAndCloseActiveEditor",
  //               );
  //             });
  //           }
  //         });
  //       });
  //   }
  // );
}

export function deactivate() {}
