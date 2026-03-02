// Quick test of the new converters
const { convert } = require('./src/lib/converters.ts');

// Sample proto content
const protoContent = `
syntax = "proto3";

package example;

message User {
  int32 id = 1;
  string email = 2;
  string name = 3;
  repeated string tags = 4;
  bool is_active = 5;
}

message Address {
  string street = 1;
  string city = 2;
  string zip_code = 3;
  double latitude = 4;
  double longitude = 5;
}
`;

async function testConverters() {
  const formats = ['rust', 'c', 'ruby'];
  
  for (const format of formats) {
    console.log(`\n=== Testing ${format.toUpperCase()} ===`);
    try {
      const result = await convert({
        content: protoContent,
        format: format
      });
      
      if (result.success) {
        console.log('✅ Conversion successful');
        console.log('Sample output:');
        console.log(result.output?.substring(0, 500) + '...');
      } else {
        console.log('❌ Conversion failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testConverters();