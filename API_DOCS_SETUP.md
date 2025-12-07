# API Documentation Setup Guide

## Overview

The AIDevelo.ai API uses **OpenAPI 3.0** (formerly Swagger) for comprehensive API documentation. The documentation is automatically generated from JSDoc annotations in the codebase.

## Accessing the Documentation

### Interactive Swagger UI

Once the server is running, access the interactive documentation at:

```
http://localhost:5000/api-docs
```

The Swagger UI provides:
- ✅ Browse all API endpoints
- ✅ View request/response schemas
- ✅ Test endpoints directly from the browser
- ✅ See example requests and responses
- ✅ Validate API calls

### OpenAPI Specification

The OpenAPI JSON specification is available at:

```
http://localhost:5000/api-docs/swagger.json
```

## Documentation Structure

### Code Annotations

API documentation is defined using JSDoc annotations in route files:

**Location:** `server/src/routes/*.ts`

Example:
```typescript
/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new AI voice agent
 *     tags: [Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 */
router.post('/', validateRequest(CreateAgentSchema), createAgent);
```

### Schema Definitions

Reusable schemas are defined in:

**Location:** `server/src/config/swagger.ts`

This file contains:
- Base OpenAPI configuration
- Component schemas (BusinessProfile, AgentConfig, VoiceAgent, etc.)
- Common response definitions
- Error response templates

## Generating OpenAPI Specification File

### Method 1: Using the Script

```bash
cd server
npx ts-node scripts/generate-openapi.ts
```

This generates `server/openapi.json` which can be:
- Imported into Postman
- Used with code generators
- Shared with API consumers
- Version controlled

### Method 2: From Running Server

The specification is automatically available at:
```
GET http://localhost:5000/api-docs/swagger.json
```

## Adding New Endpoints

### Step 1: Add JSDoc Annotation

Add a JSDoc comment above your route handler:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint/:id', handler);
```

### Step 2: Define Schema (if new)

Add to `server/src/config/swagger.ts` in the `components.schemas` section:

```typescript
YourSchema: {
  type: 'object',
  properties: {
    field: {
      type: 'string',
      example: 'value'
    }
  }
}
```

### Step 3: Test in Swagger UI

1. Start the server: `npm run dev`
2. Navigate to `http://localhost:5000/api-docs`
3. Find your new endpoint
4. Test it using the "Try it out" feature

## Documentation Best Practices

### 1. Comprehensive Descriptions
- Always include a `summary` and `description`
- Explain what the endpoint does and when to use it

### 2. Request/Response Examples
- Provide realistic examples
- Show both success and error responses

### 3. Parameter Documentation
- Document all path, query, and header parameters
- Specify required vs optional
- Include validation rules

### 4. Error Responses
- Document all possible error responses
- Use reusable error schemas from `components.responses`

### 5. Tags
- Group related endpoints with tags
- Keep tag names consistent

## Tools and Integrations

### Postman
Import the OpenAPI spec:
1. Open Postman
2. Import → Link
3. Enter: `http://localhost:5000/api-docs/swagger.json`

### Insomnia
Import the OpenAPI spec:
1. Create → Import → From URL
2. Enter: `http://localhost:5000/api-docs/swagger.json`

### Code Generation
Use tools like:
- [openapi-generator](https://openapi-generator.tech/)
- [swagger-codegen](https://swagger.io/tools/swagger-codegen/)

Example:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:5000/api-docs/swagger.json \
  -g typescript-axios \
  -o ./generated-client
```

## CI/CD Integration

### Generate Spec on Build

Add to your CI/CD pipeline:

```yaml
# .github/workflows/api-docs.yml
- name: Generate OpenAPI Spec
  run: |
    cd server
    npm run build
    npx ts-node scripts/generate-openapi.ts
    
- name: Upload OpenAPI Spec
  uses: actions/upload-artifact@v3
  with:
    name: openapi-spec
    path: server/openapi.json
```

### Deploy Documentation

Options for hosting:
1. **GitHub Pages** - Host static Swagger UI
2. **Netlify/Vercel** - Deploy documentation site
3. **ReadTheDocs** - Host markdown documentation
4. **Redoc** - Generate beautiful static docs

## Maintenance

### Updating Documentation

1. Update JSDoc annotations in route files
2. Update schemas in `swagger.ts` if needed
3. Restart server to see changes
4. Regenerate `openapi.json` if using the file

### Versioning

Update the API version in:
- `server/src/config/swagger.ts` → `info.version`
- Consider semantic versioning (1.0.0, 1.1.0, 2.0.0)

### Review Process

Before releasing:
- ✅ All endpoints documented
- ✅ Examples are accurate
- ✅ Error responses documented
- ✅ OpenAPI spec validates (use [Swagger Editor](https://editor.swagger.io/))

## Troubleshooting

### Documentation Not Appearing

1. Check server is running
2. Verify route file is in `apis` array in `swagger.ts`
3. Check JSDoc syntax is correct
4. Look for TypeScript compilation errors

### Schema Not Found

- Ensure schema is defined in `components.schemas`
- Check `$ref` path is correct (e.g., `#/components/schemas/YourSchema`)

### Swagger UI Not Loading

- Check browser console for errors
- Verify `swagger-ui-express` is installed
- Check server logs for errors

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
- [OpenAPI Generator](https://openapi-generator.tech/)

## Summary

✅ **Interactive docs:** `http://localhost:5000/api-docs`  
✅ **OpenAPI spec:** `http://localhost:5000/api-docs/swagger.json`  
✅ **Documentation guide:** `server/API_DOCUMENTATION.md`  
✅ **Generate spec:** `npx ts-node scripts/generate-openapi.ts`

