import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec as execChildProcess } from 'child_process';
import assert from 'assert';
const exec = promisify(execChildProcess);

class OsvScanner {
  constructor(
    private readonly srcPath: string,
    private readonly osvScannerExecutablePath: string,
  ) {}

  async parseManifest() {
    return executeVulnerabilityScanSourcePath(
      this.srcPath,
      this.osvScannerExecutablePath,
    );
  }
}

async function executeVulnerabilityScanSourcePath(
  sourcePath: string,
  osvScannerExecutablePath: string,
) {
  assert(osvScannerExecutablePath, 'osvScannerExecutablePath is required');
  assert(
    fs.existsSync(path.resolve(this.osvScannerExecutablePath)),
    'osvScannerExecutablePath does not exist',
  );

  const command = path.resolve(this.osvScannerExecutablePath);
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

  return {
    result,
    error: stderr,
    resultCode,
  };
}

export default OsvScanner;
