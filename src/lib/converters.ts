import protobuf from 'protobufjs';

export type ConversionFormat = 'javascript' | 'json-schema' | 'typescript' | 'python' | 'java' | 'go' | 'csharp' | 'cpp';

export interface ConversionResult {
  success: boolean;
  format: ConversionFormat;
  output?: string;
  error?: string;
}

// Enhanced error result with protolint suggestion
export interface EnhancedConversionResult extends ConversionResult {
  isParsingError?: boolean;
  protolintSuggested?: boolean;
  userFriendlyMessage?: string;
  technicalError?: string;
}

export interface ConversionRequest {
  content: string;
  format: ConversionFormat;
}

// Helper function to generate JSON Schema from protobuf type
function generateJsonSchema(type: protobuf.Type): any {
  const schema: any = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const field of type.fieldsArray) {
    let fieldSchema: any = {};
    
    // Handle different protobuf types
    switch (field.type) {
      case 'string':
        fieldSchema.type = 'string';
        break;
      case 'int32':
      case 'int64':
      case 'uint32':
      case 'uint64':
      case 'sint32':
      case 'sint64':
      case 'fixed32':
      case 'fixed64':
      case 'sfixed32':
      case 'sfixed64':
        fieldSchema.type = 'integer';
        break;
      case 'float':
      case 'double':
        fieldSchema.type = 'number';
        break;
      case 'bool':
        fieldSchema.type = 'boolean';
        break;
      case 'bytes':
        fieldSchema.type = 'string';
        fieldSchema.format = 'byte';
        break;
      default:
        // For message types, reference or inline schema
        fieldSchema.type = 'object';
        break;
    }

    // Handle repeated fields
    if (field.repeated) {
      fieldSchema = {
        type: 'array',
        items: fieldSchema
      };
    }

    // Add field description if available
    if ((field as any).comment) {
      fieldSchema.description = (field as any).comment;
    }

    schema.properties[field.name] = fieldSchema;

    // Add to required if not optional and not repeated
    if (!field.repeated && (field as any).required !== false) {
      schema.required.push(field.name);
    }
  }

  // Add title and description
  schema.title = type.name;
  if ((type as any).comment) {
    schema.description = (type as any).comment;
  }

  return schema;
}

