/**
 * 平台检测工具
 * 判断当前运行在 Tauri 原生环境还是纯 Web 环境
 */

/**
 * 检测是否在 Tauri 环境中运行
 */
export const isTauri = (): boolean =>
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

/**
 * 检测是否在纯 Web 环境中运行
 */
export const isWeb = (): boolean => !isTauri()
