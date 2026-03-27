import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import {
  AstExtractRequest,
  AstExtractResponse,
  AstParsedFile,
  SupportedSourceLanguage,
} from './types';

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
  ): Promise<AstParsedFile> {
    const absolutePath = path.join(projectPath, relativePath);
    const sourceText = await fs.readFile(absolutePath, 'utf8');
    const { languageName, grammar } = this.resolveLanguage(relativePath);

    this.parser.setLanguage(grammar as Parameters<Parser['setLanguage']>[0]);
    const tree = this.parser.parse(sourceText);

    return {
      filePath: relativePath,
      language: languageName,
      rootNodeType: tree.rootNode.type,
      hasParseError: tree.rootNode.hasError,
      importsByPackage: {},
      targetPackageImportedApis: [],
      targetPackageCallSites: [],
    };
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
