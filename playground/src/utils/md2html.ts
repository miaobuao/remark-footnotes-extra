import remarkFootnotesExtra from "../../../src";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export async function md2html(
	md: string,
	{
		gfm = true,
	}: {
		gfm?: boolean;
	} = {},
) {
	const processor = gfm
		? unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkFootnotesExtra)
				.use(remarkRehype, { allowDangerousHtml: true })
				.use(rehypeStringify)
		: unified()
				.use(remarkParse)
				.use(remarkFootnotesExtra)
				.use(remarkRehype, { allowDangerousHtml: true })
				.use(rehypeStringify);
	const vfile = await processor.process(md);
	return vfile.toString();
}
