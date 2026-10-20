import assert from 'node:assert/strict'
import test from 'node:test'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMdc from 'remark-mdc'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkFootnotesExtra from 'remark-footnotes-extra'

const citation =
	"Sky News, Davis, 2022, _Elon Musk Completes $44 Billion Takeover of Twitter and Immediately Sacks Social Media Platform's Top Executives._ skynews.com.au. https://www.skynews.com.au/world-news/elon-musk-completes-44-billion-takeover-of-twitter-and-immediately-sacks-social-media-platforms-top-executives/news-story/9e1e12d0dd24172b18fa574180b1dff7 (accessed: Jan 24, 2024)."

function processor() {
	return unified()
		.use(remarkParse)
		.use(remarkMdc)
		.use(remarkGfm)
		.use(remarkFootnotesExtra, { breakLink: true })
}

for (const escaped of [false, true]) {
	for (const content of ['footnote content', citation]) {
		test(`issue #1 with remark-mdc: ${escaped ? 'escaped' : 'unescaped'} ${content === citation ? 'full citation' : 'plain text'}`, async () => {
			const file = await processor()
				.use(remarkRehype)
				.use(rehypeStringify)
				.process(`before^${escaped ? '\\' : ''}[${content}]after`)
			const html = String(file)
			assert.match(html, /before<sup>/)
			assert.match(html, /<\/sup>after<\/p>/)
			assert.match(html, /data-footnote-ref/)
			assert.match(html, /data-footnote-backref/)
			assert.doesNotMatch(html, /\^/)
			if (content === citation) {
				assert.match(html, /<em>Elon Musk Completes/)
				assert.match(
					html,
					/href="https:\/\/www.skynews.com.au\/world-news\/elon-musk/,
				)
				assert.match(html, /\(accessed: Jan 24, 2024\)\./)
			}
		})
	}
}

test('preserves standalone MDC spans and attributed components', async () => {
	const pipeline = processor()
	const markdown = '[standalone] ^[styled]{.red} :badge[label]'
	const original = pipeline.parse(markdown)
	const tree = await pipeline.run(original)
	assert.equal(
		tree.children.filter((node) => node.type === 'footnoteDefinition').length,
		0,
	)
	assert.equal(
		tree.children[0].children.filter((node) => node.type === 'textComponent')
			.length,
		3,
	)
	assert.equal(tree.children[0].children[2].attributes.class, 'red')
})

test('keeps identical MDC annotations in a shared definition', async () => {
	const pipeline = processor()
	const tree = await pipeline.run(pipeline.parse('^[note]^[note]'))
	assert.equal(
		tree.children.filter((node) => node.type === 'footnoteDefinition').length,
		1,
	)
	assert.deepEqual(
		tree.children[0].children.map((node) => node.type),
		['footnoteReference', 'footnoteReference'],
	)
})
