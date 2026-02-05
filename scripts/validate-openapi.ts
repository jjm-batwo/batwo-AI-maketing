#!/usr/bin/env tsx
/**
 * OpenAPI Specification Validator
 *
 * OpenAPI 스펙 파일의 유효성을 검증하고 문서를 생성합니다.
 *
 * Usage:
 *   npm run api:validate           # OpenAPI 스펙 검증
 *   npm run api:docs               # API 문서 생성
 */

import fs from 'fs'
import path from 'path'
import yaml from 'yaml'

interface ValidationError {
  message: string
  path?: string
  severity: 'error' | 'warning'
}

const errors: ValidationError[] = []
const warnings: ValidationError[] = []

function addError(message: string, path?: string) {
  errors.push({ message, path, severity: 'error' })
}

function addWarning(message: string, path?: string) {
  warnings.push({ message, path, severity: 'warning' })
}

function validateOpenAPIFile(filePath: string) {
  console.log(`📄 Validating: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    addError(`File not found: ${filePath}`)
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const spec = yaml.parse(content)
    return spec
  } catch (err) {
    addError(`Failed to parse YAML: ${err instanceof Error ? err.message : 'Unknown error'}`, filePath)
    return null
  }
}

function validateMainSpec(spec: any) {
  console.log('\n🔍 Validating main OpenAPI spec...')

  // Check OpenAPI version
  if (!spec.openapi) {
    addError('Missing openapi version')
  } else if (!spec.openapi.startsWith('3.0')) {
    addWarning(`OpenAPI version ${spec.openapi} detected. Expected 3.0.x`)
  }

  // Check info
  if (!spec.info) {
    addError('Missing info section')
  } else {
    if (!spec.info.title) addError('Missing info.title')
    if (!spec.info.version) addError('Missing info.version')
    if (!spec.info.description) addWarning('Missing info.description')
  }

  // Check servers
  if (!spec.servers || spec.servers.length === 0) {
    addWarning('No servers defined')
  }

  // Check paths
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    addError('No paths defined')
  } else {
    console.log(`   ✓ Found ${Object.keys(spec.paths).length} endpoints`)
  }

  // Check components
  if (!spec.components) {
    addWarning('No components defined')
  } else {
    if (spec.components.schemas) {
      console.log(`   ✓ Found ${Object.keys(spec.components.schemas).length} schemas`)
    }
    if (spec.components.securitySchemes) {
      console.log(`   ✓ Found ${Object.keys(spec.components.securitySchemes).length} security schemes`)
    }
  }

  // Check tags
  if (!spec.tags || spec.tags.length === 0) {
    addWarning('No tags defined')
  } else {
    console.log(`   ✓ Found ${spec.tags.length} tags`)
  }
}

function validateSchemaFiles() {
  console.log('\n🔍 Validating schema files...')

  const schemasDir = path.join(process.cwd(), 'docs/api/schemas')

  if (!fs.existsSync(schemasDir)) {
    addError(`Schemas directory not found: ${schemasDir}`)
    return
  }

  const schemaFiles = fs.readdirSync(schemasDir).filter(f => f.endsWith('.yaml'))

  if (schemaFiles.length === 0) {
    addWarning('No schema files found')
    return
  }

  console.log(`   Found ${schemaFiles.length} schema files`)

  schemaFiles.forEach(file => {
    const filePath = path.join(schemasDir, file)
    const spec = validateOpenAPIFile(filePath)

    if (spec) {
      const schemaCount = Object.keys(spec).length
      console.log(`   ✓ ${file}: ${schemaCount} schemas`)
    }
  })
}

function validateReferences(spec: any) {
  console.log('\n🔍 Validating schema references...')

  const refs = new Set<string>()
  const definedSchemas = new Set<string>()

  // Collect defined schemas
  if (spec.components?.schemas) {
    Object.keys(spec.components.schemas).forEach(schema => {
      definedSchemas.add(`#/components/schemas/${schema}`)
    })
  }

  // Find all $ref usages
  function findRefs(obj: any, path = '') {
    if (typeof obj !== 'object' || obj === null) return

    if (obj.$ref) {
      refs.add(obj.$ref)
    }

    for (const key in obj) {
      findRefs(obj[key], `${path}.${key}`)
    }
  }

  findRefs(spec)

  // Check external file references
  const externalRefs = Array.from(refs).filter(ref => ref.startsWith('./schemas/'))

  if (externalRefs.length > 0) {
    console.log(`   Found ${externalRefs.length} external schema references`)

    externalRefs.forEach(ref => {
      const [filePath, schemaPath] = ref.split('#')
      const fullPath = path.join(process.cwd(), 'docs/api', filePath)

      if (!fs.existsSync(fullPath)) {
        addError(`Referenced schema file not found: ${filePath}`)
      }
    })
  }
}

function printResults() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 Validation Results')
  console.log('='.repeat(60))

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validations passed!')
    return true
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`)
    errors.forEach(err => {
      console.log(`   - ${err.message}${err.path ? ` (${err.path})` : ''}`)
    })
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`)
    warnings.forEach(warn => {
      console.log(`   - ${warn.message}${warn.path ? ` (${warn.path})` : ''}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  return errors.length === 0
}

function generateDocs() {
  console.log('\n📚 Generating API documentation...')
  console.log('\n💡 To view the API documentation:')
  console.log('   1. Install Swagger CLI: npm install -g @apidevtools/swagger-cli')
  console.log('   2. Run: swagger-cli serve docs/api/openapi.yaml')
  console.log('   3. Open: http://localhost:8080')
  console.log('\n   Or use online tools:')
  console.log('   - Swagger Editor: https://editor.swagger.io/')
  console.log('   - Redoc: https://redocly.github.io/redoc/')
}

// Main execution
async function main() {
  console.log('🚀 Starting OpenAPI Validation\n')

  const openApiPath = path.join(process.cwd(), 'docs/api/openapi.yaml')

  // Validate main spec
  const spec = validateOpenAPIFile(openApiPath)

  if (spec) {
    validateMainSpec(spec)
    validateReferences(spec)
  }

  // Validate schema files
  validateSchemaFiles()

  // Print results
  const success = printResults()

  // Generate docs info
  if (success) {
    generateDocs()
  }

  // Exit with appropriate code
  process.exit(success ? 0 : 1)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
