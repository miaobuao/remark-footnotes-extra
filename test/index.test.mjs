import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkFootnotesExtra from 'remark-footnotes-extra'

function transform(markdown, options, gfm = false) {
	const processor = unified().use(remarkParse)
	if (gfm) processor.use(remarkGfm)
	processor.use(remarkFootnotesExtra, options)
	return processor.runSync(processor.parse(markdown))
}

function definitions(tree) {
	return tree.children.filter((node) => node.type === 'footnoteDefinition')
}

function content(definition) {
	return definition.children[0].children
}

function text(nodes) {
	return nodes
		.map((node) =>
			'children' in node ? text(node.children) : (node.value ?? ''),
		)
		.join('')
}

test('converts plain and adjacent inline notes in order', () => {
	const tree = transform('before^[first]^[second]after')
	assert.deepEqual(
		tree.children[0].children.map((node) => node.type),
		['text', 'footnoteReference', 'footnoteReference', 'text'],
	)
	assert.equal(text(tree.children[0].children), 'beforeafter')
	assert.deepEqual(
		definitions(tree).map((node) => text(content(node))),
		['first', 'second'],
	)
})

test('keeps text around formatting and links inside a note', () => {
	const tree = transform(
		'before^[prefix *emphasis* middle [link](https://example.com) suffix]after',
	)
	assert.equal(definitions(tree).length, 1)
	assert.equal(
		text(content(definitions(tree)[0])),
		'prefix emphasis middle link suffix',
	)
	assert.deepEqual(
		content(definitions(tree)[0]).map((node) => node.type),
		['text', 'emphasis', 'text', 'link', 'text'],
	)
	assert.equal(text(tree.children[0].children), 'beforeafter')
})

test('supports long citations with formatting, URLs, and trailing text', () => {
	const citation =
		"Sky News, Davis, 2022, _Elon Musk Completes $44 Billion Takeover of Twitter and Immediately Sacks Social Media Platform's Top Executives._ skynews.com.au. https://www.skynews.com.au/world-news/elon-musk (accessed: Jan 24, 2024)."
	const tree = transform(`citation^[${citation}] end`, {}, true)
	assert.equal(definitions(tree).length, 1)
	assert.equal(
		text(content(definitions(tree)[0])),
		citation.replaceAll('_', ''),
	)
	assert.equal(text(tree.children[0].children), 'citation end')
})

test('balances literal brackets across formatted nodes', () => {
	const tree = transform('^[outer [inner *emphasis*] end] tail')
	assert.equal(
		text(content(definitions(tree)[0])),
		'outer [inner emphasis] end',
	)
	assert.equal(text(tree.children[0].children), ' tail')
})

test('deduplicates equal notes across paragraphs and source positions', () => {
	const tree = transform('a^[same *note*]\n\nb^[same *note*]')
	assert.equal(definitions(tree).length, 1)
	assert.equal(
		tree.children[0].children[1].identifier,
		tree.children[1].children[1].identifier,
	)
})

test('distinguishes links with equal labels and different destinations', () => {
	const tree = transform(
		'^[see [site](https://one.example)] ^[see [site](https://two.example)]',
	)
	assert.equal(definitions(tree).length, 2)
	assert.notEqual(...definitions(tree).map((node) => node.identifier))
	assert.deepEqual(
		definitions(tree).map((node) => content(node)[1].url),
		['https://one.example', 'https://two.example'],
	)
})

test('distinguishes formatting with equal visible text', () => {
	const tree = transform('^[note] ^[*note*] ^[**note**]')
	assert.equal(definitions(tree).length, 3)
	assert.equal(
		new Set(definitions(tree).map((node) => node.identifier)).size,
		3,
	)
})

test('reserves existing footnote identifiers using Markdown normalization', () => {
	const tree = transform(
		'old[^SAME] new^[same] case^[Same]\n\n[^SAME]: original',
		{},
		true,
	)
	assert.equal(definitions(tree).length, 3)
	assert.equal(text(content(definitions(tree)[0])), 'original')
	assert.equal(
		new Set(definitions(tree).map((node) => node.identifier.toLowerCase()))
			.size,
		3,
	)
})

test('reuses an existing definition only when the content matches', () => {
	const tree = transform('a^[same]\n\n[^existing]: same', {}, true)
	assert.equal(definitions(tree).length, 1)
	assert.equal(tree.children[0].children[1].identifier, 'existing')
})

for (const markdown of [
	'ordinary *text* and [link](https://example.com)',
	'unclosed^[note *with formatting*',
	'`^[inline code]`\n\n```md\n^[code block]\n```',
]) {
	test(`leaves non-matching input unchanged: ${markdown}`, () => {
		const original = unified().use(remarkParse).parse(markdown)
		assert.deepEqual(transform(markdown), original)
	})
}

test('keeps an unmatched opener after a completed note', () => {
	const tree = transform('^[complete] tail^[unfinished *note*')
	assert.equal(definitions(tree).length, 1)
	assert.equal(text(tree.children[0].children), ' tail^[unfinished note')
})

