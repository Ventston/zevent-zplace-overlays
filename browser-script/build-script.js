import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import inlineImportPlugin from "./inlineImportPlugin.js";

const resultEsbuild = await esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'zevent-place-overlay.user.js',
    format: 'iife',
    target: 'es2020',
    platform: 'browser',
    legalComments: 'none',
    minify: false,
    write: false,
    plugins: [
        inlineImportPlugin(),
        inlineImportPlugin({
            filter: /^css:/,
        })
    ]
}).catch(() => process.exit(1));

//add meta to the top of the file
const meta = fs.readFileSync('src/meta.js', 'utf8');
const output = `${meta}\n${resultEsbuild.outputFiles[0].text}`;
//write the output to the dist folder
fs.writeFileSync('zevent-place-overlay.user.js', output);
