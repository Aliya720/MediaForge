/**
 * MediaForge Automated Architecture Boundary Check Script
 *
 * Scans source code across all monorepo packages to strictly enforce
 * architectural invariants, package boundaries, and circular dependency prevention.
 *
 * Exits with status code 0 if all rules pass, or exit status 1 if any violation occurs.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const violations = [];

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function getCodeOnlyLines(content) {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');
}

// ─── Rule 1: media-core Invariants ──────────────────────────────────────────
function checkMediaCore() {
  const pkgPath = path.join(ROOT_DIR, 'packages/media-core/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"]react['"]|from\s+['"]react-native['"]/.test(code)) {
      violations.push({
        package: 'media-core',
        file: relFile,
        rule: 'MUST NOT import React or React Native',
        details: 'media-core must remain framework agnostic',
      });
    }

    if (/from\s+['"].*media-(react|native|ui-react|ui-native).*['"]/.test(code)) {
      violations.push({
        package: 'media-core',
        file: relFile,
        rule: 'MUST NOT import downstream packages',
        details: 'media-core cannot depend on wrapper or UI packages',
      });
    }

    if (/\bwindow\./.test(code) || /\bdocument\./.test(code) || /\bHTMLElement\b/.test(code)) {
      violations.push({
        package: 'media-core',
        file: relFile,
        rule: 'MUST NOT reference DOM APIs',
        details: 'media-core must remain usable in Node.js / CLI environments',
      });
    }
  }
}

// ─── Rule 2: media-react Invariants ─────────────────────────────────────────
function checkMediaReact() {
  const pkgPath = path.join(ROOT_DIR, 'packages/media-react/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"].*media-(ui-react|ui-native|native).*['"]/.test(code)) {
      violations.push({
        package: 'media-react',
        file: relFile,
        rule: 'MUST NOT import UI packages or media-native',
        details: 'media-react is solely an SDK React wrapper',
      });
    }
  }
}

// ─── Rule 3: media-native Invariants ────────────────────────────────────────
function checkMediaNative() {
  const pkgPath = path.join(ROOT_DIR, 'packages/media-native/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"].*media-(react|ui-react|ui-native).*['"]/.test(code)) {
      violations.push({
        package: 'media-native',
        file: relFile,
        rule: 'MUST NOT import media-react or UI packages',
        details: 'media-native is solely an SDK React Native wrapper',
      });
    }
  }
}

// ─── Rule 4: media-ui-react Invariants ──────────────────────────────────────
function checkMediaUiReact() {
  const pkgPath = path.join(ROOT_DIR, 'packages/media-ui-react/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"].*media-(core|react|native|ui-native).*['"]/.test(code)) {
      violations.push({
        package: 'media-ui-react',
        file: relFile,
        rule: 'MUST NOT import SDK packages or media-ui-native',
        details: 'media-ui-react must remain independent from the SDK',
      });
    }

    if (/import\s+['"].*\.css['"]/.test(code) || /\bStyleSheet\b/.test(code)) {
      violations.push({
        package: 'media-ui-react',
        file: relFile,
        rule: 'MUST NOT contain visual CSS or styling',
        details: 'media-ui-react is a styling-agnostic headless UI library',
      });
    }

    if (/pexels/i.test(code)) {
      violations.push({
        package: 'media-ui-react',
        file: relFile,
        rule: 'MUST NOT reference Pexels API',
        details: 'media-ui-react must work with generic media types T',
      });
    }
  }
}

// ─── Rule 5: media-ui-native Invariants ─────────────────────────────────────
function checkMediaUiNative() {
  const pkgPath = path.join(ROOT_DIR, 'packages/media-ui-native/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"].*media-(core|react|native|ui-react).*['"]/.test(code)) {
      violations.push({
        package: 'media-ui-native',
        file: relFile,
        rule: 'MUST NOT import SDK packages or media-ui-react',
        details: 'media-ui-native must remain independent from the SDK',
      });
    }

    if (/import\s+['"].*\.css['"]/.test(code) || /\bStyleSheet\b/.test(code)) {
      violations.push({
        package: 'media-ui-native',
        file: relFile,
        rule: 'MUST NOT contain visual CSS or styling',
        details: 'media-ui-native is a styling-agnostic headless UI library',
      });
    }

    if (/\bwindow\./.test(code) || /\bdocument\./.test(code) || /\bHTMLElement\b/.test(code)) {
      violations.push({
        package: 'media-ui-native',
        file: relFile,
        rule: 'MUST NOT reference DOM APIs',
        details: 'media-ui-native uses React Native accessibility primitives',
      });
    }
  }
}

// ─── Rule 6: apps/web Invariants ────────────────────────────────────────────
function checkAppsWeb() {
  const pkgPath = path.join(ROOT_DIR, 'apps/web/src');
  const files = getAllFiles(pkgPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const code = getCodeOnlyLines(content);
    const relFile = path.relative(ROOT_DIR, file);

    if (/from\s+['"].*media-(native|ui-native).*['"]/.test(code)) {
      violations.push({
        package: 'apps/web',
        file: relFile,
        rule: 'MUST NOT import React Native packages',
        details: 'apps/web is a React Web application',
      });
    }
  }
}

// ─── Run All Checks ──────────────────────────────────────────────────────────
console.log('\n🔍 Running MediaForge Automated Architectural Boundary Validation...\n');

checkMediaCore();
checkMediaReact();
checkMediaNative();
checkMediaUiReact();
checkMediaUiNative();
checkAppsWeb();

if (violations.length === 0) {
  console.log('✅ ALL ARCHITECTURAL INVARIANTS PASSED SUCCESSFULLY!');
  console.log('   - media-core: pure framework-agnostic TypeScript');
  console.log('   - media-react & media-native: isolated SDK wrappers');
  console.log('   - media-ui-react & media-ui-native: independent headless primitives');
  console.log('   - apps/web: clean application composition layer\n');
  process.exit(0);
} else {
  console.error(`❌ ARCHITECTURAL VIOLATIONS DETECTED: ${violations.length}\n`);
  violations.forEach((v, idx) => {
    console.error(`${idx + 1}. [${v.package}] File: ${v.file}`);
    console.error(`   Rule: ${v.rule}`);
    console.error(`   Details: ${v.details}\n`);
  });
  process.exit(1);
}
