import protobuf from 'protobufjs';

export type ConversionFormat = 'javascript' | 'json-schema' | 'typescript' | 'python' | 'java' | 'go' | 'csharp' | 'cpp' | 'rust' | 'c' | 'ruby' | 'swift' | 'kotlin' | 'php' | 'dart' | 'elixir' | 'groovy' | 'scala';

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

// Helper function to generate Rust struct from protobuf type
function generateRust(type: protobuf.Type): string {
  const structName = type.name;
  const fields = type.fieldsArray;

  let rustCode = `use serde::{Deserialize, Serialize};\n\n`;
  rustCode += `/// ${structName} struct generated from proto definition\n`;
  rustCode += `#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq)]\n`;
  rustCode += `pub struct ${structName} {\n`;
  
  for (const field of fields) {
    const rustType = getRustType(field.type, field.repeated);
    const serde_tag = field.name;
    
    if ((field as any).comment) {
      rustCode += `    /// ${(field as any).comment}\n`;
    }
    
    rustCode += `    #[serde(rename = "${serde_tag}")]\n`;
    rustCode += `    pub ${field.name}: ${rustType},\n`;
  }
  
  rustCode += `}\n\n`;

  // Add implementation block with validation
  rustCode += `impl ${structName} {\n`;
  rustCode += `    /// Create a new instance with default values\n`;
  rustCode += `    pub fn new() -> Self {\n`;
  rustCode += `        Default::default()\n`;
  rustCode += `    }\n\n`;

  // Add validation method
  rustCode += `    /// Validate the struct and return list of errors\n`;
  rustCode += `    pub fn validate(&self) -> Vec<String> {\n`;
  rustCode += `        let mut errors = Vec::new();\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      if (field.type === 'string') {
        rustCode += `        if self.${field.name}.is_empty() {\n`;
        rustCode += `            errors.push("${field.name} is required".to_string());\n`;
        rustCode += `        }\n`;
      }
    }
  }
  rustCode += `        errors\n`;
  rustCode += `    }\n\n`;

  // Add JSON serialization helpers
  rustCode += `    /// Serialize to JSON string\n`;
  rustCode += `    pub fn to_json(&self) -> Result<String, serde_json::Error> {\n`;
  rustCode += `        serde_json::to_string(self)\n`;
  rustCode += `    }\n\n`;

  rustCode += `    /// Deserialize from JSON string\n`;
  rustCode += `    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {\n`;
  rustCode += `        serde_json::from_str(json)\n`;
  rustCode += `    }\n`;

  rustCode += `}\n`;
  return rustCode;
}

function getRustType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'i32'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'i64'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'u32'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'u64'; break;
    case 'float': baseType = 'f32'; break;
    case 'double': baseType = 'f64'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'Vec<u8>'; break;
    default: baseType = 'serde_json::Value'; // For message types
  }

  if (repeated) {
    return `Vec<${baseType}>`;
  }
  
  // For proto3, use Option for optional fields
  return `Option<${baseType}>`;
}

// Helper function to generate C struct from protobuf type
function generateC(type: protobuf.Type): string {
  const structName = type.name;
  const fields = type.fieldsArray;

  let cCode = `#ifndef ${structName.toUpperCase()}_H\n`;
  cCode += `#define ${structName.toUpperCase()}_H\n\n`;
  cCode += `#include <stdint.h>\n#include <stdbool.h>\n#include <stdlib.h>\n#include <string.h>\n\n`;
  cCode += `/**\n * ${structName} struct generated from proto definition\n */\n`;
  cCode += `typedef struct ${structName} {\n`;
  
  for (const field of fields) {
    const cType = getCType(field.type, field.repeated);
    
    if ((field as any).comment) {
      cCode += `    /* ${(field as any).comment} */\n`;
    }
    
    cCode += `    ${cType} ${field.name};\n`;
    
    // For repeated fields, add size field
    if (field.repeated) {
      cCode += `    size_t ${field.name}_count;\n`;
    }
  }
  
  cCode += `} ${structName};\n\n`;

  // Function declarations
  cCode += `/* Function declarations */\n`;
  cCode += `${structName}* ${structName}_create(void);\n`;
  cCode += `void ${structName}_destroy(${structName}* obj);\n`;
  cCode += `int ${structName}_validate(const ${structName}* obj, char* error_buffer, size_t buffer_size);\n`;
  cCode += `char* ${structName}_to_json(const ${structName}* obj);\n`;
  cCode += `${structName}* ${structName}_from_json(const char* json_string);\n\n`;

  // Add setters for repeated fields
  for (const field of fields) {
    if (field.repeated) {
      const baseCType = getCType(field.type, false);
      cCode += `int ${structName}_add_${field.name}(${structName}* obj, ${baseCType} value);\n`;
      cCode += `void ${structName}_clear_${field.name}(${structName}* obj);\n`;
    }
  }

  cCode += `\n#endif /* ${structName.toUpperCase()}_H */\n`;
  return cCode;
}

function getCType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'char*'; break;
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
    case 'bytes': baseType = 'unsigned char*'; break;
    default: baseType = 'void*'; // For message types
  }

  if (repeated) {
    return `${baseType}*`;
  }
  
  return baseType;
}

