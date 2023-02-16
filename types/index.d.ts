export = sassToLess;
declare class sassToLess {
    process: (src: string, extra: {
        fileInfo?: {
            filename: string
        }}) => string
}
