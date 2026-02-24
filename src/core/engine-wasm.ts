/**
 * WASM 图片引擎
 * 使用 @jsquash 系列库动态加载编解码器，在浏览器端实现高性能图片压缩
 */

export type SupportedFormat = "jpeg" | "png" | "webp" | "avif"

/** 从 MIME 类型推断格式 */
export function mimeToFormat(mime: string): SupportedFormat | null {
    const map: Record<string, SupportedFormat> = {
        "image/jpeg": "jpeg",
        "image/jpg": "jpeg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
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
    quality: number
): Promise<ArrayBuffer> {
    // 归一化 quality 到 0-1（部分编码器使用 0-1 范围）
    const q01 = quality / 100

    switch (format) {
        case "jpeg": {
            const { encode } = await import("@jsquash/jpeg")
            return encode(imageData, { quality })
        }

        case "png": {
            // oxipng：无损 PNG 优化（quality 参数作为优化等级 0-6）
            const { optimise } = await import("@jsquash/oxipng")
            // 先编码为标准 PNG，再用 oxipng 优化
            const { encode: encodePng } = await import("@jsquash/png")
            const pngBuffer = await encodePng(imageData)
            const level = Math.round((1 - q01) * 6) // quality 越低 → 优化等级越高
            return optimise(pngBuffer, { level })
        }

        case "webp": {
            const { encode } = await import("@jsquash/webp")
            return encode(imageData, { quality })
        }

        case "avif": {
            const { encode } = await import("@jsquash/avif")
            // avif quality: cqLevel 0(最高)~63(最低)，需要反转
            const cqLevel = Math.round((1 - q01) * 63)
            return encode(imageData, { cqLevel })
        }

        default:
            throw new Error(`不支持的输出格式: ${format}`)
    }
}