// Helper function to generate Ruby class from protobuf type
function generateRuby(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let rubyCode = `require 'json'\n\n`;
  rubyCode += `##\n# ${className} class generated from proto definition\n##\n`;
  rubyCode += `class ${className}\n`;
  
  // Add attribute accessors
  const fieldNames = fields.map(field => field.name);
  rubyCode += `  attr_accessor ${fieldNames.map(name => `:${name}`).join(', ')}\n\n`;

  // Initialize method
  rubyCode += `  def initialize(data = {})\n`;
  for (const field of fields) {
    const defaultValue = getRubyDefaultValue(field.type, field.repeated);
    rubyCode += `    @${field.name} = data[:${field.name}] || data['${field.name}'] || ${defaultValue}\n`;
  }
  rubyCode += `  end\n\n`;

  // Validation method
  rubyCode += `  def validate\n`;
  rubyCode += `    errors = []\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      if (field.type === 'string') {
        rubyCode += `    errors << '${field.name} is required' if @${field.name}.nil? || @${field.name}.empty?\n`;
      } else {
        rubyCode += `    errors << '${field.name} is required' if @${field.name}.nil?\n`;
      }
    }
  }
  rubyCode += `    errors\n`;
  rubyCode += `  end\n\n`;

  // to_hash method
  rubyCode += `  def to_hash\n`;
  rubyCode += `    {\n`;
  for (const field of fields) {
    rubyCode += `      '${field.name}' => @${field.name},\n`;
  }
  rubyCode += `    }\n`;
  rubyCode += `  end\n\n`;

  // to_json method
  rubyCode += `  def to_json(*args)\n`;
  rubyCode += `    to_hash.to_json(*args)\n`;
  rubyCode += `  end\n\n`;

  // from_json class method
  rubyCode += `  def self.from_json(json_string)\n`;
  rubyCode += `    data = JSON.parse(json_string)\n`;
  rubyCode += `    new(data)\n`;
  rubyCode += `  rescue JSON::ParserError => e\n`;
  rubyCode += `    raise ArgumentError, "Invalid JSON: #{e.message}"\n`;
  rubyCode += `  end\n\n`;

  // Add helpful methods for repeated fields
  for (const field of fields) {
    if (field.repeated) {
      rubyCode += `  def add_${field.name}(value)\n`;
      rubyCode += `    @${field.name} << value\n`;
      rubyCode += `  end\n\n`;

      rubyCode += `  def clear_${field.name}\n`;
      rubyCode += `    @${field.name}.clear\n`;
      rubyCode += `  end\n\n`;
    }
  }

  rubyCode += `end\n`;
  return rubyCode;
}

function getRubyDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
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
    default: return 'nil';
  }
}

// Helper function to generate Swift struct from protobuf type
function generateSwift(type: protobuf.Type): string {
  const structName = type.name;
  const fields = type.fieldsArray;

  let swiftCode = `import Foundation\n\n`;
  swiftCode += `/// ${structName} struct generated from proto definition\n`;
  swiftCode += `public struct ${structName}: Codable, Equatable {\n`;
  
  // Property declarations
  for (const field of fields) {
    const swiftType = getSwiftType(field.type, field.repeated);
    
    if ((field as any).comment) {
      swiftCode += `    /// ${(field as any).comment}\n`;
    }
    
    // Convert snake_case to camelCase for Swift naming conventions
    const propertyName = toCamelCase(field.name);
    swiftCode += `    public let ${propertyName}: ${swiftType}\n`;
  }
  
  swiftCode += `\n`;

  // Initializer
  swiftCode += `    public init(\n`;
  const initParams = fields.map(field => {
    const swiftType = getSwiftType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const defaultValue = getSwiftDefaultValue(field.type, field.repeated);
    return `        ${propertyName}: ${swiftType} = ${defaultValue}`;
  });
  swiftCode += initParams.join(',\n');
  swiftCode += `\n    ) {\n`;
  
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    swiftCode += `        self.${propertyName} = ${propertyName}\n`;
  }
  swiftCode += `    }\n\n`;

  // CodingKeys for JSON serialization
  swiftCode += `    enum CodingKeys: String, CodingKey {\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    swiftCode += `        case ${propertyName} = "${field.name}"\n`;
  }
  swiftCode += `    }\n\n`;

  // Validation method
  swiftCode += `    public func validate() throws {\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        swiftCode += `        guard !${propertyName}.isEmpty else {\n`;
        swiftCode += `            throw ValidationError.fieldRequired("${field.name}")\n`;
        swiftCode += `        }\n`;
      }
    }
  }
  swiftCode += `    }\n\n`;

  // JSON conversion helpers
  swiftCode += `    public func toJSON() throws -> String {\n`;
  swiftCode += `        let data = try JSONEncoder().encode(self)\n`;
  swiftCode += `        return String(data: data, encoding: .utf8) ?? ""\n`;
  swiftCode += `    }\n\n`;

  swiftCode += `    public static func fromJSON(_ jsonString: String) throws -> ${structName} {\n`;
  swiftCode += `        guard let data = jsonString.data(using: .utf8) else {\n`;
  swiftCode += `            throw DecodingError.dataCorrupted(DecodingError.Context(codingPath: [], debugDescription: "Invalid UTF-8 string"))\n`;
  swiftCode += `        }\n`;
  swiftCode += `        return try JSONDecoder().decode(${structName}.self, from: data)\n`;
  swiftCode += `    }\n`;

  swiftCode += `}\n\n`;

  // ValidationError enum
  swiftCode += `public enum ValidationError: Error {\n`;
  swiftCode += `    case fieldRequired(String)\n`;
  swiftCode += `    \n`;
  swiftCode += `    public var localizedDescription: String {\n`;
  swiftCode += `        switch self {\n`;
  swiftCode += `        case .fieldRequired(let field):\n`;
  swiftCode += `            return "\\(field) is required"\n`;
  swiftCode += `        }\n`;
  swiftCode += `    }\n`;
  swiftCode += `}\n`;

  return swiftCode;
}