// Helper function to generate JavaScript class from protobuf type
function generateJavaScript(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let jsCode = `/**\n * ${className} class generated from proto definition\n */\n`;
  jsCode += `class ${className} {\n`;
  
  // Constructor
  jsCode += `  constructor(data = {}) {\n`;
  for (const field of fields) {
    const defaultValue = getDefaultValue(field.type, field.repeated);
    jsCode += `    this.${field.name} = data.${field.name} ?? ${defaultValue};\n`;
  }
  jsCode += `  }\n\n`;

  // Validation method
  jsCode += `  validate() {\n`;
  jsCode += `    const errors = [];\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      jsCode += `    if (this.${field.name} === undefined || this.${field.name} === null) {\n`;
      jsCode += `      errors.push('${field.name} is required');\n`;
      jsCode += `    }\n`;
    }
  }
  jsCode += `    return errors;\n`;
  jsCode += `  }\n\n`;

  // toJSON method
  jsCode += `  toJSON() {\n`;
  jsCode += `    return {\n`;
  for (const field of fields) {
    jsCode += `      ${field.name}: this.${field.name},\n`;
  }
  jsCode += `    };\n`;
  jsCode += `  }\n`;

  jsCode += `}\n\n`;
  jsCode += `export default ${className};\n`;

  return jsCode;
}

function getDefaultValue(type: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (type) {
    case 'string': return "''";
    case 'int32':
    case 'int64':
    case 'uint32':
    case 'uint64':
    case 'sint32':
    case 'sint64':
    case 'fixed32':
    case 'fixed64':
    case 'sfixed32':
    case 'sfixed64':
    case 'float':
    case 'double':
      return '0';
    case 'bool': return 'false';
    case 'bytes': return "''";
    default: return 'null';
  }
}

// Helper function to generate TypeScript interface
function generateTypeScript(type: protobuf.Type): string {
  const interfaceName = type.name;
  const fields = type.fieldsArray;

  let tsCode = `/**\n * ${interfaceName} interface generated from proto definition\n */\n`;
  tsCode += `export interface ${interfaceName} {\n`;
  
  for (const field of fields) {
    const tsType = getTypeScriptType(field.type);
    const optional = field.repeated || (field as any).optional ? '?' : '';
    const arrayType = field.repeated ? `${tsType}[]` : tsType;
    
    if ((field as any).comment) {
      tsCode += `  /** ${(field as any).comment} */\n`;
    }
    tsCode += `  ${field.name}${optional}: ${arrayType};\n`;
  }
  
  tsCode += `}\n`;
  return tsCode;
}

function getTypeScriptType(protoType: string): string {
  switch (protoType) {
    case 'string': return 'string';
    case 'int32':
    case 'int64':
    case 'uint32':
    case 'uint64':
    case 'sint32':
    case 'sint64':
    case 'fixed32':
    case 'fixed64':
    case 'sfixed32':
    case 'sfixed64':
    case 'float':
    case 'double':
      return 'number';
    case 'bool': return 'boolean';
    case 'bytes': return 'Uint8Array | string';
    default: return 'any'; // For message types
  }
}

// Helper function to generate Python dataclass from protobuf type
function generatePython(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let pyCode = `from dataclasses import dataclass\nfrom typing import Optional, List\n\n`;
  pyCode += `@dataclass\nclass ${className}:\n`;
  pyCode += `    """${className} dataclass generated from proto definition"""\n`;
  
  // Field declarations
  for (const field of fields) {
    const pyType = getPythonType(field.type, field.repeated);
    const defaultValue = getPythonDefaultValue(field.type, field.repeated);
    
    if ((field as any).comment) {
      pyCode += `    # ${(field as any).comment}\n`;
    }
    pyCode += `    ${field.name}: ${pyType} = ${defaultValue}\n`;
  }

  // Add validation method
  pyCode += `\n    def validate(self) -> List[str]:\n`;
  pyCode += `        """Validate the dataclass and return list of errors"""\n`;
  pyCode += `        errors = []\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      pyCode += `        if self.${field.name} is None:\n`;
      pyCode += `            errors.append("${field.name} is required")\n`;
    }
  }
  pyCode += `        return errors\n`;

  // Add to_dict method
  pyCode += `\n    def to_dict(self) -> dict:\n`;
  pyCode += `        """Convert to dictionary representation"""\n`;
  pyCode += `        return {\n`;
  for (const field of fields) {
    pyCode += `            "${field.name}": self.${field.name},\n`;
  }
  pyCode += `        }\n`;

  return pyCode;
}

function getPythonType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'str'; break;
    case 'int32':
    case 'int64':
    case 'uint32':
    case 'uint64':
    case 'sint32':
    case 'sint64':
    case 'fixed32':
    case 'fixed64':
    case 'sfixed32':
    case 'sfixed64':
      baseType = 'int'; break;
    case 'float':
    case 'double':
      baseType = 'float'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'bytes'; break;
    default: baseType = 'dict'; // For message types
  }

  if (repeated) {
    return `List[${baseType}]`;
  }
  
  return `Optional[${baseType}]`;
}

function getPythonDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  return 'None';
}

// Helper function to generate Java class from protobuf type
function generateJava(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let javaCode = `/**\n * ${className} class generated from proto definition\n */\n`;
  javaCode += `public class ${className} {\n\n`;
  
  // Field declarations
  for (const field of fields) {
    const javaType = getJavaType(field.type, field.repeated);
    if ((field as any).comment) {
      javaCode += `    /** ${(field as any).comment} */\n`;
    }
    javaCode += `    private ${javaType} ${field.name};\n`;
  }
  javaCode += '\n';

  // Default constructor
  javaCode += `    public ${className}() {\n`;
  for (const field of fields) {
    const defaultValue = getJavaDefaultValue(field.type, field.repeated);
    javaCode += `        this.${field.name} = ${defaultValue};\n`;
  }
  javaCode += `    }\n\n`;

  // Builder pattern
  javaCode += `    public static class Builder {\n`;
  javaCode += `        private ${className} instance = new ${className}();\n\n`;
  for (const field of fields) {
    const javaType = getJavaType(field.type, field.repeated);
    javaCode += `        public Builder ${field.name}(${javaType} ${field.name}) {\n`;
    javaCode += `            instance.${field.name} = ${field.name};\n`;
    javaCode += `            return this;\n`;
    javaCode += `        }\n\n`;
  }
  javaCode += `        public ${className} build() {\n`;
  javaCode += `            return instance;\n`;
  javaCode += `        }\n`;
  javaCode += `    }\n\n`;

  javaCode += `    public static Builder newBuilder() {\n`;
  javaCode += `        return new Builder();\n`;
  javaCode += `    }\n\n`;

  // Getters and setters
  for (const field of fields) {
    const javaType = getJavaType(field.type, field.repeated);
    const capitalizedName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    
    // Getter
    javaCode += `    public ${javaType} get${capitalizedName}() {\n`;
    javaCode += `        return ${field.name};\n`;
    javaCode += `    }\n\n`;
    
    // Setter
    javaCode += `    public void set${capitalizedName}(${javaType} ${field.name}) {\n`;
    javaCode += `        this.${field.name} = ${field.name};\n`;
    javaCode += `    }\n\n`;
  }

  javaCode += `}\n`;
  return javaCode;
}

function getJavaType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'long'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'int'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'long'; break;
    case 'float': baseType = 'float'; break;
    case 'double': baseType = 'double'; break;
    case 'bool': baseType = 'boolean'; break;
    case 'bytes': baseType = 'byte[]'; break;
    default: baseType = 'Object'; // For message types
  }

  if (repeated) {
    return `java.util.List<${baseType}>`;
  }
  
  return baseType;
}

function getJavaDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return 'new java.util.ArrayList<>()';
  
  switch (protoType) {
    case 'string': return '""';
    case 'int32':
    case 'sint32':
    case 'sfixed32':
    case 'uint32':
    case 'fixed32':
      return '0';
    case 'int64':
    case 'sint64':
    case 'sfixed64':
    case 'uint64':
    case 'fixed64':
      return '0L';
    case 'float': return '0.0f';
    case 'double': return '0.0';
    case 'bool': return 'false';
    case 'bytes': return 'new byte[0]';
    default: return 'null';
  }
}

// Helper function to generate Go struct from protobuf type
function generateGo(type: protobuf.Type): string {
  const structName = type.name;
  const fields = type.fieldsArray;

  let goCode = `// ${structName} struct generated from proto definition\n`;
  goCode += `type ${structName} struct {\n`;
  
  for (const field of fields) {
    const goType = getGoType(field.type, field.repeated);
    const jsonTag = field.name.toLowerCase();
    const protoTag = field.id;
    
    if ((field as any).comment) {
      goCode += `    // ${(field as any).comment}\n`;
    }
    
    // Go uses PascalCase for exported fields
    const fieldName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    goCode += `    ${fieldName} ${goType} \`json:"${jsonTag}" protobuf:"${field.type},${protoTag}"\`\n`;
  }
  
  goCode += `}\n\n`;

  // Add validation method
  goCode += `// Validate validates the ${structName} struct\n`;
  goCode += `func (s *${structName}) Validate() []string {\n`;
  goCode += `    var errors []string\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const fieldName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
      if (field.type === 'string') {
        goCode += `    if s.${fieldName} == "" {\n`;
        goCode += `        errors = append(errors, "${field.name} is required")\n`;
        goCode += `    }\n`;
      }
    }
  }
  goCode += `    return errors\n`;
  goCode += `}\n`;

  return goCode;
}

function getGoType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'string'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'int32'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'int64'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'uint32'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'uint64'; break;
    case 'float': baseType = 'float32'; break;
    case 'double': baseType = 'float64'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = '[]byte'; break;
    default: baseType = 'interface{}'; // For message types
  }

  if (repeated) {
    return `[]${baseType}`;
  }
  
  // For proto3, fields are pointers for optional behavior
  if (protoType !== 'string' && protoType !== 'bytes' && !repeated) {
    return `*${baseType}`;
  }
  
  return baseType;
}

// Helper function to generate C# class from protobuf type
function generateCSharp(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let csharpCode = `using System;\nusing System.Collections.Generic;\nusing System.ComponentModel.DataAnnotations;\nusing System.Text.Json.Serialization;\n\n`;
  csharpCode += `/// <summary>\n/// ${className} class generated from proto definition\n/// </summary>\n`;
  csharpCode += `public class ${className}\n{\n`;
  
  for (const field of fields) {
    const csharpType = getCSharpType(field.type, field.repeated);
    
    if ((field as any).comment) {
      csharpCode += `    /// <summary>\n    /// ${(field as any).comment}\n    /// </summary>\n`;
    }
    
    // Add validation attributes
    if (!field.repeated && (field as any).required !== false) {
      csharpCode += `    [Required]\n`;
    }
    
    // Property name in PascalCase
    const propertyName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    csharpCode += `    [JsonPropertyName("${field.name}")]\n`;
    csharpCode += `    public ${csharpType} ${propertyName} { get; set; }`;
    
    // Default value for non-nullable fields
    const defaultValue = getCSharpDefaultValue(field.type, field.repeated);
    if (defaultValue) {
      csharpCode += ` = ${defaultValue};`;
    }
    
    csharpCode += '\n\n';
  }
  
  // Add validation method
  csharpCode += `    public List<string> Validate()\n    {\n`;
  csharpCode += `        var errors = new List<string>();\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
      if (field.type === 'string') {
        csharpCode += `        if (string.IsNullOrEmpty(${propertyName}))\n`;
        csharpCode += `            errors.Add("${field.name} is required");\n`;
      }
    }
  }
  csharpCode += `        return errors;\n`;
  csharpCode += `    }\n`;

  csharpCode += `}\n`;
  return csharpCode;
}

function getCSharpType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'string'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'long'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'uint'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'ulong'; break;
    case 'float': baseType = 'float'; break;
    case 'double': baseType = 'double'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'byte[]'; break;
    default: baseType = 'object'; // For message types
  }

  if (repeated) {
    return `List<${baseType}>`;
  }
  
  // For proto3, use nullable reference types for optional behavior
  if (protoType === 'string') {
    return 'string?';
  }
  
  return baseType;
}

function getCSharpDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return 'new List<>()';
  return ''; // C# uses default values for value types
}

// Helper function to generate C++ header from protobuf type
function generateCpp(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let cppCode = `#pragma once\n\n#include <string>\n#include <vector>\n#include <memory>\n\n`;
  cppCode += `/**\n * ${className} class generated from proto definition\n */\n`;
  cppCode += `class ${className} {\npublic:\n`;
  
  // Constructor
  cppCode += `    ${className}();\n`;
  cppCode += `    ~${className}() = default;\n\n`;
  
  // Copy constructor and assignment operator
  cppCode += `    ${className}(const ${className}& other);\n`;
  cppCode += `    ${className}& operator=(const ${className}& other);\n\n`;
  
  // Getters and setters
  for (const field of fields) {
    const cppType = getCppType(field.type, field.repeated);
    const methodName = field.name;
    
    if ((field as any).comment) {
      cppCode += `    /** ${(field as any).comment} */\n`;
    }
    
    // Getter
    cppCode += `    const ${cppType}& ${methodName}() const;\n`;
    
    // Setter
    cppCode += `    void set_${methodName}(const ${cppType}& value);\n`;
    
    // For repeated fields, add additional methods
    if (field.repeated) {
      const singularType = getCppType(field.type, false);
      cppCode += `    void add_${methodName}(const ${singularType}& value);\n`;
      cppCode += `    ${singularType}* add_${methodName}();\n`;
      cppCode += `    int ${methodName}_size() const;\n`;
      cppCode += `    void clear_${methodName}();\n`;
    }
    
    cppCode += '\n';
  }
  
  // Validation method
  cppCode += `    bool IsValid() const;\n`;
  cppCode += `    std::vector<std::string> GetValidationErrors() const;\n\n`;
  
  cppCode += `private:\n`;
  
  // Member variables
  for (const field of fields) {
    const cppType = getCppType(field.type, field.repeated);
    cppCode += `    ${cppType} ${field.name}_;\n`;
  }
  
  cppCode += `};\n`;
  return cppCode;
}

