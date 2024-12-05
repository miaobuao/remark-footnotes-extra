import remarkFootnotesExtra from "remark-footnotes-extra";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { readFileSync, writeFileSync } from "node:fs";
import path from "path";

const examplePath = "./sample/example.md";
const outputPath = "./sample/";

async function withGfm() {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkFootnotesExtra)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify);

	const value = readFileSync(examplePath, "utf-8");
	const file = await processor.process(value);
	writeFileSync(path.join(outputPath, "gfm.html"), String(file));
}

async function noGfm() {
	const processor = unified()
		.use(remarkParse)
		.use(remarkFootnotesExtra)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify);

	const value = readFileSync(examplePath, "utf-8");
	const file = await processor.process(value);
	writeFileSync(path.join(outputPath, "no-gfm.html"), String(file));
}

await withGfm();
await noGfm();
