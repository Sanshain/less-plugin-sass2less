import { default as LessCompiler } from "./index";

const transform = (new LessCompiler).process;


/**
 * @description selector style
 * @param {string} selector 
 */
function compile(selector) {

    const styleJug = document.querySelector(selector || 'style');
    let lessContent = null

    if (!styleJug) console.warn('passed incorrect selector: ' + selector);
    else if (styleJug.tagName.toLowerCase() === 'link') fetch(styleJug.href).then(sassToLess)
    else if (styleJug.tagName.toLowerCase() === 'style') sassToLess(styleJug.textContent)
    else {
        console.warn('Unexpected style jug tag. Needfull `style` or `link`. Got: ' + styleJug.tagName);
    }
    

    /**
     * @description Transform sass to less and upload less, which auto compile the less to css
     * @param {string} value 
     */
    function sassToLess(value) {
        lessContent = transform(value, {}) || '';
        createLink(lessContent).then(uploadLessCompiler);
    }
}

/**
 * 
 * @param {string} lessContent 
 */
function createLink(lessContent) {

    let blob = new Blob([lessContent], { type: 'text/css' });
    const link = URL.createObjectURL(blob);

    const baseTag = 'link';
    const attributes = ' rel="stylesheet/less" type="text/css" href="{}" '.replace(/(href|src)\="[\:\w\d-\{\}/\.]+"/, '$1="' + link + '"');
    let elemHTML = ('<___ ' + attributes + ' />').replace(/\<___/g, '<' + baseTag);

    document.head.insertAdjacentHTML('beforeend', elemHTML);

    return {then: (func) => func()}
}


/**
 * 
 * @param {string?} modeSrc 
 */
function uploadLessCompiler(modeSrc) {

    let script = document.createElement('script');
    script.src = modeSrc || (document.location.origin + '/static/js/preproc/less.js')
    document.head.appendChild(script);
}


compile()