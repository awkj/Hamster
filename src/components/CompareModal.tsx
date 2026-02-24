/**
 * CompareModal 组件 — HeroUI v3 正确 API
 * 左右滑动对比原图与压缩后图片（类似 Mazanoke）
 */
import { Button, Modal } from "@heroui/react"
import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import type { CompressedFile } from "../hooks/useCompressor"
import { compressionRatio, formatFileSize } from "../hooks/useCompressor"

interface CompareModalProps {
    file: CompressedFile | null
    isOpen: boolean
    onClose: () => void
}

export function CompareModal({ file, isOpen, onClose }: CompareModalProps) {
    const [sliderPos, setSliderPos] = useState(50) // 0-100 百分比
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPos(pct)
    }, [])

    const handleMouseDown = useCallback(() => {
        isDragging.current = true
    }, [])

    const handleMouseMove = useCallback(
        (e: globalThis.MouseEvent) => {
            if (isDragging.current) updateSlider(e.clientX)
        },
        [updateSlider]
    )

    const handleMouseUp = useCallback(() => {
        isDragging.current = false
    }, [])

    const handleTouchMove = useCallback(
        (e: globalThis.TouchEvent) => {
            if (e.touches[0]) updateSlider(e.touches[0].clientX)
        },
        [updateSlider]
    )

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            window.addEventListener("touchmove", handleTouchMove, { passive: true })
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("touchmove", handleTouchMove)
            }
        }
    }, [isOpen, handleMouseMove, handleMouseUp, handleTouchMove])

    // 打开时重置位置
    useEffect(() => {
        if (isOpen) setSliderPos(50)
    }, [isOpen, file?.id])

    const ratio =
        file?.compressedSize
            ? compressionRatio(file.originalSize, file.compressedSize)
            : 0

    return (
        /**
         * HeroUI v3 Modal 受控写法：
         * - isOpen / onOpenChange 放在 Modal.Backdrop 上
         * - Modal 内无需 trigger button（通过外部控制）
         */
        <Modal>
            <Modal.Backdrop
                isOpen={isOpen}
                onOpenChange={(open) => !open && onClose()}
                variant="blur"
            >
                <Modal.Container size="lg">
                    <Modal.Dialog aria-label="图片对比预览">
                        {({ close }: { close: () => void }) => (
                            <>
                                {/* 标题栏 */}
                                <Modal.Header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                    <span className="text-white font-semibold truncate max-w-[55%] text-sm">
                                        {file?.name ?? ""}
                                    </span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-400">
                                            原图{" "}
                                            <span className="text-white font-mono">
                                                {file ? formatFileSize(file.originalSize) : "—"}
                                            </span>
                                        </span>
                                        <span className="text-gray-400">
                                            压缩后{" "}
                                            <span className="text-white font-mono">
                                                {file?.compressedSize
                                                    ? formatFileSize(file.compressedSize)
                                                    : "—"}
                                            </span>
                                        </span>
                                        <span
                                            className={`font-semibold ${ratio > 0 ? "text-emerald-400" : "text-red-400"
                                                }`}
                                        >
                                            {ratio > 0 ? "-" : "+"}
                                            {Math.abs(ratio)}%
                                        </span>
                                    </div>
                                </Modal.Header>

                                {/* 对比区域 */}
                                <Modal.Body className="p-0 overflow-hidden">
                                    {file?.compressedUrl ? (
                                        <div
                                            ref={containerRef}
                                            className="relative w-full overflow-hidden select-none"
                                            style={{ height: "min(60vh, 500px)", cursor: "col-resize" }}
                                            onMouseDown={handleMouseDown}
                                            onTouchStart={(e) => {
                                                if (e.touches[0]) updateSlider(e.touches[0].clientX)
                                            }}
                                        >
                                            {/* 压缩后图片（底层） */}
                                            <img
                                                src={file.compressedUrl}
                                                alt="压缩后"
                                                className="absolute inset-0 w-full h-full object-contain bg-gray-950"
                                                draggable={false}
                                                decoding="async"
                                            />

                                            {/* 原图（左侧裁剪） */}
                                            <div
                                                className="absolute inset-0 overflow-hidden"
                                                style={{ width: `${sliderPos}%` }}
                                            >
                                                <img
                                                    src={file.originalUrl}
                                                    alt="原图"
                                                    className="absolute inset-0 h-full object-contain bg-gray-950"
                                                    style={{
                                                        width: `${(100 / sliderPos) * 100}%`,
                                                        maxWidth: "none",
                                                    }}
                                                    draggable={false}
                                                    decoding="async"
                                                />
                                            </div>

                                            {/* 标签 */}
                                            <div
                                                className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white backdrop-blur-sm pointer-events-none transition-opacity"
                                                style={{ opacity: sliderPos > 15 ? 1 : 0 }}
                                            >
                                                原图
                                            </div>
                                            <div
                                                className="absolute top-3 right-3 px-2 py-1 bg-indigo-500/80 rounded text-xs text-white backdrop-blur-sm pointer-events-none transition-opacity"
                                                style={{ opacity: sliderPos < 85 ? 1 : 0 }}
                                            >
                                                压缩后
                                            </div>

                                            {/* 分割线 */}
                                            <div
                                                className="absolute top-0 bottom-0 w-px bg-white pointer-events-none"
                                                style={{ left: `${sliderPos}%` }}
                                            />

                                            {/* 拖动手柄 */}
                                            <motion.div
                                                className="compare-slider absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10
                          bg-white rounded-full shadow-lg flex items-center justify-center z-10 cursor-col-resize"
                                                style={{ left: `${sliderPos}%` }}
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <svg
                                                    className="w-5 h-5 text-gray-700"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M8 9l-4 3 4 3M16 9l4 3-4 3"
                                                    />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-40 text-gray-500">
                                            暂无预览
                                        </div>
                                    )}
                                </Modal.Body>

                                {/* 底部操作 */}
                                <Modal.Footer className="border-t border-white/10 px-5 py-3">
                                    <Button
                                        variant="ghost"
                                        onPress={() => {
                                            close()
                                            onClose()
                                        }}
                                    >
                                        关闭
                                    </Button>
                                </Modal.Footer>
                            </>
                        )}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
