import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const PREFIX = /^(inline|css):/;
const VIRTUAL = '\0inline-text:';

/**
 * Minimal equivalent of inlineImportPlugin.js (esbuild): modules loading a template
 * or the stylesheet through `inline:` stay importable from the tests.
 */
const inlineImport = () => ({
    name: 'inline-text',
    resolveId(source, importer) {
        if (!PREFIX.test(source) || !importer) return null;
        return VIRTUAL + path.resolve(path.dirname(importer), source.replace(PREFIX, ''));
    },
    async load(id) {
        if (!id.startsWith(VIRTUAL)) return null;
        return `export default ${JSON.stringify(await readFile(id.slice(VIRTUAL.length), 'utf8'))};`;
    },
});

export default defineConfig({
    plugins: [inlineImport()],
});
