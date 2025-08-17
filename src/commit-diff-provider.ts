import * as vscode from "vscode";
export class CommitDiffProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(private content: string) {}

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.content;
  }
}
