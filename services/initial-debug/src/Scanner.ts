const { promisify } = require('util')
import fs from 'fs'
import path from 'path'
import { stdout } from 'process'

const exec = promisify(require('child_process').exec)

class Scanner {
   private srcPath: string

   private constructor(srcPath: string) {
      this.srcPath = srcPath
   }

   static getScannerForPath(projectPath: string) {
      return new Scanner(projectPath)
   }

   private getPackageJson(projectPath: string) {
      const packageJson = fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
      const packageJsonContent = JSON.parse(packageJson)
      return packageJsonContent
   }

   async parseManifest() {
      // const manifest = this.getPackageJson(this.srcPath)
      // const dependencies = {
      //    ...manifest.dependencies,
      //    ...manifest.devDependencies,
      // }

      // // Query OSV for vulnerabilities
      // for (const [name, version] of Object.entries(dependencies)) {
      //    const response = await queryVulnerabilities({
      //       package: { name, ecosystem: 'npm' },
      //       version: version as string,
      //    })
      //    console.log(response)
      // }
      return executeVulnerabilityScanSourcePath(this.srcPath)
   }
}

async function executeVulnerabilityScanSourcePath(sourcePath: string) {
   const command = path.resolve(__dirname, '..', '.versions', 'osv-scanner_darwin_arm64-v2.3.3')
   const args = [sourcePath, '--format', 'json']
   const commandString = [command, ...args].join(' ')
   console.log(commandString)

   const { stdout, stderr, resultCode } = await exec(commandString, { stdout: 'pipe' })
      .then(({ stdout, stderr }) => ({
         stdout,
         stderr,
         resultCode: 0,
      }))
      .catch((error) => {
         if (error.code === 1) {
            return { stdout: error.stdout, resultCode: error.code }
         }
         return { stdout: '', stderr: error.message, resultCode: error.code }
      })

   if (stderr) {
      throw new Error(stderr)
   }

   const result = JSON.parse(stdout)

   return {
      result,
      error: stderr,
      resultCode,
   }
}

export default Scanner
