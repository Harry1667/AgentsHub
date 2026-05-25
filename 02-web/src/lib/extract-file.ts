// 上傳檔案處理。
// 文字類 → 抽純文字併入 prompt；圖片 → base64 走 proxy 多模態(vision)。
// 素材文字檔用 FileReader.text；PDF 用 pdfjs-dist；圖片轉 base64。

export const MAX_FILE_CHARS = 60000

const TEXT_EXT = [
  "txt", "md", "markdown", "csv", "tsv", "json", "yaml", "yml", "xml", "html", "htm",
  "js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "h", "go", "rs", "rb", "php",
  "sh", "sql", "css", "scss", "log", "env", "ini", "toml", "conf",
]
const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif"]

export type FileKind = "image" | "text" | "unsupported"

export function fileKind(file: File): FileKind {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf" || file.type === "application/pdf") return "text"
  if (IMAGE_EXT.includes(ext) || file.type.startsWith("image/")) return "image"
  if (TEXT_EXT.includes(ext) || file.type.startsWith("text/")) return "text"
  return "unsupported"
}

export async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf" || file.type === "application/pdf") return extractPdf(file)
  const t = await file.text()
  return t.slice(0, MAX_FILE_CHARS)
}

// 圖片 → { mime_type, data(純 base64) }，符合 proxy 多模態格式
export async function readImage(file: File): Promise<{ mime: string; data: string }> {
  const buf = await file.arrayBuffer()
  let binary = ""
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return { mime: file.type || "image/png", data: btoa(binary) }
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist")
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
