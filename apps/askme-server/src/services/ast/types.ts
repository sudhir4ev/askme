export type SupportedSourceLanguage = 'javascript' | 'typescript' | 'tsx';

export interface AstExtractRequest {
  projectPath: string;
  targetPackage: string;
}

export interface AstCallSite {
  line: number;
  column: number;
  snippet: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface AstParsedFile {
  filePath: string;
  language: SupportedSourceLanguage;
  rootNodeType: string;
  hasParseError: boolean;
  importsByPackage: Record<string, string[]>;
  targetPackageImportedApis: string[];
  targetPackageCallSites: AstCallSite[];
}

export interface AstExtractResponse {
  targetPackage: string;
  scannedFiles: number;
  files: AstParsedFile[];
}