function getSwiftType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'Int32'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'Int64'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'UInt32'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'UInt64'; break;
    case 'float': baseType = 'Float'; break;
    case 'double': baseType = 'Double'; break;
    case 'bool': baseType = 'Bool'; break;
    case 'bytes': baseType = 'Data'; break;
    default: baseType = 'AnyCodable'; // For message types
  }

  if (repeated) {
    return `[${baseType}]`;
  }
  
  // For proto3, fields can be optional
  return baseType;
}

function getSwiftDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
    case 'string': return '""';
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
      return '0';
    case 'float':
    case 'double':
      return '0.0';
    case 'bool': return 'false';
    case 'bytes': return 'Data()';
    default: return 'nil'; // For message types
  }
}

// Helper function to generate Kotlin data class from protobuf type
function generateKotlin(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let kotlinCode = `import kotlinx.serialization.Serializable\nimport kotlinx.serialization.SerialName\nimport kotlinx.serialization.json.Json\n\n`;
  kotlinCode += `/**\n * ${className} data class generated from proto definition\n */\n`;
  kotlinCode += `@Serializable\n`;
  kotlinCode += `data class ${className}(\n`;
  
  // Property declarations
  const properties = fields.map(field => {
    const kotlinType = getKotlinType(field.type, field.repeated);
    const defaultValue = getKotlinDefaultValue(field.type, field.repeated);
    
    let property = '';
    if ((field as any).comment) {
      property += `    /** ${(field as any).comment} */\n`;
    }
    
    // Convert snake_case to camelCase for Kotlin naming conventions
    const propertyName = toCamelCase(field.name);
    property += `    @SerialName("${field.name}")\n`;
    property += `    val ${propertyName}: ${kotlinType} = ${defaultValue}`;
    
    return property;
  });
  
  kotlinCode += properties.join(',\n');
  kotlinCode += `\n) {\n\n`;

  // Validation method
  kotlinCode += `    fun validate(): List<String> {\n`;
  kotlinCode += `        val errors = mutableListOf<String>()\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        kotlinCode += `        if (${propertyName}.isNullOrBlank()) {\n`;
        kotlinCode += `            errors.add("${field.name} is required")\n`;
        kotlinCode += `        }\n`;
      } else if (getKotlinType(field.type, false).includes('?')) {
        kotlinCode += `        if (${propertyName} == null) {\n`;
        kotlinCode += `            errors.add("${field.name} is required")\n`;
        kotlinCode += `        }\n`;
      }
    }
  }
  kotlinCode += `        return errors\n`;
  kotlinCode += `    }\n\n`;

  // JSON serialization methods
  kotlinCode += `    fun toJson(): String = Json.encodeToString(serializer(), this)\n\n`;

  kotlinCode += `    companion object {\n`;
  kotlinCode += `        fun fromJson(json: String): ${className} = Json.decodeFromString(serializer(), json)\n`;
  kotlinCode += `    }\n`;

  kotlinCode += `}\n`;
  return kotlinCode;
}

function getKotlinType(protoType: string, repeated: boolean): string {
  let baseType: string;
  let nullable = false;
  
  switch (protoType) {
    case 'string': baseType = 'String'; nullable = true; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'Int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'Long'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'UInt'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'ULong'; break;
    case 'float': baseType = 'Float'; break;
    case 'double': baseType = 'Double'; break;
    case 'bool': baseType = 'Boolean'; break;
    case 'bytes': baseType = 'ByteArray'; nullable = true; break;
    default: baseType = 'Any'; nullable = true; // For message types
  }

  if (repeated) {
    return `List<${baseType}>`;
  }
  
  return nullable ? `${baseType}?` : baseType;
}

function getKotlinDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return 'emptyList()';
  
  switch (protoType) {
    case 'string': return 'null';
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      return '0';
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      return '0L';
    case 'uint32':
    case 'fixed32':
      return '0u';
    case 'uint64':
    case 'fixed64':
      return '0uL';
    case 'float': return '0.0f';
    case 'double': return '0.0';
    case 'bool': return 'false';
    case 'bytes': return 'null';
    default: return 'null';
  }
}

// Helper function to generate PHP class from protobuf type
function generatePHP(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let phpCode = `<?php\n\ndeclare(strict_types=1);\n\n`;
  phpCode += `/**\n * ${className} class generated from proto definition\n */\n`;
  phpCode += `class ${className}\n{\n`;
  
  // Property declarations
  for (const field of fields) {
    const phpType = getPHPType(field.type, field.repeated);
    
    if ((field as any).comment) {
      phpCode += `    /** ${(field as any).comment} */\n`;
    }
    
    // Convert to camelCase for PHP property naming
    const propertyName = toCamelCase(field.name);
    phpCode += `    private ${phpType} $${propertyName};\n\n`;
  }

  // Constructor
  phpCode += `    public function __construct(\n`;
  const constructorParams = fields.map(field => {
    const phpType = getPHPType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const defaultValue = getPHPDefaultValue(field.type, field.repeated);
    return `        ${phpType} $${propertyName} = ${defaultValue}`;
  });
  phpCode += constructorParams.join(',\n');
  phpCode += `\n    ) {\n`;
  
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    phpCode += `        $this->${propertyName} = $${propertyName};\n`;
  }
  phpCode += `    }\n\n`;

  // Getters and setters
  for (const field of fields) {
    const phpType = getPHPType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const methodName = ucfirst(propertyName);
    
    // Getter
    phpCode += `    public function get${methodName}(): ${phpType}\n`;
    phpCode += `    {\n`;
    phpCode += `        return $this->${propertyName};\n`;
    phpCode += `    }\n\n`;
    
    // Setter
    phpCode += `    public function set${methodName}(${phpType} $${propertyName}): self\n`;
    phpCode += `    {\n`;
    phpCode += `        $this->${propertyName} = $${propertyName};\n`;
    phpCode += `        return $this;\n`;
    phpCode += `    }\n\n`;
  }

  // Validation method
  phpCode += `    public function validate(): array\n`;
  phpCode += `    {\n`;
  phpCode += `        $errors = [];\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        phpCode += `        if (empty($this->${propertyName})) {\n`;
        phpCode += `            $errors[] = '${field.name} is required';\n`;
        phpCode += `        }\n`;
      }
    }
  }
  phpCode += `        return $errors;\n`;
  phpCode += `    }\n\n`;

  // toArray method
  phpCode += `    public function toArray(): array\n`;
  phpCode += `    {\n`;
  phpCode += `        return [\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    phpCode += `            '${field.name}' => $this->${propertyName},\n`;
  }
  phpCode += `        ];\n`;
  phpCode += `    }\n\n`;

  // toJson method
  phpCode += `    public function toJson(): string\n`;
  phpCode += `    {\n`;
  phpCode += `        return json_encode($this->toArray(), JSON_THROW_ON_ERROR);\n`;
  phpCode += `    }\n\n`;

  // fromJson static method
  phpCode += `    public static function fromJson(string $json): self\n`;
  phpCode += `    {\n`;
  phpCode += `        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);\n`;
  phpCode += `        return new self(\n`;
  const fromJsonParams = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `            ${propertyName}: $data['${field.name}'] ?? ${getPHPDefaultValue(field.type, field.repeated)}`;
  });
  phpCode += fromJsonParams.join(',\n');
  phpCode += `\n        );\n`;
  phpCode += `    }\n`;

  phpCode += `}\n`;
  return phpCode;
}

function getPHPType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'string'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
    case 'uint32':
    case 'fixed32':
      baseType = 'int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
    case 'uint64':
    case 'fixed64':
      baseType = 'int'; break; // PHP doesn't distinguish between 32/64 bit integers
    case 'float':
    case 'double':
      baseType = 'float'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'string'; break;
    default: baseType = 'array'; // For message types
  }

  if (repeated) {
    return 'array';
  }
  
  return baseType;
}

function getPHPDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
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
      return '0';
    case 'float':
    case 'double':
      return '0.0';
    case 'bool': return 'false';
    case 'bytes': return "''";
    default: return '[]';
  }
}

// Helper function to generate Dart class from protobuf type
function generateDart(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let dartCode = `import 'dart:convert';\n\n`;
  dartCode += `/// ${className} class generated from proto definition\n`;
  dartCode += `class ${className} {\n`;
  
  // Property declarations
  for (const field of fields) {
    const dartType = getDartType(field.type, field.repeated);
    
    if ((field as any).comment) {
      dartCode += `  /// ${(field as any).comment}\n`;
    }
    
    // Convert to camelCase for Dart property naming
    const propertyName = toCamelCase(field.name);
    dartCode += `  final ${dartType} ${propertyName};\n\n`;
  }

  // Constructor
  dartCode += `  ${className}({\n`;
  const constructorParams = fields.map(field => {
    const dartType = getDartType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const isRequired = !field.repeated && (field as any).required !== false && !dartType.includes('?');
    const prefix = isRequired ? 'required ' : '';
    return `    ${prefix}this.${propertyName}`;
  });
  dartCode += constructorParams.join(',\n');
  dartCode += `\n  });\n\n`;

  // Named constructor with defaults
  dartCode += `  ${className}.withDefaults({\n`;
  const defaultParams = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `    this.${propertyName}`;
  });
  dartCode += defaultParams.join(',\n');
  dartCode += `\n  });\n\n`;

  // Validation method
  dartCode += `  List<String> validate() {\n`;
  dartCode += `    final errors = <String>[];\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        dartCode += `    if (${propertyName}.isEmpty) {\n`;
        dartCode += `      errors.add('${field.name} is required');\n`;
        dartCode += `    }\n`;
      }
    }
  }
  dartCode += `    return errors;\n`;
  dartCode += `  }\n\n`;

  // toJson method
  dartCode += `  Map<String, dynamic> toJson() {\n`;
  dartCode += `    return {\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    dartCode += `      '${field.name}': ${propertyName},\n`;
  }
  dartCode += `    };\n`;
  dartCode += `  }\n\n`;

  // fromJson factory constructor
  dartCode += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
  dartCode += `    return ${className}(\n`;
  const fromJsonParams = fields.map(field => {
    const dartType = getDartType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const defaultValue = getDartDefaultValue(field.type, field.repeated);
    
    if (field.repeated) {
      const baseType = getDartType(field.type, false);
      return `      ${propertyName}: (json['${field.name}'] as List<dynamic>?)?.cast<${baseType.replace('?', '')}>() ?? ${defaultValue}`;
    } else {
      return `      ${propertyName}: json['${field.name}'] as ${dartType} ?? ${defaultValue}`;
    }
  });
  dartCode += fromJsonParams.join(',\n');
  dartCode += `\n    );\n`;
  dartCode += `  }\n\n`;

  // JSON string methods
  dartCode += `  String toJsonString() => json.encode(toJson());\n\n`;
  
  dartCode += `  static ${className} fromJsonString(String jsonString) {\n`;
  dartCode += `    final Map<String, dynamic> json = json.decode(jsonString);\n`;
  dartCode += `    return ${className}.fromJson(json);\n`;
  dartCode += `  }\n\n`;

  // copyWith method
  dartCode += `  ${className} copyWith({\n`;
  const copyWithParams = fields.map(field => {
    const dartType = getDartType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    return `    ${dartType}? ${propertyName}`;
  });
  dartCode += copyWithParams.join(',\n');
  dartCode += `\n  }) {\n`;
  dartCode += `    return ${className}(\n`;
  const copyWithAssigns = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `      ${propertyName}: ${propertyName} ?? this.${propertyName}`;
  });
  dartCode += copyWithAssigns.join(',\n');
  dartCode += `\n    );\n`;
  dartCode += `  }\n\n`;

  // Equality and hashCode
  dartCode += `  @override\n`;
  dartCode += `  bool operator ==(Object other) {\n`;
  dartCode += `    if (identical(this, other)) return true;\n`;
  dartCode += `    return other is ${className} &&\n`;
  const equalityChecks = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `      other.${propertyName} == ${propertyName}`;
  });
  dartCode += equalityChecks.join(' &&\n');
  dartCode += `;\n  }\n\n`;

  dartCode += `  @override\n`;
  dartCode += `  int get hashCode {\n`;
  const hashFields = fields.map(field => toCamelCase(field.name));
  dartCode += `    return Object.hash(${hashFields.join(', ')});\n`;
  dartCode += `  }\n\n`;

  // toString method
  dartCode += `  @override\n`;
  dartCode += `  String toString() {\n`;
  dartCode += `    return '${className}(${fields.map(field => `${toCamelCase(field.name)}: \$${toCamelCase(field.name)}`).join(', ')})';\n`;
  dartCode += `  }\n`;

  dartCode += `}\n`;
  return dartCode;
}

