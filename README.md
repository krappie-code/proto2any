# proto2any.com

A modern Protocol Buffer conversion tool that transforms .proto files into various target formats including code generation, documentation, and schema exports.

🔗 **Companion to [protolint.com](https://protolint.com)** - lint your .proto files first, then convert them here!

## Features

- **Monaco Editor** with .proto syntax highlighting
- **Multiple conversion formats**: JavaScript, TypeScript, JSON Schema, Python
- **Planned formats**: Go, C++, HTML docs, Markdown, OpenAPI, GraphQL, SQL DDL
- **REST API** for CI/CD integration (`/api/convert`)
- **Drag & drop** file upload
- **Stateless design** - no database required
- **Dark theme** UI consistent with protolint.com

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Monaco Editor
- protobuf.js

## Deployment

### 🚀 Vercel (Recommended)

This app is designed for **seamless Vercel deployment**:

- ✅ **Next.js frontend** with static generation
- ✅ **API routes** become serverless functions automatically
- ✅ **No backend/database** required
- ✅ **Stateless design** perfect for serverless

**Deploy Options:**

1. **GitHub Integration** (easiest):
   - Connect your Vercel account to this GitHub repo
   - Auto-deploys on push to main branch
   - Set custom domain to `proto2any.com`

2. **Vercel CLI**:
   ```bash
   npx vercel login
   npx vercel --prod
   ```

3. **Import from GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Import this repository
   - Deploy with default settings

**Domain Setup:**
- Add `proto2any.com` as a custom domain in Vercel dashboard
- Configure DNS to point to Vercel's servers

### Architecture

Like protolint.com, this is a **stateless Next.js app** where:
- Frontend serves the Monaco editor and UI
- `/api/convert` endpoint handles conversions as serverless functions
- All conversion logic runs server-side via protobuf.js
- No database or persistent storage needed

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## API Usage

### Convert Protocol Buffer

```bash
# Convert with JSON body
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "content": "syntax = \"proto3\";\npackage example;\nmessage User {\n  string name = 1;\n  int32 age = 2;\n}",
    "format": "javascript"
  }'

# Convert with file upload
curl -X POST http://localhost:3000/api/convert \
  -F "file=@example.proto" \
  -F "format=typescript"
```

### Supported Formats

**✅ Currently Available:**
- `javascript` - ES6 classes with validation
- `typescript` - TypeScript interfaces
- `python` - Python dataclasses
- `json-schema` - JSON Schema Draft 2019-09

**🚧 Coming Soon:**
- `go` - Go structs
- `cpp` - C++ headers
- `openapi` - OpenAPI/Swagger specs
- `graphql` - GraphQL schemas
- `html-docs` - HTML documentation
- `markdown` - Markdown tables
- `sql` - SQL DDL

## Related Tools

- **[protolint.com](https://protolint.com)** - Protocol Buffer linting and validation

## License

MIT