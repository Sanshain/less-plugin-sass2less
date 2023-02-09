//@ts-check

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import astMacros from "rollup-plugin-ast-macros";


// import { minify } from "terser";
// import { minify } from "uglify-js";

import fs from "fs";
import path from 'path';
import { calculableMacros } from './rollup.plugin.macros.js';

const packagespath = 'lib/replacements'
let filenames = fs.readdirSync(path.join(process.cwd(), packagespath))
console.log(filenames);



// import typescript from '@rollup/plugin-typescript';







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
        calculableMacros({
            prettify: true,
            comments: false,
            externalPackages: {path, fs},            
            macroses: {
                'fs.readdirSync': (function (_path) {
                    //@ts-ignore
                    let dir = path.dirname(path.relative(process.cwd(), file))
                    let filenames = fs.readdirSync(dir + _path)
                    
                    return '[' + filenames.map(w => "'" + w + "'").toString() + ']'
                }).toString(),
                '__dirname +': '',  // `${path.dirname(path.relative(process.cwd(), file))}`
            }
        }),
        resolve({
            browser: true
        }),
        commonjs({
            // ignoreDynamicRequires: true

            dynamicRequireTargets: [`${packagespath}/*.js`],
            // dynamicRequireTargets: filenames,
            // dynamicRequireRoot: path.join(process.cwd(), packagespath)
        }),
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