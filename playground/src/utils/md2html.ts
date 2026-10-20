import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkFootnotesExtra, { type PluginOptions } from '../../../src'

export async function md2html(
	md: string,
	{
		gfm = true,
		...others
	}: {
		gfm?: boolean
	} & PluginOptions = {},
) {
	const processor = unified().use(remarkParse)
	if (gfm) processor.use(remarkGfm)
	processor
		.use(remarkFootnotesExtra, others)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify)
	const vfile = await processor.process(md)
	return vfile.toString()
}
