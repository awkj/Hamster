// src/types/jsquash.d.ts

declare module "libheif-js/wasm-bundle" {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const libheif: any
    export default libheif
}

declare module "@jsquash/webp" {
    export interface EncodeOptions {
        quality?: number
        lossless?: boolean
        method?: number
        exact?: boolean
    }
    export function encode(data: ImageData, options?: EncodeOptions): Promise<ArrayBuffer>
    export function decode(data: ArrayBuffer): Promise<ImageData>
}

declare module "@jsquash/avif" {
    export interface EncodeOptions {
        quality?: number
        cqLevel?: number
        lossless?: boolean
        speed?: number
        subsample?: number
        cqAlphaLevel?: number
    }
    export function encode(data: ImageData, options?: EncodeOptions): Promise<ArrayBuffer>
    export function decode(data: ArrayBuffer): Promise<ImageData>
}
