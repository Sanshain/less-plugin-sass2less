//@ts-check

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import astMacros from "rollup-plugin-ast-macros";
import { createFilter } from '@rollup/pluginutils';


import MagicString from 'magic-string';
import prettier from "prettier";
// import { minify } from "terser";
// import { minify } from "uglify-js";

import fs from "fs";
import path from 'path';
// import { requireStaticLinking } from './rollup.plugin.macros';

// console.log(path.relative.name);  // <- DONT REMOVE.


// import typescript from '@rollup/plugin-typescript';


/**
 * typedef {Object<string, object>} Packages
 * typedef {{[k: string] : object} & Object<string, object>} Packages
 * @typedef {{[k: string] : object}} Packages
 * @typedef {{externalPackages: Packages, value: string}} MacrosDetails
 * 
 * @param {{
 *      include?: string,
 *      exclude?: string,
 *      macroses?: {[k: string]: string | MacrosDetails},
 *      prettify?: boolean,
 *      comments?: false,
 *      externalPackages?: Packages
 * }} options 
 * @returns {{name: string, transform: Function}}
 */
export function requireStaticLinking(options = {}) {

    const filter = createFilter(options.include, options.exclude);
    if (!options.macroses) {
        // throw new Error('macroses field is empty. set the macroses field to an array of functions corresponding to each macro')
        console.warn('Macroses field is empty. Set the macroses field of build options to an array of functions corresponding to each macro')
    }

    if (!options.prettify && options.comments === false) {
        console.warn('Comments field is working only in combination with prettify field in true')
    }

    options.externalPackages = options.externalPackages || {}

    return {
        name: 'rollup-plugin-macros-calculate',
        /**
         * 
         * @param {string} code 
         * @param {string} file 
         * @returns {{code: string, map?: {mappings: MagicString|''|null}}}
         * @_returns {Promise<{code: string, map?: {mappings: MagicString|''|null}}>}
         */
        transform(code, file) {

            if (!filter(file) || !options.macroses) return;

            let externalPackages = options.externalPackages;
            let source = new MagicString(code)

            //@ts-ignore
            source.replaceAll(/\/\*\* MACRO `([\w,_ \(\)\="']+)` \*\/([\s\S]+)\/\*\* END_MACRO \*\//g, function (block, names, content) {
                console.log(file);

                names.split(',').map(w => w.trim()).forEach(macro => {
                    if (options.macroses[macro] !== undefined) {
                        if (typeof options.macroses[macro] === 'string') {
                            content = content.replace(new RegExp(macro.replace(/([\(\)])/g, '\\$1')), options.macroses[macro] ? '(' + options.macroses[macro] + ')' : '')
                        }
                        else if (typeof options.macroses[macro] === 'object' && typeof options.macroses[macro]['value'] === 'string') {
                            
                            /**
                             * @type {MacrosDetails}
                             */
                            let macrosOptions = options.macroses[macro]['value'];
                            content = content.replace(new RegExp(macro.replace(/([\(\)])/g, '\\$1')), macrosOptions.value ? '(' + macrosOptions.value + ')' : '');

                            externalPackages = { externalPackages, ...macrosOptions.externalPackages }
                        }
                        else {
                            throw new Error(`Error: wrong macro "${macro}" value`)
                        }
                    }
                    else{
                        console.warn(`Undefined macro "${macro}" in ${file}`);
                    }
                });

                const commonjsPackages = Object.entries(externalPackages).map(function ([key, value], i) {
                    /**
                     * @type {[string, {default: object}]}
                     */
                    let r = [
                        key + '__default',
                        {
                            default: value
                        }
                    ];
                    return r;
                }).reduce((acc, [k, v]) => (acc[k] = v, acc), {})
                
                // let eval2 = new Function(`{file, path, fs, fs__default}`, `return eval((() => {${content}})())`)
                let eval2 = new Function(`{file, ${Object.keys(externalPackages).concat(Object.keys(commonjsPackages))}}`, `return eval((() => {${content}})())`)
                // var eval2 = eval.bind(globalThis, `(() => {${content}})()`);

                /**
                 * @type {Array<string>}
                 */
                let r = eval2({ file, ...externalPackages, ...commonjsPackages });
                // let r = eval()`eval((() => {${content}})())`)

                return 'return [\n' + r.toString() + ']'
            })

            let generatedCode = source.toString()

            if (options.prettify && options.comments === false) {
                generatedCode = generatedCode.replace(/\/\*[\S\s]*?\*\//g, '')
            }

            if (options.prettify) {
                generatedCode = prettier.format(generatedCode, { parser: 'babel', tabWidth: 2, printWidth: 120 })
                console.warn('Warning: prettify option could break source maps');
                // let c = minify(generatedCode, {compress: false, output: {comments: false}})
            }

            let r = { code: generatedCode, map: source.generateMap({ hires: false, file: file }) };

            //@ts-ignore
            return r;
        }
    };
}




const buildOptions =  {
    input: './lib/index.js',
    // input: './source/app.ts',
    output: {
        file: './build/sass2less.js',
        format: 'iife',
        name: "toLESS",
    },
    plugins: [
        // astMacros(),
        requireStaticLinking({
            prettify: true,
            comments: false,
            externalPackages: {path, fs},            
            macroses: {
                import: (function (_path) {
                    let code = fs.readFileSync(_path).toString()
                    console.log(_path);
                    // try {
                    //     var obj = eval(code)
                    // }
                    // catch (er){
                    
                    // let esCode = `export default (function (_, $, module) {\n\n${code}\n\nreturn module.exports\n})()`

                    let flatCode = code.replace('module.exports = ', '')
                    // console.log(flatCode);
                    let hasCLosingComma = flatCode.trim().slice(-1) === ';'
                    if (hasCLosingComma) {
                        flatCode = flatCode.trim().slice(0, -1)
                    }
                    // var obj = eval('(' + flatCode + ')');
                    
                    // }
                    return flatCode
                }).toString(),
                __dirname: '`${path.dirname(path.relative(process.cwd(), file))}`',
                "let fs = require('fs')": ''
            }
        }),
        resolve({
            browser: true
        }),
        commonjs(),
        // typescript({
        //     // module: 'CommonJS', 
        //     // tsconfig: false, 
        //     lib: ["es6", "dom"], //es5
        //     target: "es5",
        //     sourceMap: true
        // }),
    ]
};

if (!~process.argv.indexOf('-c')) {
    import("rollup").then(function({rollup}) {
        
        //@ts-ignore
        rollup(buildOptions).then(bundle => {
            // console.log(bundle);
            //@ts-ignore
            bundle.generate(buildOptions.output).then(function ({ output}) {
                // console.log(output);                
                fs.writeFileSync(buildOptions.output.file, output[0].code)
            })
        }).catch(er => {
            console.warn(er);
        })
    })
}

export default buildOptions;