function getCppType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'std::string'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'int32_t'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'int64_t'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'uint32_t'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'uint64_t'; break;
    case 'float': baseType = 'float'; break;
    case 'double': baseType = 'double'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'std::string'; break;
    default: baseType = 'std::shared_ptr<void>'; // For message types
  }

  if (repeated) {
    return `std::vector<${baseType}>`;
  }
  
  return baseType;
}

// Helper function to check if error suggests protolint validation
function isParsingError(errorMessage: string): boolean {
  const parsingErrorIndicators = [
    'parse',
    'syntax',
    'token',
    'unexpected',
    'expected',
    'invalid',
    'malformed',
    'missing',
    'incomplete'
  ];
  
  return parsingErrorIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator)
  );
}

export async function convert(request: ConversionRequest): Promise<EnhancedConversionResult> {
  try {
    // Parse the proto content
    const root = protobuf.parse(request.content);
    
    if (!root.root) {
      throw new Error('Failed to parse proto file');
    }

    // Get all message types from the parsed proto
    const types: protobuf.Type[] = [];
    
    function collectTypes(namespace: protobuf.Namespace) {
      namespace.nestedArray.forEach(nested => {
        if (nested instanceof protobuf.Type) {
          types.push(nested);
        } else if (nested instanceof protobuf.Namespace) {
          collectTypes(nested);
        }
      });
    }
    
    collectTypes(root.root);

    if (types.length === 0) {
      throw new Error('No message types found in proto file');
    }

    let output = '';

    switch (request.format) {
      case 'javascript':
        for (const type of types) {
          output += generateJavaScript(type) + '\n';
        }
        break;

      case 'json-schema':
        const schemas: any = {};
        for (const type of types) {
          schemas[type.name] = generateJsonSchema(type);
        }
        output = JSON.stringify({
          $schema: 'https://json-schema.org/draft/2019-09/schema',
          definitions: schemas
        }, null, 2);
        break;

      case 'typescript':
        for (const type of types) {
          output += generateTypeScript(type) + '\n';
        }
        break;

      case 'python':
        for (const type of types) {
          output += generatePython(type) + '\n';
        }
        break;

      case 'java':
        for (const type of types) {
          output += generateJava(type) + '\n';
        }
        break;

      case 'go':
        for (const type of types) {
          output += generateGo(type) + '\n';
        }
        break;

      case 'csharp':
        for (const type of types) {
          output += generateCSharp(type) + '\n';
        }
        break;

      case 'cpp':
        for (const type of types) {
          output += generateCpp(type) + '\n';
        }
        break;

      default:
        throw new Error(`Unsupported format: ${request.format}`);
    }

    return {
      success: true,
      format: request.format,
      output
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isParseError = isParsingError(errorMessage);
    
    let userFriendlyMessage = '';
    if (isParseError) {
      if (errorMessage.includes('No message types found')) {
        userFriendlyMessage = 'Your .proto file was parsed but no message types were found. Please check that your file contains message definitions.';
      } else {
        userFriendlyMessage = 'There appears to be a syntax issue in your .proto file. Try validating your proto file for syntax errors first, then come back to convert it.';
      }
    } else {
      userFriendlyMessage = 'An error occurred while processing your proto file. Please check the technical details below.';
    }
    
    return {
      success: false,
      format: request.format,
      error: errorMessage,
      isParsingError: isParseError,
      protolintSuggested: isParseError,
      userFriendlyMessage,
      technicalError: errorMessage
    };
  }
}

export const SUPPORTED_FORMATS: { value: ConversionFormat; label: string; description: string }[] = [
  {
    value: 'javascript',
    label: 'JavaScript',
    description: 'ES6 classes with validation and JSON serialization'
  },
  {
    value: 'json-schema',
    label: 'JSON Schema',
    description: 'JSON Schema definition for validation'
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    description: 'TypeScript interfaces with type safety'
  },
  {
    value: 'python',
    label: 'Python',
    description: 'Python dataclasses with type hints and validation'
  },
  {
    value: 'java',
    label: 'Java',
    description: 'Java classes with builder pattern, getters/setters, and proper packaging'
  },
  {
    value: 'go',
    label: 'Go',
    description: 'Go structs with JSON tags and protocol buffer field naming'
  },
  {
    value: 'csharp',
    label: 'C#',
    description: 'C# classes with properties, data annotations, and nullable reference types'
  },
  {
    value: 'cpp',
    label: 'C++',
    description: 'C++ header files with class definitions and proper includes'
  }
];