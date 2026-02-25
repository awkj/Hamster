/**
 * SettingsBar 组件 — HeroUI v3 正确 API
 * 设置底部配置栏，精简质量选项，修复保持原格式。
 */
import { Button } from "@heroui/react"
import type { SupportedFormat } from "../core/compressor"
import type { CompressorSettings } from "../hooks/useCompressor"

interface SettingsBarProps {
    settings: CompressorSettings
    onChange: (s: CompressorSettings) => void
    showThumbnails: boolean
    onToggleThumbnails: () => void
    fileCount: number
    doneCount: number
    isCompressing: boolean
    onDownloadAll: () => void
    onClearAll: () => void
}

// 输出格式选项 (不包含 heic，因为浏览器通常不用于编码 heic)
const TARGET_FORMATS: { label: string; value: SupportedFormat }[] = [
    { label: "JPEG", value: "jpeg" },
    { label: "PNG", value: "png" },
    { label: "WebP", value: "webp" },
    { label: "AVIF", value: "avif" },
    { label: "JXL", value: "jxl" },
]

const QUALITY_OPTIONS = [
    { value: 90, label: "高质量 (90)" },
    { value: 80, label: "平衡 (80)" },
    { value: 60, label: "高压缩比 (60)" },
]

export function SettingsBar({
    settings,
    onChange,
    showThumbnails,
    onToggleThumbnails,
    fileCount,
    doneCount,
    isCompressing,
    onDownloadAll,
    onClearAll,
}: SettingsBarProps) {
    const currentFormat = settings.format ?? "auto"

    // 如果当前格式是 HEIC，则默认切换到 JPEG 进行设置面版的渲染 (HEIC 输出强制转 JPEG)
    const effectiveFormat = currentFormat === "heic" ? "jpeg" : currentFormat

    return (
        <div className="glass mx-4 px-6 py-4 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">

            <div className="flex gap-6 lg:gap-10 flex-wrap items-end w-full lg:w-auto">
                {/* 格式选择 */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">输出格式</span>

                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        {/* 保持原格式 */}
                        <button
                            disabled={isCompressing}
                            onClick={() => onChange({ ...settings, format: undefined })}
                            className={`px-3 py-1 text-sm rounded-full border ${effectiveFormat === "auto"
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-300 font-medium"
                                : "bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                                } ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            保持原格式
                        </button>

                        {/* 分割线 */}
                        <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1" />

                        {/* 具体格式 */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-full">
                            {TARGET_FORMATS.map((opt) => {
                                const isSelected = effectiveFormat === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        disabled={isCompressing}
                                        onClick={() => onChange({ ...settings, format: opt.value as SupportedFormat })}
                                        className={`px-3 py-1 text-sm rounded-full ${isSelected
                                            ? "bg-white text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600 font-medium"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            } ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 分割线 (移动端隐藏) */}
                <div className="hidden lg:block w-px h-10 self-end bg-slate-200 dark:bg-white/10" />

                {/* 压缩设置 (无损 & 质量) */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {effectiveFormat === "png" ? "压缩设置 (PNG 强制无损)" : effectiveFormat === "jpeg" ? "压缩设置 (JPEG 不支持无损)" : "压缩设置"}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 min-h-[32px]">
                        {/* 无损模式开关 */}
                        <label
                            className={`flex items-center gap-1.5 text-sm select-none ${isCompressing || effectiveFormat === "png" || effectiveFormat === "jpeg"
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                                }`}
                            title={effectiveFormat === "png" ? "PNG 为纯无损格式" : effectiveFormat === "jpeg" ? "此格式不支持无损编码" : ""}
                        >
                            <input
                                type="checkbox"
                                checked={effectiveFormat === "png" ? true : effectiveFormat === "jpeg" ? false : settings.lossless}
                                disabled={isCompressing || effectiveFormat === "png" || effectiveFormat === "jpeg"}
                                onChange={(e) => onChange({ ...settings, lossless: e.target.checked })}
                                className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-white/5 disabled:opacity-50"
                            />
                            <span className="text-slate-700 dark:text-slate-200 font-medium">无损模式</span>
                        </label>

                        {/* 质量选择器 (仅在有损模式下显示) */}
                        {!(currentFormat === "png" || (currentFormat !== "jpeg" && settings.lossless)) && (
                            <>
                                <div className="w-px h-4 bg-slate-300 dark:bg-white/10" />
                                <div className="flex flex-wrap bg-slate-200/50 dark:bg-white/5 p-1 rounded-lg">
                                    {QUALITY_OPTIONS.map((opt) => {
                                        const isActive = settings.quality === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                disabled={isCompressing}
                                                onClick={() => onChange({ ...settings, quality: opt.value })}
                                                className={`px-3 py-1 rounded-md text-sm font-medium ${isActive
                                                    ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
                                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                                    } ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 分割线 (移动端隐藏) */}
                <div className="hidden lg:block w-px h-10 self-end bg-slate-200 dark:bg-white/10" />

                {/* 显示缩略图 */}
                <div className="flex flex-col justify-end pb-1.5 h-full">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showThumbnails}
                            onChange={onToggleThumbnails}
                            className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-white/5"
                        />
                        显示缩略图
                    </label>
                </div>
            </div>

            {/* 操作按钮组 (在小屏幕下允许换行并居左) */}
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 pb-0.5 mt-2 lg:mt-0 lg:ml-auto">
                {doneCount > 0 && (
                    <Button
                        size="sm"
                        variant="primary"
                        onPress={onDownloadAll}
                        className="shadow-sm font-medium bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        全部下载 ({doneCount})
                    </Button>
                )}
                {fileCount > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onPress={onClearAll}
                        className="font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        清空列表
                    </Button>
                )}
            </div>
        </div>
    )
}
