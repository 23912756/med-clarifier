# PDF Batch Samples

This utility generates **10 demo PDFs** with different diseases, patient names, and medication plans.
For each file, it first calls AI text generation and then creates the PDF.

## 1) Start the app

Run your project first:

```bash
npm run dev
```

Make sure your `.env` includes a valid `OPENAI_API_KEY`, because this script uses:

- `POST /api/ai/patient-text`
- `POST /api/pdf`

## 2) Generate the 10 PDFs

In another terminal:

```bash
node tests/pdf-batch/generate-sample-pdfs.mjs
```

Generated files are saved in:

`tests/pdf-batch/output/`

## 3) Merge all PDFs into one print-ready file

```bash
node tests/pdf-batch/merge-sample-pdfs.mjs
```

This creates:

`tests/pdf-batch/output/00-ALL-TEST-PDFS-PRINT-READY.pdf`

### Optional: add one blank page between each PDF

Useful for some duplex printing setups:

```bash
BLANK_PAGE_BETWEEN=1 node tests/pdf-batch/merge-sample-pdfs.mjs
```

## Optional: custom API URL

If your app is not on `http://localhost:3000`, set:

```bash
PDF_API_BASE_URL=http://YOUR_HOST:PORT node tests/pdf-batch/generate-sample-pdfs.mjs
```
