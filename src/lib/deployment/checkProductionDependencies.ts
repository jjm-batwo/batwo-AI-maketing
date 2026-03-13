import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { builtinModules } from 'node:module'

export interface RuntimeSourceFile {
  path: string
  content: string
}

export interface DependencyCheckIssue {
  packageName: string
  files: string[]
}

interface DependencyCheckOptions {
  files: RuntimeSourceFile[]
  dependencies: Iterable<string>
  devDependencies: Iterable<string>
  aliasPrefixes?: string[]
}

const RUNTIME_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const RUNTIME_ROOT_FILES = [
  'instrumentation.ts',
  'instrumentation.js',
  'middleware.ts',
  'middleware.js',
  'next.config.ts',
  'next.config.js',
  'next.config.mjs',
  'proxy.ts',
  'proxy.js',
  'sentry.client.config.ts',
  'sentry.client.config.js',
  'sentry.edge.config.ts',
  'sentry.edge.config.js',
  'sentry.server.config.ts',
  'sentry.server.config.js',
]
const SOURCE_EXCLUDE_SEGMENTS = new Set(['__mocks__', '__tests__', 'generated', 'node_modules'])
const SOURCE_EXCLUDE_SUFFIXES = [
  '.d.ts',
  '.example.ts',
  '.example.tsx',
  '.example.js',
  '.example.jsx',
  '.spec.ts',
  '.spec.tsx',
  '.spec.js',
  '.spec.jsx',
  '.stories.ts',
  '.stories.tsx',
  '.stories.js',
  '.stories.jsx',
  '.test.ts',
  '.test.tsx',
  '.test.js',
  '.test.jsx',
]
const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s*)?["'`]([^"'`]+)["'`]/g,
  /\bexport\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s*)["'`]([^"'`]+)["'`]/g,
  /\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  /\brequire\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
]
const BUILTIN_MODULES = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
])

export function extractImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>()

  for (const pattern of IMPORT_PATTERNS) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) {
      specifiers.add(match[1])
    }
    pattern.lastIndex = 0
  }

  return [...specifiers]
}

export function normalizePackageName(
  specifier: string,
  aliasPrefixes: string[] = []
): string | null {
  if (
    !specifier ||
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    BUILTIN_MODULES.has(specifier)
  ) {
    return null
  }

  if (aliasPrefixes.some((prefix) => specifier.startsWith(prefix))) {
    return null
  }

  if (specifier.startsWith('@')) {
    const [scope, pkg] = specifier.split('/')
    return scope && pkg ? `${scope}/${pkg}` : specifier
  }

  return specifier.split('/')[0] ?? null
}

export function findDevOnlyRuntimeDependencyIssues(
  options: DependencyCheckOptions
): DependencyCheckIssue[] {
  const dependencyNames = new Set(options.dependencies)
  const devDependencyNames = new Set(options.devDependencies)
  const packageToFiles = new Map<string, Set<string>>()

  for (const file of options.files) {
    const importedPackages = new Set(
      extractImportSpecifiers(file.content)
        .map((specifier) => normalizePackageName(specifier, options.aliasPrefixes ?? []))
        .filter((value): value is string => value !== null)
    )

    for (const packageName of importedPackages) {
      if (dependencyNames.has(packageName) || !devDependencyNames.has(packageName)) {
        continue
      }

      const files = packageToFiles.get(packageName) ?? new Set<string>()
      files.add(file.path)
      packageToFiles.set(packageName, files)
    }
  }

  return [...packageToFiles.entries()]
    .map(([packageName, files]) => ({
      packageName,
      files: [...files].sort(),
    }))
    .sort((left, right) => left.packageName.localeCompare(right.packageName))
}

export function getAliasPrefixes(paths: Record<string, string[]> = {}): string[] {
  return Object.keys(paths)
    .map((key) => (key.endsWith('/*') ? key.slice(0, -1) : key))
    .sort()
}

export function collectRuntimeSourceFiles(projectRoot: string): RuntimeSourceFile[] {
  const runtimeFiles: RuntimeSourceFile[] = []
  const srcRoot = path.join(projectRoot, 'src')

  if (exists(srcRoot)) {
    runtimeFiles.push(...walkRuntimeDirectory(projectRoot, srcRoot))
  }

  for (const relativePath of RUNTIME_ROOT_FILES) {
    const absolutePath = path.join(projectRoot, relativePath)
    if (!exists(absolutePath)) {
      continue
    }

    runtimeFiles.push({
      path: relativePath,
      content: readFileSync(absolutePath, 'utf8'),
    })
  }

  return runtimeFiles.sort((left, right) => left.path.localeCompare(right.path))
}

function walkRuntimeDirectory(projectRoot: string, currentPath: string): RuntimeSourceFile[] {
  const entries = readdirSync(currentPath, { withFileTypes: true })
  const runtimeFiles: RuntimeSourceFile[] = []

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name)
    if (entry.isDirectory()) {
      if (SOURCE_EXCLUDE_SEGMENTS.has(entry.name)) {
        continue
      }

      runtimeFiles.push(...walkRuntimeDirectory(projectRoot, absolutePath))
      continue
    }

    if (!entry.isFile() || !isRuntimeSourceFile(entry.name)) {
      continue
    }

    runtimeFiles.push({
      path: path.relative(projectRoot, absolutePath),
      content: readFileSync(absolutePath, 'utf8'),
    })
  }

  return runtimeFiles
}

function isRuntimeSourceFile(fileName: string): boolean {
  if (SOURCE_EXCLUDE_SUFFIXES.some((suffix) => fileName.endsWith(suffix))) {
    return false
  }

  return RUNTIME_FILE_EXTENSIONS.has(path.extname(fileName))
}

function exists(targetPath: string): boolean {
  try {
    const stats = statSync(targetPath)
    return stats.isFile() || stats.isDirectory()
  } catch {
    return false
  }
}
