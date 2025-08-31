import * as vscode from "vscode";
import { extractEntities, CodeEntity } from "./parser";

export class RecoverCodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];

  // keep the emitter private
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();

  // expose the event
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const text = document.getText();
    const entities = extractEntities(text);
    this.codeLenses = entities.map((e) => {
      const start = document.positionAt(e.range[0]);
      const range = new vscode.Range(start, start); // place above entity
      return new vscode.CodeLens(range, {
        title: `Recover ${e.type} "${e.name}" from commit…`,
        command: "git-rescue.recoverEntity",
        arguments: [document.uri, e],
      });
    });

    return this.codeLenses;
  }

  // call this when you want to refresh the CodeLens
  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}
