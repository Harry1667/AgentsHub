// 從上傳檔案抽取純文字。
// 文字類直接讀；PDF 用 pdfjs-dist（worker 走 unpkg，版本對齊）。
// 註：REST proxy 不支援圖片 vision，故僅處理可轉文字的檔案。

export const MAX_FILE_CHARS = 60000

const TEXT_EXT = [
  "txt", "md", "markdown", "csv", "tsv", "json", "yaml", "yml", "xml", "html", "htm",
  "js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "h", "go", "rs", "rb", "php",
  "sh", "sql", "css", "scss", "log", "env", "ini", "toml", "conf",
]

export function isSupportedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf" || file.type === "application/pdf") return true
  if (TEXT_EXT.includes(ext)) return true
  return file.type.startsWith("text/")
}

export async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf" || file.type === "application/pdf") return extractPdf(file)
  const t = await file.text()
  return t.slice(0, MAX_FILE_CHARS)
}

async function extractPdf(file: File): Promise<string> {
  // 動態載入，避免進入主 bundle
  const pdfjs = await import("pdfjs-dist")
  // worker 用對齊版本的 unpkg CDN
  ;(pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${(pdfjs as unknown as { version: string }).version}/build/pdf.worker.min.mjs`
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  let out = ""
  for (let i = 1; i <= doc.numPages && out.length < MAX_FILE_CHARS; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n"
  }
  return out.slice(0, MAX_FILE_CHARS)
}