function getDartType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
    case 'uint32':
    case 'fixed32':
      baseType = 'int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
    case 'uint64':
    case 'fixed64':
      baseType = 'int'; break;
    case 'float':
    case 'double':
      baseType = 'double'; break;
    case 'bool': baseType = 'bool'; break;
    case 'bytes': baseType = 'List<int>'; break;
    default: baseType = 'Map<String, dynamic>'; // For message types
  }

  if (repeated) {
    return `List<${baseType}>`;
  }
  
  // For proto3, most fields can be null
  return baseType;
}

function getDartDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
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
      return '0';
    case 'float':
    case 'double':
      return '0.0';
    case 'bool': return 'false';
    case 'bytes': return '[]';
    default: return '{}';
  }
}

// Helper function to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Helper function to capitalize first letter
function ucfirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to generate Elixir module from protobuf type
function generateElixir(type: protobuf.Type): string {
  const moduleName = type.name;
  const fields = type.fieldsArray;

  let elixirCode = `defmodule ${moduleName} do\n`;
  elixirCode += `  @moduledoc """\n  ${moduleName} module generated from proto definition\n  """\n\n`;
  
  // Import required modules
  elixirCode += `  alias Jason\n\n`;

  // Define the struct
  elixirCode += `  @enforce_keys []\n`;
  elixirCode += `  defstruct [\n`;
  const structFields = fields.map(field => {
    const defaultValue = getElixirDefaultValue(field.type, field.repeated);
    return `    ${toSnakeCase(field.name)}: ${defaultValue}`;
  });
  elixirCode += structFields.join(',\n');
  elixirCode += `\n  ]\n\n`;

  // Type definition
  elixirCode += `  @type t :: %__MODULE__{\n`;
  const typeFields = fields.map(field => {
    const elixirType = getElixirType(field.type, field.repeated);
    return `    ${toSnakeCase(field.name)}: ${elixirType}`;
  });
  elixirCode += typeFields.join(',\n');
  elixirCode += `\n  }\n\n`;

  // new function
  elixirCode += `  @doc "Creates a new ${moduleName} struct with given attributes"\n`;
  elixirCode += `  @spec new(map()) :: t()\n`;
  elixirCode += `  def new(attrs \\\\ %{}) do\n`;
  elixirCode += `    struct(__MODULE__, attrs)\n`;
  elixirCode += `  end\n\n`;

  // Validation function
  elixirCode += `  @doc "Validates the ${moduleName} struct"\n`;
  elixirCode += `  @spec validate(t()) :: {:ok, t()} | {:error, [String.t()]}\n`;
  elixirCode += `  def validate(%__MODULE__{} = struct) do\n`;
  elixirCode += `    errors = []\n`;
  
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const fieldName = toSnakeCase(field.name);
      if (field.type === 'string') {
        elixirCode += `    |> validate_required_string(:${fieldName}, struct)\n`;
      }
    }
  }
  
  elixirCode += `\n    case errors do\n`;
  elixirCode += `      [] -> {:ok, struct}\n`;
  elixirCode += `      errors -> {:error, errors}\n`;
  elixirCode += `    end\n`;
  elixirCode += `  end\n\n`;

  // Helper validation functions
  elixirCode += `  defp validate_required_string(errors, field, struct) do\n`;
  elixirCode += `    case Map.get(struct, field) do\n`;
  elixirCode += `      nil -> ["#{field} is required" | errors]\n`;
  elixirCode += `      "" -> ["#{field} is required" | errors]\n`;
  elixirCode += `      _ -> errors\n`;
  elixirCode += `    end\n`;
  elixirCode += `  end\n\n`;

  // JSON serialization
  elixirCode += `  @doc "Converts ${moduleName} to JSON string"\n`;
  elixirCode += `  @spec to_json(t()) :: {:ok, String.t()} | {:error, Jason.EncodeError.t()}\n`;
  elixirCode += `  def to_json(%__MODULE__{} = struct) do\n`;
  elixirCode += `    Jason.encode(struct)\n`;
  elixirCode += `  end\n\n`;

  elixirCode += `  @doc "Creates ${moduleName} from JSON string"\n`;
  elixirCode += `  @spec from_json(String.t()) :: {:ok, t()} | {:error, Jason.DecodeError.t()}\n`;
  elixirCode += `  def from_json(json_string) when is_binary(json_string) do\n`;
  elixirCode += `    case Jason.decode(json_string) do\n`;
  elixirCode += `      {:ok, data} when is_map(data) ->\n`;
  elixirCode += `        attrs = for {key, value} <- data, into: %{} do\n`;
  elixirCode += `          {String.to_existing_atom(key), value}\n`;
  elixirCode += `        end\n`;
  elixirCode += `        {:ok, new(attrs)}\n`;
  elixirCode += `      {:error, reason} -> {:error, reason}\n`;
  elixirCode += `    end\n`;
  elixirCode += `  end\n\n`;

  // Pattern matching helpers
  elixirCode += `  @doc "Pattern match helper for extracting fields"\n`;
  const matchFields = fields.map(field => toSnakeCase(field.name));
  elixirCode += `  def extract(%__MODULE__{${matchFields.join(': ')}} = _struct) do\n`;
  elixirCode += `    {${matchFields.join(', ')}}\n`;
  elixirCode += `  end\n`;

  elixirCode += `end\n`;
  return elixirCode;
}

