import { createFilter } from '@rollup/pluginutils';


import MagicString from 'magic-string';
import prettier from "prettier";


/**
 * 
 * @param {{
 *      include?: string,
 *      exclude?: string,
 *      macroses?: {[k: string]: string},
 *      prettify?: boolean,
 *      comments?: false,
 *      warn?: (warn) => void
 * }} options 
 * @returns 
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

    return {
        name: 'rollup-plugin-macros-calculate',
        options(options) {
            console.log(8888888888);
            this.warn = () => {
                console.log(8888888888);
            }
            console.log('this');
            return null;
        },
        warn: () => { console.log(889); },
        /**
         * 
         * @param {string} code 
         * @param {string} file 
         * @returns {{code: string, map?: {mappings: MagicString|''|null}}}
         * @_returns {Promise<{code: string, map?: {mappings: MagicString|''|null}}>}
         */
        transform(code, file) {

            if (!filter(file) || !options.macroses) return;

            let source = new MagicString(code)
            console.log(this);

            //@ts-ignore
            source.replaceAll(/\/\*\* MACRO `([\w,_ \(\)\="']+)` \*\/([\s\S]+)\/\*\* END_MACRO \*\//g, function (block, names, content) {
                console.log(file);

                names.split(',').map(w => w.trim()).forEach(macro => {
                    if (options.macroses[macro] !== undefined) {
                        content = content.replace(new RegExp(macro.replace(/([\(\)])/g, '\\$1')), options.macroses[macro] ? '(' + options.macroses[macro] + ')' : '')
                    }
                });

                /**
                 * @type {Array<string>}
                 */
                let r = eval(`(() => {${content}})()`);

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
