/**
 * WASM 图片引擎
 * 使用 @jsquash 系列库动态加载编解码器，在浏览器端实现高性能图片压缩
 */

export type SupportedFormat = "jpeg" | "png" | "webp" | "avif" | "jxl" | "heic"

/** 从 MIME 类型推断格式 */
export function mimeToFormat(mime: string): SupportedFormat | null {
    const map: Record<string, SupportedFormat> = {
        "image/jpeg": "jpeg",
        "image/jpg": "jpeg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
        "image/jxl": "jxl",
        "image/heic": "heic",
        "image/heif": "heic",
    }
    return map[mime.toLowerCase()] ?? null
}

/** 获取格式对应的 MIME 类型 */
export function formatToMime(format: SupportedFormat): string {
    const map: Record<SupportedFormat, string> = {
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        avif: "image/avif",
        jxl: "image/jxl",
        heic: "image/heic",
    }
    return map[format]
}

/**
 * 将 File 解码为 ImageData（原始像素数据）
 * 动态按需加载对应格式的解码器
 */
export async function decodeImage(file: File): Promise<ImageData> {
    const buffer = await file.arrayBuffer()
    const mime = file.type.toLowerCase()

    if (mime === "image/jpeg" || mime === "image/jpg") {
        const { decode } = await import("@jsquash/jpeg")
        return decode(buffer)
    }

    if (mime === "image/png") {
        const { decode } = await import("@jsquash/png")
        return decode(buffer)
    }

    if (mime === "image/webp") {
        const { decode } = await import("@jsquash/webp")
        return decode(buffer)
    }

    if (mime === "image/avif") {
        const { decode } = await import("@jsquash/avif")
        const result = await decode(buffer)
        if (!result) throw new Error("AVIF decode failed")
        return result as ImageData
    }

    if (mime === "image/jxl") {
        const { decode } = await import("@jsquash/jxl")
        return decode(buffer)
    }

    if (mime === "image/heic" || mime === "image/heif") {
        // @ts-ignore jsquash heif 暂无官方 type 定义
        const { decode } = await import("@jsquash/heif")
        return decode(buffer)
    }

    // 回退：使用 Canvas 解码其他格式
    return decodeWithCanvas(file)
}

/** 使用 Canvas 作为 fallback 解码图片 */
async function decodeWithCanvas(file: File): Promise<ImageData> {
    const bitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
    ctx.drawImage(bitmap, 0, 0)
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
}

/**
 * 将 ImageData 编码为目标格式的 ArrayBuffer
 * @param imageData   原始像素数据
 * @param format      目标格式
 * @param quality     质量 0-100（PNG/AVIF 的无损模式下忽略此参数）
 */
