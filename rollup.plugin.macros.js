//@ts-check

import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import prettier from "prettier";


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
 *      externalPackages?: Packages,
 *      onReplace?: (s: unknown) => string
 * }} options 
 * @returns {{name: string, transform: Function}}
 */
export function calculableMacros(options = {}) {

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

            const self = this;

            //@ts-ignore
            source.replaceAll(/\/\*\* MACRO `([\w,_ \(\)\="'\.\+]+)` \*\/([\s\S]+)\/\*\* END_MACRO \*\//g, function (block, names, content) {
                console.log(file);

                names.split(',').map(w => w.trim()).forEach(macro => {
                    if (options.macroses[macro] !== undefined) {
                        if (typeof options.macroses[macro] === 'string') {
                            // content = content.replace(new RegExp(macro.replace(/([\(\)\+])/g, '\\$1')), options.macroses[macro] ? '(' + options.macroses[macro] + ')' : '')
                            content = content.replace(new RegExp(macro.replace(/([\(\)\+])/g, '\\$1')), options.macroses[macro]
                                ? '(' + options.macroses[macro] + ')'
                                : '')
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
                    else {
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

                if (~content.indexOf('`')) {
                    console.warn('Warnings! Be carefull. Using "`" symbol inside macros script could raise an error');
                }

                // let eval2 = new Function(`{file, path, fs, fs__default}`, `return eval((() => {${content}})())`)

                // Issues: 
                // could using `` templates if macroses returns {object} and not string
                // else if => string => `` inside function its returned raise error 

                let eval2 = new Function(`{file, ${Object.keys(externalPackages).concat(Object.keys(commonjsPackages))}}`, `return eval((() => {
                    ${content}
                })())`)

                // let eval2 = new Function(`{file, ${Object.keys(externalPackages).concat(Object.keys(commonjsPackages))}}`, `return eval(\`(() => {
                //     ${content}
                // })()\`)`)

                // var eval2 = eval.bind(globalThis, `(() => {${content}})()`);

                /**
                 * @type {Array<string>}
                 */
                let r = eval2({ file: file, ...externalPackages, ...commonjsPackages });
                // let r = eval()`eval((() => {${content}})())`)

                // if (r === undefined) {
                //     throw new Error(`Result of macros execution is undefined. \nCheck macros content "${names}" in "${file}". Macro code must have "return" construction on end`);
                // }
                // else
                if (typeof r !== 'string') {
                    //@ts-ignore
                    self.warn('Warning: returned value from macro script is not a string');
                }

                return options.onReplace ? options.onReplace(r) : 'return ' + r;
            })

            let generatedCode = source.toString()

            if (options.prettify && options.comments === false) {
                generatedCode = generatedCode.replace(/\/\*[\S\s]*?\*\//g, '')
            }

            if (options.prettify) {
                generatedCode = prettier.format(generatedCode, { parser: 'babel', tabWidth: 2, printWidth: 120 })
                // console.log(this);
                //@ts-ignore
                this.warn('Warning: prettify option could break source maps');
                // let c = minify(generatedCode, {compress: false, output: {comments: false}})
            }

            let r = { code: generatedCode, map: source.generateMap({ hires: false, file: file }) };

            //@ts-ignore
            return r;
        }
    };
}