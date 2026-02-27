import protobuf from 'protobufjs';

export type ConversionFormat = 'javascript' | 'json-schema' | 'typescript' | 'python';

export interface ConversionResult {
  success: boolean;
  format: ConversionFormat;
  output?: string;
  error?: string;
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

export async function convert(request: ConversionRequest): Promise<ConversionResult> {
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

      default:
        throw new Error(`Unsupported format: ${request.format}`);
    }

    return {
      success: true,
      format: request.format,
      output
    };

  } catch (error) {
    return {
      success: false,
      format: request.format,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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
  }
];