test('does not transform generated definitions again', () => {
	const tree = transform('^[outer ^[inner] end]')
	const before = structuredClone(tree)
	unified().use(remarkFootnotesExtra).runSync(tree)
	assert.deepEqual(tree, before)
	assert.equal(text(content(definitions(tree)[0])), 'outer ^[inner] end')
})

test('keeps existing definition content unchanged', () => {
	const tree = transform('a[^old]\n\n[^old]: literal ^[content]', {}, true)
	assert.equal(definitions(tree).length, 1)
	assert.equal(text(content(definitions(tree)[0])), 'literal ^[content]')
})

test('supports notes inside headings, emphasis, lists, blockquotes, and tables', () => {
	const tree = transform(
		'# heading^[one]\n\n*text^[two]*\n\n- item^[three]\n\n> quote^[four]\n\n| column |\n| --- |\n| cell^[five] |',
		{},
		true,
	)
	assert.deepEqual(
		definitions(tree).map((node) => text(content(node))),
		['one', 'two', 'three', 'four', 'five'],
	)
})

test('supports empty notes, code-only notes, and image-only notes', () => {
	const tree = transform('^[] ^[`code`] ^[![alt](image.png)]')
	assert.equal(definitions(tree).length, 3)
	assert.ok(definitions(tree).every((node) => node.identifier.length > 0))
	assert.equal(content(definitions(tree)[1])[0].type, 'inlineCode')
	assert.equal(content(definitions(tree)[2])[0].type, 'image')
})

test('retains the visible-text identifier for a single link', () => {
	const tree = transform('^[[site](https://example.com)]')
	assert.equal(definitions(tree)[0].identifier, 'site')
})

test('breakLink repairs GFM autolinks without losing suffix text', () => {
	const tree = transform(
		'before^[https://example.com]after',
		{ breakLink: true },
		true,
	)
	assert.equal(definitions(tree).length, 1)
	assert.equal(content(definitions(tree)[0])[0].url, 'https://example.com')
	assert.equal(text(tree.children[0].children), 'beforeafter')
})

test('breakLink defaults to false', () => {
	const markdown = 'before^[https://example.com]after'
	const original = unified().use(remarkParse).use(remarkGfm).parse(markdown)
	assert.deepEqual(transform(markdown, {}, true), original)
})

test('breakLink does not truncate explicit links with brackets in the URL', () => {
	const url = 'https://example.com/a]b'
	const label = url.replace(']', '\\]')
	const tree = transform(`^[[${label}](${url})]`, { breakLink: true }, true)
	assert.equal(content(definitions(tree)[0])[0].url, url)
})

test('breakLink applies only within an open note', () => {
	const tree = transform(
		'^[note] https://example.com]tail',
		{ breakLink: true },
		true,
	)
	assert.equal(tree.children[0].children.at(-1).url, 'https://example.com]tail')
})

test('breakLink balances brackets split between a URL and following text', () => {
	const tree = transform(
		'^[https://example.com/a[b]]tail',
		{ breakLink: true },
		true,
	)
	assert.equal(definitions(tree).length, 1)
	assert.equal(text(content(definitions(tree)[0])), 'https://example.com/a[b]')
	assert.equal(text(tree.children[0].children), 'tail')
})

test('does not share definitions between documents using the same processor', () => {
	const processor = unified().use(remarkParse).use(remarkFootnotesExtra)
	for (const markdown of ['a^[note]', 'b^[note]']) {
		assert.equal(
			definitions(processor.runSync(processor.parse(markdown))).length,
			1,
		)
	}
})

test('registers notes in source order across nested formatting', () => {
	const tree = transform('*a^[first]* b^[second]')
	assert.deepEqual(
		definitions(tree).map((node) => text(content(node))),
		['first', 'second'],
	)
})

test('preserves a second unclosed annotation swallowed by a GFM autolink', () => {
	const tree = transform(
		'^[https://example.com]tail^[unfinished',
		{ breakLink: true },
		true,
	)
	assert.equal(definitions(tree).length, 1)
	assert.equal(text(tree.children[0].children), 'tail^[unfinished')
})

test('renders valid HTML through remark-rehype with working backlinks', async () => {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkFootnotesExtra, { breakLink: true })
		.use(remarkRehype)
		.use(rehypeStringify)
		.process('hello^[prefix *note* https://example.com]tail')
	const html = String(file)
	assert.match(html, /data-footnote-ref/)
	assert.match(html, /data-footnote-backref/)
	assert.match(html, /prefix <em>note<\/em> <a href="https:\/\/example.com"/)
	assert.match(html, /<\/sup>tail/)
	assert.doesNotMatch(html, /\^\[/)
})

test('exports a usable CommonJS entry point', () => {
	const require = createRequire(import.meta.url)
	const { default: plugin } = require('remark-footnotes-extra')
	assert.equal(typeof plugin, 'function')
	const processor = unified().use(remarkParse).use(plugin)
	assert.equal(
		definitions(processor.runSync(processor.parse('^[note]'))).length,
		1,
	)
})
