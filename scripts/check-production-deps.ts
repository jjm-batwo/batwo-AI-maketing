import path from 'node:path'
import { readFileSync } from 'node:fs'
import {
  collectRuntimeSourceFiles,
  findDevOnlyRuntimeDependencyIssues,
  getAliasPrefixes,
} from '../src/lib/deployment/checkProductionDependencies'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface TsConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>
  }
}

function main() {
  const projectRoot = process.cwd()
  const packageJson = readJson<PackageManifest>(path.join(projectRoot, 'package.json'))
  const tsconfig = readJson<TsConfig>(path.join(projectRoot, 'tsconfig.json'))

  const runtimeFiles = collectRuntimeSourceFiles(projectRoot)
  const issues = findDevOnlyRuntimeDependencyIssues({
    files: runtimeFiles,
    dependencies: Object.keys(packageJson.dependencies ?? {}),
    devDependencies: Object.keys(packageJson.devDependencies ?? {}),
    aliasPrefixes: getAliasPrefixes(tsconfig.compilerOptions?.paths),
  })

  if (issues.length === 0) {
    console.log(`Production dependency check passed: scanned ${runtimeFiles.length} runtime files.`)
    return
  }

  console.error('Production dependency check failed.')
  console.error(
    'Move these packages to dependencies or stop importing them from runtime/build code:'
  )

  for (const issue of issues) {
    console.error(`- ${issue.packageName}`)
    for (const filePath of issue.files) {
      console.error(`  - ${filePath}`)
    }
  }

  process.exitCode = 1
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

main()
