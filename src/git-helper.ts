import * as vscode from "vscode";
import simpleGit, {
  SimpleGit,
  DefaultLogFields,
  ListLogLine,
} from "simple-git";
import * as path from "path";

export class GitUtils {
  private git: SimpleGit;

  constructor(private workspaceRoot: string) {
    this.git = simpleGit(this.workspaceRoot);
  }

  /**
   * Check if current workspace is a git repo
   */
  async isRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * Get recent commits for a given file
   */
  async getFileCommits(
    filePath: string,
    limit = 20
  ): Promise<readonly (DefaultLogFields & ListLogLine)[]> {
    const relPath = path.relative(this.workspaceRoot, filePath);
    const log = await this.git.log({ file: relPath, n: limit });
    return log.all;
  }
  /**
   * Get file content from a specific commit
   */
  async getFileContentAtCommit(
    filePath: string,
    commitHash: string
  ): Promise<string | null> {
    try {
      const relPath = path.relative(this.workspaceRoot, filePath);
      const content = await this.git.show([`${commitHash}:${relPath}`]);
      return content;
    } catch (err) {
      vscode.window.showErrorMessage(
        `Failed to get file content at commit ${commitHash}: ${String(err)}`
      );
      return null;
    }
  }
}
