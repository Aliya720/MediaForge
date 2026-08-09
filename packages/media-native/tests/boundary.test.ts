import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Boundary Validation Tests for @mediaforge/media-native
 *
 * Verifies mandatory architectural invariants from Prompt 5:
 * 1. MUST NOT import 'media-react'
 * 2. MUST NOT import 'media-ui-react'
 * 3. MUST NOT import 'media-ui-native'
 * 4. MUST NOT reference DOM APIs (window, document, localStorage)
 * 5. MUST NOT call Pexels API directly
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

describe('@mediaforge/media-native Boundary Invariants', () => {
  const sourceFiles = getAllTsFiles(SRC_DIR);

  it('has source files to validate', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('MUST NOT depend on media-react', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden media-react import in ${relativePath}`).not.toMatch(/from\s+['"].*media-react.*['"]/);
    }
  });

  it('MUST NOT depend on media-ui-react or media-ui-native', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden UI package import in ${relativePath}`).not.toMatch(/from\s+['"].*media-ui.*['"]/);
    }
  });

  it('MUST NOT reference DOM APIs (window, document, localStorage)', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
        expect(trimmed, `Forbidden DOM access (window.) in ${relativePath}`).not.toMatch(/\bwindow\./);
        expect(trimmed, `Forbidden DOM access (document.) in ${relativePath}`).not.toMatch(/\bdocument\./);
        expect(trimmed, `Forbidden DOM access (localStorage) in ${relativePath}`).not.toMatch(/\blocalStorage\b/);
      }
    }
  });

  it('MUST NOT call Pexels API directly (must delegate to media-core client)', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Direct Pexels URL reference in ${relativePath}`).not.toMatch(/api\.pexels\.com/);
    }
  });
});
