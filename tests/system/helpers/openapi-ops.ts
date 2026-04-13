import fs from 'node:fs';
import path from 'node:path';

export type OpenApiOperation = {
  source: string;
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
};

const METHOD_PATTERN = /^\s{4}(get|post|put|patch|delete):\s*$/i;
const PATH_PATTERN = /^\s{2}(\/[^:]+):\s*$/;

const parseOperationsFromFile = (sourceFilePath: string): OpenApiOperation[] => {
  const operations: OpenApiOperation[] = [];
  const lines = fs.readFileSync(sourceFilePath, 'utf8').split(/\r?\n/);

  let currentPath: string | null = null;
  for (const line of lines) {
    const pathMatch = line.match(PATH_PATTERN);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = line.match(METHOD_PATTERN);
    if (currentPath && methodMatch) {
      operations.push({
        source: path.basename(sourceFilePath),
        path: currentPath,
        method: methodMatch[1].toLowerCase() as OpenApiOperation['method'],
      });
    }
  }

  return operations;
};

export const loadAllOpenApiOperations = (workspaceRoot: string): OpenApiOperation[] => {
  const openApiFiles = [
    'openapi-auth.generated.yaml',
    'openapi-exam.generated.yaml',
    'openapi-study.generated.yaml',
    'openapi-community.generated.yaml',
  ];

  const operations = openApiFiles.flatMap((fileName) => {
    const fullPath = path.join(workspaceRoot, fileName);
    return parseOperationsFromFile(fullPath);
  });

  return operations
    .filter((operation) => !operation.path.includes('/sse'))
    .sort((left, right) => {
      const sourceCompare = left.source.localeCompare(right.source);
      if (sourceCompare !== 0) {
        return sourceCompare;
      }
      const pathCompare = left.path.localeCompare(right.path);
      if (pathCompare !== 0) {
        return pathCompare;
      }
      return left.method.localeCompare(right.method);
    });
};
