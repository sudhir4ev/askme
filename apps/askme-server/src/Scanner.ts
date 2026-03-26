import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec as execChildProcess } from 'child_process';
const exec = promisify(execChildProcess);

class Scanner {
  private srcPath: string;

  private constructor(srcPath: string) {
    this.srcPath = srcPath;
  }

  static getScannerForPath(projectPath: string) {
    return new Scanner(projectPath);
  }

  private getPackageJson(projectPath: string) {
    const packageJson = fs.readFileSync(
      path.join(projectPath, 'package.json'),
      'utf-8',
    );
    const packageJsonContent = JSON.parse(packageJson);
    return packageJsonContent;
  }

  async parseManifest() {
    return executeVulnerabilityScanSourcePath(this.srcPath);
  }
}

async function executeVulnerabilityScanSourcePath(sourcePath: string) {
  const command = path.resolve(
    __dirname,
    '..',
    '.versions',
    'osv-scanner_darwin_arm64-v2.3.3',
  );
  const args = [sourcePath, '--format', 'json'];
  const commandString = [command, ...args].join(' ');
  console.log(commandString);

  const { stdout, stderr, resultCode } = await exec(commandString, {})
    .then(({ stdout, stderr }) => ({
      stdout,
      stderr,
      resultCode: 0,
    }))
    .catch((error) => {
      if (error.code === 1) {
        return { stdout: error.stdout, resultCode: error.code };
      }
      return { stdout: '', stderr: error.message, resultCode: error.code };
    });

  if (stderr) {
    throw new Error(stderr);
  }

  const result = JSON.parse(stdout);

  const packages = processVulnerabilityScanResult(result);

  return {
    packages,
    error: stderr,
    resultCode,
  };
}

export default Scanner;

function processVulnerabilityScanResult(result: any) {
  const packages = result.results.map((pkg: any) => pkg.packages).flat();
  return packages;
}
