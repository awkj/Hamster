import { compressFile, type CompressOptions } from "./compressor"

self.onmessage = async (e: MessageEvent<{ id: string; file: File; options: CompressOptions }>) => {
    const { id, file, options } = e.data
    try {
        const start = performance.now()
        const blob = await compressFile(file, options.quality, options.format)
        const time = performance.now() - start
        self.postMessage({ id, success: true, blob, time })
    } catch (err) {
        self.postMessage({ id, success: false, error: err instanceof Error ? err.message : String(err) })
    }
}
