import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkFootnotesExtra, { PluginOptions } from '../../../src'

export async function md2html(
	md: string,
	{
		gfm = true,
		...others
	}: {
		gfm?: boolean
	} & PluginOptions = {},
) {
	const processor = gfm
		? unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkFootnotesExtra, others)
				.use(remarkRehype, { allowDangerousHtml: true })
				.use(rehypeStringify)
		: unified()
				.use(remarkParse)
				.use(remarkFootnotesExtra, others)
				.use(remarkRehype, { allowDangerousHtml: true })
				.use(rehypeStringify)
	const vfile = await processor.process(md)
	return vfile.toString()
}
