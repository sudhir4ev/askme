import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import {
  AstExtractRequest,
  AstExtractResponse,
  AstParsedFile,
  AstCallSite,
  SupportedSourceLanguage,
} from './types';

interface ImportBinding {
  packageName: string;
  importedName: string;
}

@Injectable()
export class AstService {
  private readonly parser = new Parser();

  async extract({
    projectPath,
    targetPackage,
  }: AstExtractRequest): Promise<AstExtractResponse> {
    if (!projectPath?.trim()) {
      throw new BadRequestException('projectPath is required');
    }

    if (!targetPackage?.trim()) {
      throw new BadRequestException('targetPackage is required');
    }

    const normalizedProjectPath = projectPath.trim();
    const sourceFiles = await this.discoverSourceFiles(normalizedProjectPath);
    const files: AstParsedFile[] = [];

    for (const relativePath of sourceFiles) {
      const parsedFile = await this.parseSourceFile(
        normalizedProjectPath,
        relativePath,
        targetPackage.trim(),
      );
      files.push(parsedFile);
    }

    return {
      targetPackage: targetPackage.trim(),
      scannedFiles: files.length,
      files,
    };
  }

  private async discoverSourceFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    for await (const relativePath of fs.glob('**/*.{js,jsx,ts,tsx}', {
      cwd: projectPath,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
      ],
      withFileTypes: false,
    })) {
      files.push(String(relativePath));
    }

    files.sort((left, right) => left.localeCompare(right));
    return files;
  }

  private async parseSourceFile(
    projectPath: string,
    relativePath: string,
    targetPackage: string,
  ): Promise<AstParsedFile> {
    const absolutePath = path.join(projectPath, relativePath);
    const sourceText = await fs.readFile(absolutePath, 'utf8');
    const { languageName, grammar } = this.resolveLanguage(relativePath);

    this.parser.setLanguage(grammar as Parameters<Parser['setLanguage']>[0]);
    const tree = this.parser.parse(sourceText);
    const importsByPackage = this.extractImportsByPackage(sourceText);
    const importBindings = this.extractImportBindings(sourceText);
    const targetPackageImportedApis = this.extractTargetImportedApis(
      importBindings,
      targetPackage,
    );
    const targetPackageCallSites = this.extractTargetPackageCallSites({
      treeRoot: tree.rootNode,
      sourceText,
      importBindings,
      targetPackage,
    });

    return {
      filePath: relativePath,
      language: languageName,
      rootNodeType: tree.rootNode.type,
      hasParseError: tree.rootNode.hasError,
      importsByPackage,
      targetPackageImportedApis,
      targetPackageCallSites,
    };
  }

  private extractImportsByPackage(
    sourceText: string,
  ): Record<string, string[]> {
    const importsByPackage = new Map<string, Set<string>>();
    const importBindings = this.extractImportBindings(sourceText);

    for (const [localName, binding] of importBindings.entries()) {
      if (!importsByPackage.has(binding.packageName)) {
        importsByPackage.set(binding.packageName, new Set<string>());
      }
      importsByPackage.get(binding.packageName)?.add(localName);
    }

    return Object.fromEntries(
      [...importsByPackage.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([pkg, names]) => [
          pkg,
          [...names].sort((a, b) => a.localeCompare(b)),
        ]),
    );
  }

  private extractImportBindings(
    sourceText: string,
  ): Map<string, ImportBinding> {
    const bindings = new Map<string, ImportBinding>();

    // ESM imports
    const importWithFromRegex =
      /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
    for (const match of sourceText.matchAll(importWithFromRegex)) {
      const clause = match[1]?.trim();
      const packageName = match[2];
      if (!clause || !packageName) {
        continue;
      }

      this.addBindingsFromImportClause(bindings, clause, packageName);
    }

    // const x = require('pkg')
    const requireDefaultRegex =
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const match of sourceText.matchAll(requireDefaultRegex)) {
      const localName = match[1];
      const packageName = match[2];
      if (!localName || !packageName) {
        continue;
      }
      bindings.set(localName, { packageName, importedName: 'default' });
    }

    // const { a, b: c } = require('pkg')
    const requireDestructuredRegex =
      /\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const match of sourceText.matchAll(requireDestructuredRegex)) {
      const destructured = match[1];
      const packageName = match[2];
      if (!destructured || !packageName) {
        continue;
      }

      for (const rawEntry of destructured.split(',')) {
        const entry = rawEntry.trim();
        if (!entry) {
          continue;
        }

        const [imported, alias] = entry.split(':').map((token) => token.trim());
        const importedName = imported?.replace(/\s+/g, '');
        const localName = (alias || importedName)?.replace(/\s+/g, '');
        if (!importedName || !localName) {
          continue;
        }
        bindings.set(localName, { packageName, importedName });
      }
    }

    return bindings;
  }

  private addBindingsFromImportClause(
    bindings: Map<string, ImportBinding>,
    clause: string,
    packageName: string,
  ): void {
    const namedMatch = clause.match(/\{([^}]+)\}/);
    if (namedMatch?.[1]) {
      for (const rawEntry of namedMatch[1].split(',')) {
        const entry = rawEntry.trim();
        if (!entry) {
          continue;
        }
        const [imported, alias] = entry
          .split(/\s+as\s+/)
          .map((token) => token.trim());
        const importedName = imported?.replace(/\s+/g, '');
        const localName = (alias || importedName)?.replace(/\s+/g, '');
        if (!importedName || !localName) {
          continue;
        }
        bindings.set(localName, { packageName, importedName });
      }
    }

    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch?.[1]) {
      bindings.set(namespaceMatch[1], { packageName, importedName: '*' });
    }

    const defaultClause = clause.split(',')[0]?.trim();
    const hasDefaultImport =
      defaultClause &&
      !defaultClause.startsWith('{') &&
      !defaultClause.startsWith('*') &&
      /^[A-Za-z_$][\w$]*$/.test(defaultClause);

    if (hasDefaultImport) {
      bindings.set(defaultClause, { packageName, importedName: 'default' });
    }
  }

  private extractTargetImportedApis(
    importBindings: Map<string, ImportBinding>,
    targetPackage: string,
  ): string[] {
    const apis = new Set<string>();
    for (const binding of importBindings.values()) {
      if (binding.packageName !== targetPackage) {
        continue;
      }
      apis.add(binding.importedName);
    }
    return [...apis].sort((a, b) => a.localeCompare(b));
  }

  private extractTargetPackageCallSites({
    treeRoot,
    sourceText,
    importBindings,
    targetPackage,
  }: {
    treeRoot: Parser.SyntaxNode;
    sourceText: string;
    importBindings: Map<string, ImportBinding>;
    targetPackage: string;
  }): AstCallSite[] {
    const callSites: AstCallSite[] = [];

    this.walkTree(treeRoot, (node) => {
      if (node.type !== 'call_expression') {
        return;
      }

      const functionNode = node.childForFieldName('function');
      if (!functionNode) {
        return;
      }

      const resolved = this.resolveCall(
        functionNode,
        importBindings,
        sourceText,
      );
      if (!resolved || resolved.packageName !== targetPackage) {
        return;
      }

      const position = node.startPosition;
      callSites.push(
        this.buildCallSite({
          node,
          sourceText,
          line: position.row + 1,
          column: position.column + 1,
        }),
      );
    });

    return callSites;
  }

  private resolveCall(
    calleeNode: Parser.SyntaxNode,
    importBindings: Map<string, ImportBinding>,
    sourceText: string,
  ): ImportBinding | undefined {
    if (calleeNode.type === 'identifier') {
      return importBindings.get(this.nodeText(calleeNode, sourceText));
    }

    if (calleeNode.type !== 'member_expression') {
      return undefined;
    }

    const objectNode = calleeNode.childForFieldName('object');
    const propertyNode = calleeNode.childForFieldName('property');
    if (!objectNode || !propertyNode || objectNode.type !== 'identifier') {
      return undefined;
    }

    const baseIdentifier = this.nodeText(objectNode, sourceText);
    const binding = importBindings.get(baseIdentifier);
    if (!binding) {
      return undefined;
    }

    if (binding.importedName !== '*' && binding.importedName !== 'default') {
      return binding;
    }

    return {
      packageName: binding.packageName,
      importedName: this.nodeText(propertyNode, sourceText),
    };
  }

  private buildCallSite({
    node,
    sourceText,
    line,
    column,
  }: {
    node: Parser.SyntaxNode;
    sourceText: string;
    line: number;
    column: number;
  }): AstCallSite {
    const lines = sourceText.split(/\r?\n/);
    const contextRadius = 2;
    const contextBefore = lines.slice(
      Math.max(0, line - 1 - contextRadius),
      Math.max(0, line - 1),
    );
    const contextAfter = lines.slice(line, line + contextRadius);

    return {
      line,
      column,
      snippet: this.nodeText(node, sourceText),
      contextBefore,
      contextAfter,
    };
  }

  private nodeText(node: Parser.SyntaxNode, sourceText: string): string {
    return sourceText.slice(node.startIndex, node.endIndex);
  }

  private walkTree(
    node: Parser.SyntaxNode,
    visit: (node: Parser.SyntaxNode) => void,
  ): void {
    visit(node);
    for (const child of node.namedChildren) {
      this.walkTree(child, visit);
    }
  }

  private resolveLanguage(relativePath: string): {
    languageName: SupportedSourceLanguage;
    grammar: unknown;
  } {
    if (relativePath.endsWith('.ts')) {
      return {
        languageName: 'typescript',
        grammar: JavaScript,
      };
    }

    if (relativePath.endsWith('.tsx')) {
      return {
        languageName: 'tsx',
        grammar: JavaScript,
      };
    }

    return {
      languageName: 'javascript',
      grammar: JavaScript,
    };
  }
}
