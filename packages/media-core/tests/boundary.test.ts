import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Boundary Validation Tests
 *
 * These tests verify that media-core maintains its framework-agnostic invariant
 * by scanning all source files for forbidden imports.
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

describe('Package Boundary Invariants', () => {
  const sourceFiles = getAllTsFiles(SRC_DIR);

  it('has source files to validate', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('MUST NOT import react', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden 'react' import in ${relativePath}`).not.toMatch(/from\s+['"]react['"]/);
      expect(content, `Forbidden 'react' import in ${relativePath}`).not.toMatch(/require\s*\(\s*['"]react['"]\s*\)/);
    }
  });

  it('MUST NOT import react-native', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden 'react-native' import in ${relativePath}`).not.toMatch(/from\s+['"]react-native['"]/);
    }
  });

  it('MUST NOT reference DOM APIs (window, document, localStorage)', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      // Check for direct DOM access (not in comments or strings)
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
        expect(trimmed, `Forbidden DOM access (window.) in ${relativePath}`).not.toMatch(/\bwindow\./);
        expect(trimmed, `Forbidden DOM access (document.) in ${relativePath}`).not.toMatch(/\bdocument\./);
        expect(trimmed, `Forbidden DOM access (localStorage) in ${relativePath}`).not.toMatch(/\blocalStorage\b/);
        expect(trimmed, `Forbidden DOM access (sessionStorage) in ${relativePath}`).not.toMatch(/\bsessionStorage\b/);
      }
    }
  });

  it('MUST NOT reference process.env', () => {
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      expect(content, `Forbidden process.env reference in ${relativePath}`).not.toMatch(/process\.env/);
    }
  });
});
