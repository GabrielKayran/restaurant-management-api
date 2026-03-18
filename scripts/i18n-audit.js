import path from 'path';

import fs from 'fs';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'common', 'i18n', 'locales');
const LEGACY_PT_BR_FILE = path.join(LOCALES_DIR, 'pt-BR.json');
const PT_BR_FOLDER = path.join(LOCALES_DIR, 'pt-BR');

const TRANSLATION_KEY_LITERAL_REGEX =
  /['"`]((?:errors|validation|messages)\.[A-Za-z0-9_.-]+)['"`]/g;

function walkFiles(startDir, extension) {
  if (!fs.existsSync(startDir)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath, extension));
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith(extension)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function flattenObject(obj, parentKey = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenObject(value, currentKey));
      continue;
    }

    if (typeof value === 'string') {
      keys.push(currentKey);
    }
  }

  return keys;
}

function safeReadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function collectUsedKeys() {
  const tsFiles = walkFiles(SRC_DIR, '.ts');
  const keyToFiles = new Map();

  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.matchAll(TRANSLATION_KEY_LITERAL_REGEX);

    for (const match of matches) {
      const key = match[1];
      const currentFiles = keyToFiles.get(key) ?? new Set();
      currentFiles.add(path.relative(ROOT_DIR, filePath));
      keyToFiles.set(key, currentFiles);
    }
  }

  return keyToFiles;
}

function collectLocaleKeys() {
  const keys = new Set();

  if (fs.existsSync(LEGACY_PT_BR_FILE)) {
    const legacy = safeReadJson(LEGACY_PT_BR_FILE);
    for (const key of flattenObject(legacy)) {
      keys.add(key);
    }
  }

  if (fs.existsSync(PT_BR_FOLDER)) {
    const jsonFiles = walkFiles(PT_BR_FOLDER, '.json');

    for (const jsonFile of jsonFiles) {
      const fileContent = safeReadJson(jsonFile);
      const relativePath = path.relative(PT_BR_FOLDER, jsonFile);
      const withoutExt = relativePath.replace(/\.json$/i, '');
      const prefix = withoutExt.split(path.sep).join('.');

      for (const key of flattenObject(fileContent, prefix)) {
        keys.add(key);
      }
    }
  }

  return keys;
}

function sortStrings(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function printList(title, values) {
  console.log(`\n${title} (${values.length})`);

  if (!values.length) {
    console.log('- none');
    return;
  }

  for (const value of values) {
    console.log(`- ${value}`);
  }
}

function main() {
  const usedKeyToFiles = collectUsedKeys();
  const localeKeys = collectLocaleKeys();

  const usedKeys = new Set(usedKeyToFiles.keys());

  const missing = sortStrings(
    [...usedKeys].filter((key) => !localeKeys.has(key)),
  );
  const unused = sortStrings(
    [...localeKeys].filter((key) => !usedKeys.has(key)),
  );

  console.log('i18n audit (pt-BR)');
  console.log(`- used keys: ${usedKeys.size}`);
  console.log(`- locale keys: ${localeKeys.size}`);

  printList('Missing keys (used in code, absent in locale)', missing);
  printList('Unused keys (present in locale, not referenced in code)', unused);

  if (missing.length) {
    console.log('\nAudit failed: missing translation keys found.');
    process.exit(1);
  }

  console.log(
    '\nAudit passed: all referenced keys exist in pt-BR locale files.',
  );
}

main();
