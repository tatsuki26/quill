/**
 * レシート検出用の画像解析ユーティリティ
 * カメラフレームがレシートを十分に含んでいるか判定する
 */

const SAMPLE_STEP = 4 // ピクセルサンプリング間隔

/**
 * 画像の輝度を計算（0-255）
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * フレームを解析し、レシートが十分に画面に入っているか判定
 * @returns 0-1のスコア（1に近いほどレシートが適切に映っている）
 */
export function analyzeFrameForReceipt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { score: number; luminance: number; contrast: number; edgeDensity: number } {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let sumLuminance = 0
  let sumSqLuminance = 0
  let pixelCount = 0
  const luminances: number[] = []

  // サンプリングして輝度を計算
  for (let y = 0; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = getLuminance(r, g, b)
      luminances.push(lum)
      sumLuminance += lum
      sumSqLuminance += lum * lum
      pixelCount++
    }
  }

  const avgLuminance = sumLuminance / pixelCount
  const variance = sumSqLuminance / pixelCount - avgLuminance * avgLuminance
  const contrast = Math.sqrt(Math.max(0, variance))

  // エッジ密度: 隣接ピクセル間の輝度差が大きい箇所の割合
  let edgeCount = 0
  const edgeThreshold = 25
  for (let i = 0; i < luminances.length; i++) {
    const x = i % Math.ceil(width / SAMPLE_STEP)
    const y = Math.floor(i / Math.ceil(width / SAMPLE_STEP))
    const right = x + 1 < Math.ceil(width / SAMPLE_STEP) ? luminances[i + 1] : luminances[i]
    const bottom = y + 1 < Math.ceil(height / SAMPLE_STEP)
      ? luminances[i + Math.ceil(width / SAMPLE_STEP)]
      : luminances[i]
    if (Math.abs(luminances[i] - right) > edgeThreshold || Math.abs(luminances[i] - bottom) > edgeThreshold) {
      edgeCount++
    }
  }
  const edgeDensity = edgeCount / luminances.length

  // レシートの条件（厳格化: 安定しているだけでは不十分、文書らしい特徴が必要）
  // - 輝度が適切（暗すぎず明るすぎず: 50-230）
  // - コントラストが十分（テキストがある: 最低25以上）
  // - エッジ密度が十分（レシートは文字が多い: 最低0.12以上）
  const luminanceOk = avgLuminance >= 50 && avgLuminance <= 230
  const contrastOk = contrast >= 25
  const edgeOk = edgeDensity >= 0.12

  // 全ての条件を満たす場合のみスコア1、そうでなければ0
  // 壁や机など単色の安定した画面では contrast/edge が低く、検出されない
  const score = luminanceOk && contrastOk && edgeOk
    ? 0.5 + Math.min(0.5, contrast / 80) * 0.5 + Math.min(0.5, edgeDensity / 0.25) * 0.5
    : 0

  return {
    score,
    luminance: avgLuminance,
    contrast,
    edgeDensity,
  }
}

/**
 * 2つのフレームの類似度を計算（安定性判定用）
 * @returns 0-1（1に近いほど似ている＝安定）
 */
export function compareFrames(
  data1: Uint8ClampedArray,
  data2: Uint8ClampedArray,
  sampleStep: number = 8
): number {
  let diffSum = 0
  let count = 0
  for (let i = 0; i < data1.length; i += sampleStep * 4) {
    const lum1 = getLuminance(data1[i], data1[i + 1], data1[i + 2])
    const lum2 = getLuminance(data2[i], data2[i + 1], data2[i + 2])
    diffSum += Math.abs(lum1 - lum2)
    count++
  }
  const avgDiff = count > 0 ? diffSum / count : 255
  // 差が小さいほど類似度が高い（0-255の差を0-1の類似度に変換）
  return Math.max(0, 1 - avgDiff / 30)
}
