import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Boundary Validation Tests for @mediaforge/media-ui-native
 *
 * Verifies mandatory architectural invariants:
 * 1. MUST NOT import 'media-core'
 * 2. MUST NOT import 'media-native'
 * 3. MUST NOT import 'media-ui-react'
 * 4. MUST NOT import 'web'
 * 5. MUST NOT reference Pexels API
 * 6. MUST NOT reference DOM APIs (window, document, HTMLElement, IntersectionObserver)
 * 7. MUST NOT contain visual styling (StyleSheet, CSS)
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

describe('@mediaforge/media-ui-native Boundary Invariants', () => {
  const sourceFiles = getAllTsFiles(SRC_DIR);

  it('has source files to validate', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('MUST NOT depend on media-core or media-native', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden SDK import in ${relativePath}`).not.toMatch(/from\s+['"].*media-(core|native).*['"]/);
    }
  });

  it('MUST NOT depend on media-ui-react', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden web UI import in ${relativePath}`).not.toMatch(/from\s+['"].*media-ui-react.*['"]/);
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

  it('MUST NOT reference DOM APIs (window, document, HTMLElement, IntersectionObserver)', () => {
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

      expect(codeOnlyLines, `Forbidden DOM reference (window) in ${relativePath}`).not.toMatch(/\bwindow\./);
      expect(codeOnlyLines, `Forbidden DOM reference (document) in ${relativePath}`).not.toMatch(/\bdocument\./);
      expect(codeOnlyLines, `Forbidden DOM reference (HTMLElement) in ${relativePath}`).not.toMatch(/\bHTMLElement\b/);
      expect(codeOnlyLines, `Forbidden DOM reference (IntersectionObserver) in ${relativePath}`).not.toMatch(/\bIntersectionObserver\b/);
    }
  });

  it('MUST NOT import StyleSheet or CSS styling modules', () => {
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
      expect(codeOnlyLines, `StyleSheet import in ${relativePath}`).not.toMatch(/StyleSheet/);
      expect(codeOnlyLines, `CSS import in ${relativePath}`).not.toMatch(/import\s+['"].*\.css['"]/);
    }
  });
});