function getElixirType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String.t()'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
    case 'uint32':
    case 'fixed32':
    case 'int64':
    case 'sint64':
    case 'sfixed64':
    case 'uint64':
    case 'fixed64':
      baseType = 'integer()'; break;
    case 'float':
    case 'double':
      baseType = 'float()'; break;
    case 'bool': baseType = 'boolean()'; break;
    case 'bytes': baseType = 'binary()'; break;
    default: baseType = 'map()'; // For message types
  }

  if (repeated) {
    return `[${baseType}]`;
  }
  
  return `${baseType} | nil`;
}

function getElixirDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
    case 'string': return 'nil';
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
      return 'nil';
    case 'float':
    case 'double':
      return 'nil';
    case 'bool': return 'nil';
    case 'bytes': return 'nil';
    default: return 'nil';
  }
}

// Helper function to generate Groovy class from protobuf type
function generateGroovy(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let groovyCode = `import groovy.json.JsonBuilder\nimport groovy.json.JsonSlurper\nimport groovy.transform.*\n\n`;
  groovyCode += `/**\n * ${className} class generated from proto definition\n */\n`;
  groovyCode += `@Canonical\n@ToString(includeFields = true)\n@EqualsAndHashCode\n`;
  groovyCode += `@CompileStatic\n`;
  groovyCode += `class ${className} {\n\n`;
  
  // Property declarations
  for (const field of fields) {
    const groovyType = getGroovyType(field.type, field.repeated);
    
    if ((field as any).comment) {
      groovyCode += `    /** ${(field as any).comment} */\n`;
    }
    
    // Convert to camelCase for Groovy property naming
    const propertyName = toCamelCase(field.name);
    groovyCode += `    ${groovyType} ${propertyName}\n\n`;
  }

  // Default constructor
  groovyCode += `    ${className}() {\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    const defaultValue = getGroovyDefaultValue(field.type, field.repeated);
    groovyCode += `        this.${propertyName} = ${defaultValue}\n`;
  }
  groovyCode += `    }\n\n`;

  // Map constructor
  groovyCode += `    ${className}(Map<String, Object> map) {\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    const defaultValue = getGroovyDefaultValue(field.type, field.repeated);
    groovyCode += `        this.${propertyName} = map.get('${field.name}', ${defaultValue}) as ${getGroovyType(field.type, field.repeated)}\n`;
  }
  groovyCode += `    }\n\n`;

  // Builder pattern
  for (const field of fields) {
    const groovyType = getGroovyType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    const methodName = toCamelCase(field.name);
    
    groovyCode += `    ${className} ${methodName}(${groovyType} ${propertyName}) {\n`;
    groovyCode += `        this.${propertyName} = ${propertyName}\n`;
    groovyCode += `        return this\n`;
    groovyCode += `    }\n\n`;
  }

  // Validation method
  groovyCode += `    List<String> validate() {\n`;
  groovyCode += `        List<String> errors = []\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        groovyCode += `        if (!${propertyName} || ${propertyName}.isEmpty()) {\n`;
        groovyCode += `            errors << '${field.name} is required'\n`;
        groovyCode += `        }\n`;
      } else {
        groovyCode += `        if (${propertyName} == null) {\n`;
        groovyCode += `            errors << '${field.name} is required'\n`;
        groovyCode += `        }\n`;
      }
    }
  }
  groovyCode += `        return errors\n`;
  groovyCode += `    }\n\n`;

  // toMap method
  groovyCode += `    Map<String, Object> toMap() {\n`;
  groovyCode += `        return [\n`;
  for (const field of fields) {
    const propertyName = toCamelCase(field.name);
    groovyCode += `            '${field.name}': ${propertyName},\n`;
  }
  groovyCode += `        ]\n`;
  groovyCode += `    }\n\n`;

  // JSON serialization
  groovyCode += `    String toJson() {\n`;
  groovyCode += `        JsonBuilder builder = new JsonBuilder(toMap())\n`;
  groovyCode += `        return builder.toString()\n`;
  groovyCode += `    }\n\n`;

  groovyCode += `    static ${className} fromJson(String jsonString) {\n`;
  groovyCode += `        JsonSlurper slurper = new JsonSlurper()\n`;
  groovyCode += `        Map<String, Object> data = slurper.parseText(jsonString) as Map<String, Object>\n`;
  groovyCode += `        return new ${className}(data)\n`;
  groovyCode += `    }\n\n`;

  // Static builder method
  groovyCode += `    static ${className} builder() {\n`;
  groovyCode += `        return new ${className}()\n`;
  groovyCode += `    }\n`;

  groovyCode += `}\n`;
  return groovyCode;
}

function getGroovyType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'Integer'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'Long'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'Integer'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'Long'; break;
    case 'float': baseType = 'Float'; break;
    case 'double': baseType = 'Double'; break;
    case 'bool': baseType = 'Boolean'; break;
    case 'bytes': baseType = 'byte[]'; break;
    default: baseType = 'Object'; // For message types
  }

  if (repeated) {
    return `List<${baseType}>`;
  }
  
  return baseType;
}

function getGroovyDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return '[]';
  
  switch (protoType) {
    case 'string': return "''";
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      return '0';
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      return '0L';
    case 'uint32':
    case 'fixed32':
      return '0';
    case 'uint64':
    case 'fixed64':
      return '0L';
    case 'float': return '0.0f';
    case 'double': return '0.0d';
    case 'bool': return 'false';
    case 'bytes': return 'new byte[0]';
    default: return 'null';
  }
}

// Helper function to generate Scala case class from protobuf type
function generateScala(type: protobuf.Type): string {
  const className = type.name;
  const fields = type.fieldsArray;

  let scalaCode = `import play.api.libs.json._\nimport play.api.libs.functional.syntax._\n\n`;
  scalaCode += `/**\n * ${className} case class generated from proto definition\n */\n`;
  scalaCode += `case class ${className}(\n`;
  
  // Property declarations
  const properties = fields.map(field => {
    const scalaType = getScalaType(field.type, field.repeated);
    const defaultValue = getScalaDefaultValue(field.type, field.repeated);
    
    let property = '';
    if ((field as any).comment) {
      property += `  /** ${(field as any).comment} */\n`;
    }
    
    // Convert to camelCase for Scala property naming
    const propertyName = toCamelCase(field.name);
    property += `  ${propertyName}: ${scalaType} = ${defaultValue}`;
    
    return property;
  });
  
  scalaCode += properties.join(',\n');
  scalaCode += `\n) {\n\n`;

  // Validation method
  scalaCode += `  def validate: Either[List[String], ${className}] = {\n`;
  scalaCode += `    val errors = scala.collection.mutable.ListBuffer[String]()\n`;
  for (const field of fields) {
    if (!field.repeated && (field as any).required !== false) {
      const propertyName = toCamelCase(field.name);
      if (field.type === 'string') {
        scalaCode += `    if (${propertyName}.isEmpty) errors += "${field.name} is required"\n`;
      } else if (getScalaType(field.type, false).startsWith('Option')) {
        scalaCode += `    if (${propertyName}.isEmpty) errors += "${field.name} is required"\n`;
      }
    }
  }
  scalaCode += `    if (errors.isEmpty) Right(this) else Left(errors.toList)\n`;
  scalaCode += `  }\n\n`;

  // Copy method with builder pattern
  scalaCode += `  def update(\n`;
  const updateParams = fields.map(field => {
    const scalaType = getScalaType(field.type, field.repeated);
    const propertyName = toCamelCase(field.name);
    return `    ${propertyName}: ${scalaType} = this.${propertyName}`;
  });
  scalaCode += updateParams.join(',\n');
  scalaCode += `\n  ): ${className} = {\n`;
  scalaCode += `    copy(\n`;
  const copyParams = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `      ${propertyName} = ${propertyName}`;
  });
  scalaCode += copyParams.join(',\n');
  scalaCode += `\n    )\n`;
  scalaCode += `  }\n\n`;

  // toMap method
  scalaCode += `  def toMap: Map[String, Any] = Map(\n`;
  const mapEntries = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `    "${field.name}" -> ${propertyName}`;
  });
  scalaCode += mapEntries.join(',\n');
  scalaCode += `\n  )\n`;

  scalaCode += `}\n\n`;

  // Companion object with JSON support
  scalaCode += `object ${className} {\n\n`;

  // JSON Format
  scalaCode += `  implicit val ${className.toLowerCase()}Format: Format[${className}] = (\n`;
  const jsonReads = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    return `    (JsPath \\ "${field.name}").format[${getScalaType(field.type, field.repeated)}]`;
  });
  scalaCode += jsonReads.join(' and\n');
  scalaCode += `\n  )(${className}.apply, unlift(${className}.unapply))\n\n`;

  // Builder pattern
  scalaCode += `  def apply(): ${className} = ${className}()\n\n`;

  // fromMap method
  scalaCode += `  def fromMap(data: Map[String, Any]): ${className} = {\n`;
  scalaCode += `    ${className}(\n`;
  const fromMapParams = fields.map(field => {
    const propertyName = toCamelCase(field.name);
    const defaultValue = getScalaDefaultValue(field.type, field.repeated);
    const scalaType = getScalaType(field.type, field.repeated);
    return `      ${propertyName} = data.getOrElse("${field.name}", ${defaultValue}).asInstanceOf[${scalaType}]`;
  });
  scalaCode += fromMapParams.join(',\n');
  scalaCode += `\n    )\n`;
  scalaCode += `  }\n\n`;

  // JSON utility methods
  scalaCode += `  def fromJson(json: String): JsResult[${className}] = {\n`;
  scalaCode += `    Json.parse(json).validate[${className}]\n`;
  scalaCode += `  }\n\n`;

  scalaCode += `  def toJson(instance: ${className}): String = {\n`;
  scalaCode += `    Json.toJson(instance).toString\n`;
  scalaCode += `  }\n`;

  scalaCode += `}\n`;
  return scalaCode;
}

function getScalaType(protoType: string, repeated: boolean): string {
  let baseType: string;
  
  switch (protoType) {
    case 'string': baseType = 'String'; break;
    case 'int32':
    case 'sint32':
    case 'sfixed32':
      baseType = 'Int'; break;
    case 'int64':
    case 'sint64':
    case 'sfixed64':
      baseType = 'Long'; break;
    case 'uint32':
    case 'fixed32':
      baseType = 'Int'; break;
    case 'uint64':
    case 'fixed64':
      baseType = 'Long'; break;
    case 'float': baseType = 'Float'; break;
    case 'double': baseType = 'Double'; break;
    case 'bool': baseType = 'Boolean'; break;
    case 'bytes': baseType = 'Array[Byte]'; break;
    default: baseType = 'Map[String, Any]'; // For message types
  }

  if (repeated) {
    return `Seq[${baseType}]`;
  }
  
  // For proto3, fields can be optional
  return `Option[${baseType}]`;
}

function getScalaDefaultValue(protoType: string, repeated: boolean): string {
  if (repeated) return 'Seq.empty';
  
  switch (protoType) {
    case 'string': return 'None';
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
      return 'None';
    case 'float':
    case 'double':
      return 'None';
    case 'bool': return 'None';
    case 'bytes': return 'None';
    default: return 'None';
  }
}

// Helper function to convert camelCase/PascalCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
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

      case 'rust':
        for (const type of types) {
          output += generateRust(type) + '\n';
        }
        break;

      case 'c':
        for (const type of types) {
          output += generateC(type) + '\n';
        }
        break;

      case 'ruby':
        for (const type of types) {
          output += generateRuby(type) + '\n';
        }
        break;

      case 'swift':
        for (const type of types) {
          output += generateSwift(type) + '\n';
        }
        break;

      case 'kotlin':
        for (const type of types) {
          output += generateKotlin(type) + '\n';
        }
        break;

      case 'php':
        for (const type of types) {
          output += generatePHP(type) + '\n';
        }
        break;

      case 'dart':
        for (const type of types) {
          output += generateDart(type) + '\n';
        }
        break;

      case 'elixir':
        for (const type of types) {
          output += generateElixir(type) + '\n';
        }
        break;

      case 'groovy':
        for (const type of types) {
          output += generateGroovy(type) + '\n';
        }
        break;

      case 'scala':
        for (const type of types) {
          output += generateScala(type) + '\n';
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
    value: 'c',
    label: 'C',
    description: 'C struct definitions with function declarations, proper typedefs, and standard headers'
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
  },
  {
    value: 'dart',
    label: 'Dart',
    description: 'Dart classes with proper constructors, JSON serialization (toJson/fromJson), and Flutter-ready code'
  },
  {
    value: 'elixir',
    label: 'Elixir',
    description: 'Elixir modules with structs, pattern matching, guards, and Jason JSON serialization'
  },
  {
    value: 'go',
    label: 'Go',
    description: 'Go structs with JSON tags and protocol buffer field naming'
  },
  {
    value: 'groovy',
    label: 'Groovy',
    description: 'Groovy classes with dynamic features, annotations for JSON binding, and builder pattern support'
  },
  {
    value: 'java',
    label: 'Java',
    description: 'Java classes with builder pattern, getters/setters, and proper packaging'
  },
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
    value: 'kotlin',
    label: 'Kotlin',
    description: 'Kotlin data classes with nullable types, kotlinx.serialization annotations, and modern Android patterns'
  },
  {
    value: 'php',
    label: 'PHP',
    description: 'PHP classes with type hints (PHP 7.4+ syntax), JSON serialization methods, and proper validation'
  },
  {
    value: 'python',
    label: 'Python',
    description: 'Python dataclasses with type hints and validation'
  },
  {
    value: 'ruby',
    label: 'Ruby',
    description: 'Ruby classes with attribute accessors, JSON serialization, and snake_case naming'
  },
  {
    value: 'rust',
    label: 'Rust',
    description: 'Rust structs with Serde serialization, Option<T> for optional fields, and Vec<T> for arrays'
  },
  {
    value: 'scala',
    label: 'Scala',
    description: 'Scala case classes with Option types for optional fields, functional programming patterns, and Play JSON support'
  },
  {
    value: 'swift',
    label: 'Swift',
    description: 'Swift structs with Codable protocol, optional types for proto3 fields, and iOS development standards'
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    description: 'TypeScript interfaces with type safety'
  }
];