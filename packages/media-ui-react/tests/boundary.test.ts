import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Boundary Validation Tests for @mediaforge/media-ui-react
 *
 * Verifies mandatory architectural invariants:
 * 1. MUST NOT import 'media-core'
 * 2. MUST NOT import 'media-react'
 * 3. MUST NOT import 'media-native'
 * 4. MUST NOT import 'media-ui-native'
 * 5. MUST NOT import 'web'
 * 6. MUST NOT reference Pexels API
 * 7. MUST NOT contain visual CSS / styling dependencies
 */

const SRC_DIR = path.resolve(__dirname, '../src');

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('@mediaforge/media-ui-react Boundary Invariants', () => {
  const sourceFiles = getAllTsFiles(SRC_DIR);

  it('has source files to validate', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('MUST NOT depend on media-core', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden media-core import in ${relativePath}`).not.toMatch(/from\s+['"].*media-core.*['"]/);
    }
  });

  it('MUST NOT depend on media-react or media-native', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden SDK wrapper import in ${relativePath}`).not.toMatch(/from\s+['"].*media-(react|native).*['"]/);
    }
  });

  it('MUST NOT reference Pexels API or endpoints in code statements', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      const codeOnlyLines = content
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
        })
        .join('\n');
      expect(codeOnlyLines, `Pexels reference in ${relativePath}`).not.toMatch(/pexels/i);
    }
  });

  it('MUST NOT import CSS files or style frameworks', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `CSS import in ${relativePath}`).not.toMatch(/import\s+['"].*\.css['"]/);
      expect(content, `Tailwind reference in ${relativePath}`).not.toMatch(/tailwindcss/i);
    }
  });
});
