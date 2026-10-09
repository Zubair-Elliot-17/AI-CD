// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

// Text extraction for uploads, done locally. The PDF and DOCX parsers load only when needed.

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx"];

export class FileError extends Error {}

async function pdfText(data: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : "")).join(""));
  }
  return pages.join("\n\n");
}

async function docxText(data: ArrayBuffer) {
  const mammoth = (await import("mammoth")).default;
  return (await mammoth.extractRawText({ arrayBuffer: data })).value;
}

function decode(data: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data).replace(/^\ufeff/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(data);
  }
}

export async function extractText(file: File): Promise<string> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new FileError("Unsupported file type. Upload a PDF, DOCX, TXT or MD file.");
  }
  const data = await file.arrayBuffer();
  try {
    const text = ext === ".pdf" ? await pdfText(data) : ext === ".docx" ? await docxText(data) : decode(data);
    return text.trim();
  } catch {
    throw new FileError(`Couldn't read ${ext.slice(1).toUpperCase()} file. Is it corrupted?`);
  }
}