export async function encodeImage(
    imageData: ImageData,
    format: SupportedFormat,
    quality: number,
    lossless: boolean = false
): Promise<ArrayBuffer> {
    switch (format) {
        case "jpeg": {
            const { encode } = await import("@jsquash/jpeg")
            return encode(imageData, { quality })
        }

        case "png": {
            // oxipng：无损 PNG 优化（直接固定 Level 2，忽略画质参数）
            const { optimise } = await import("@jsquash/oxipng")
            const { encode: encodePng } = await import("@jsquash/png")
            const pngBuffer = await encodePng(imageData)
            return optimise(pngBuffer, { level: 2 })
        }

        case "webp": {
            const { encode } = await import("@jsquash/webp")
            if (lossless) {
                // @ts-ignore jsquash webp supports lossless flag internally
                return encode(imageData, { lossless: true })
            }
            // 抽象质量映射 WebP: 90->85, 80->75, 60->50
            const q = quality >= 90 ? 85 : quality >= 80 ? 75 : 50
            return encode(imageData, { quality: q })
        }

        case "avif": {
            const { encode } = await import("@jsquash/avif")
            if (lossless) {
                // @ts-ignore jsquash avif supports lossless via cqLevel:0 or lossless:true internally
                return encode(imageData, { lossless: true })
            }
            // 抽象质量映射 AVIF: 90->80, 80->65, 60->45
            const q = quality >= 90 ? 80 : quality >= 80 ? 65 : 45
            return encode(imageData, { quality: q })
        }

        case "jxl": {
            // 修复 JXL 多线程及内存溢出崩溃问题：
            // 1. 强制使用单线程版 jxl_enc.js（稳定、内存可扩展），避开 jSquash 自带的多线程 SIMD 检测崩溃卡死
            // 2. 将 ImageData 显式转化为 Uint8Array 规避 Embind 在转换 ClampedArray 时的指针越界错误 (`table index is out of bounds`)
            const { default: jxlEncoderFactory } = await import("@jsquash/jxl/codec/enc/jxl_enc.js")
            const wasmUrl = (await import("@jsquash/jxl/codec/enc/jxl_enc.wasm?url")).default

            const module = await jxlEncoderFactory({
                locateFile: () => wasmUrl
            })

            const jxlImageData = {
                width: imageData.width,
                height: imageData.height,
                data: new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.length)
            }

            // 动态调节 JXL 压缩力度 (effort) 以防止大图 OOM (Out of Memory)
            // JXL effort 默认为 7 (Tortoise)，内存消耗极大，尺寸稍大便会撑爆 WASM 256MB 堆内存
            // 策略：基于总像素数动态降级，保压缩成功率
            const totalPixels = imageData.width * imageData.height
            let dynamicEffort = 7
            if (totalPixels > 5000000) {
                // 大于 500 万像素 (如 >2500x2000)，降级到 3 (Falcon: 极快，最省内存)
                dynamicEffort = 3
            } else if (totalPixels > 2000000) {
                // 大于 200 万像素 (如 1920x1080 附近)，降级到 4 (Cheetah)
                dynamicEffort = 4
            } else if (totalPixels > 1000000) {
                dynamicEffort = 5 // 大于 100 万像素
            }

            // jSquash JXL 默认参数集 (meta.js)
            const defaultOptions = {
                // JXL 的 effort (或 speed) 参数决定了它花多大力气去压缩。默认值通常是 7 (主要用于压榨体积)，但这极费内存。
                // 3 = Falcon (快，内存少)
                // 4 = Cheetah (较快)
                // 7 = Tortoise (慢，内存极大)
                effort: dynamicEffort,
                quality: lossless ? 100 : (quality >= 90 ? 90 : quality >= 80 ? 75 : 50),
                progressive: false,
                epf: -1,
                lossyPalette: false, // 绝对不能开，开启后会强制使用 Modular 编码器进行有损压缩，对照片会导致体积暴增 200%+
                decodingSpeedTier: 0,
                photonNoiseIso: 0,
                lossyModular: false, // 绝对不能开
            }

            // 通过 Emscripten 暴露的 encode 函数进行压缩
            const resultView = module.encode(
                jxlImageData.data,
                jxlImageData.width,
                jxlImageData.height,
                { ...defaultOptions, quality }
            )

            if (!resultView) throw new Error("JXL Encode failed inside WASM (returned null)")

            // resultView 是在 WASM 内存空间 (Heap) 上的一段引用，它的 .buffer 等于整个 WASM Heap 的大小（可能高达百兆级别）
            // 我们必须将其复制为极其干净的 Uint8Array 后再提交，防止导致 JS 内存泄漏或生成极大的 Blob 文件
            const resultData = new Uint8Array(resultView)

            // 提示垃圾回收机制尽快清理 WASM 的引用
            module.free?.()

            return resultData.buffer
        }

        case "heic": {
            // jSquash 的 heif 模块目前主要用于解码。如果强行要求编码为 heic，由于大部分场景是转换，我们强制将其回退转换为 JPEG。
            const { encode } = await import("@jsquash/jpeg")
            return encode(imageData, { quality: quality >= 90 ? 90 : quality >= 80 ? 80 : 60 })
        }

        default:
            throw new Error(`不支持的编码格式: ${format}`)
    }
}
