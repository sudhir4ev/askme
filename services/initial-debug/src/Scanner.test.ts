import { describe, it, expect } from 'vitest'
import Scanner from './Scanner'
import path from 'path'

describe('Scanner', () => {
   it('should be able to get a scanner for a path', async () => {
      const scanner = Scanner.getScannerForPath(path.resolve(__dirname, '..', '..', '..'))
      const parseResult = await scanner.parseManifest()
      expect(parseResult).toBeDefined()
      expect(parseResult.result).toBeInstanceOf(Object)
   })
})
