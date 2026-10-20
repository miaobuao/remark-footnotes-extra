import type { FootnoteReference, Link, PhrasingContent } from 'mdast'

type CreateReference = (children: PhrasingContent[]) => FootnoteReference

interface PendingNote {
	children: PhrasingContent[]
	depth: number
	index: number
	offset: number
}

function appendText(children: PhrasingContent[], value: string) {
	if (!value) return
	const previous = children.at(-1)
	if (previous?.type === 'text') {
		// Never mutate original nodes, including their source positions.
		children[children.length - 1] = {
			type: 'text',
			value: previous.value + value,
		}
	} else {
		children.push({ type: 'text', value })
	}
}

function isLiteralAutolink(node: PhrasingContent): node is Link {
	if (node.type !== 'link' || node.children.length !== 1) return false
	const child = node.children[0]
	return (
		child.type === 'text' &&
		child.value === node.url &&
		// GFM literal autolinks have no positions. Explicit links do.
		!node.position
	)
}

export function transformInlineFootnotes(
	children: PhrasingContent[],
	createReference: CreateReference,
	breakLink: boolean,
): PhrasingContent[] {
	const output: PhrasingContent[] = []
	let pending: PendingNote | undefined
	let changed = false

	function transformChild(node: PhrasingContent): PhrasingContent {
		if (!('children' in node)) return node
		const nested = transformInlineFootnotes(
			node.children,
			createReference,
			breakLink,
		)
		if (nested === node.children) return node
		changed = true
		return { ...node, children: nested }
	}

	function consumeText(value: string, index: number) {
		let offset = 0
		while (offset < value.length) {
			if (!pending) {
				const start = value.indexOf('^[', offset)
				if (start === -1) {
					appendText(output, value.slice(offset))
					return
				}
				appendText(output, value.slice(offset, start))
				pending = { children: [], depth: 0, index, offset: start }
				offset = start + 2
			} else {
				const start = offset
				while (offset < value.length) {
					const character = value[offset]
					if (character === ']' && pending.depth === 0) break
					if (character === '[') pending.depth++
					if (character === ']') pending.depth--
					offset++
				}
				appendText(pending.children, value.slice(start, offset))
				if (offset < value.length) {
					output.push(createReference(pending.children))
					pending = undefined
					changed = true
					offset++
				}
			}
		}
	}

	for (const [index, node] of children.entries()) {
		if (node.type === 'text') {
			consumeText(node.value, index)
		} else if (pending && breakLink && isLiteralAutolink(node)) {
			// GFM can swallow both the closing bracket and the following prose.
			let end = 0
			for (; end < node.url.length; end++) {
				const character = node.url[end]
				if (character === ']' && pending.depth === 0) break
				if (character === '[') pending.depth++
				if (character === ']') pending.depth--
			}
			const url = node.url.slice(0, end)
			pending.children.push(
				end === node.url.length
					? node
					: { ...node, url, children: [{ type: 'text', value: url }] },
			)
			if (end < node.url.length) consumeText(node.url.slice(end), index)
		} else if (pending) {
			pending.children.push(node)
		} else {
			output.push(transformChild(node))
		}
	}

	if (pending) {
		// Restore the original unfinished tail, including any untouched metadata.
		const start = children[pending.index]
		if (start.type === 'text') {
			appendText(output, start.value.slice(pending.offset))
			output.push(...children.slice(pending.index + 1).map(transformChild))
		} else {
			// A second opener may occur in the suffix swallowed by a GFM URL.
			appendText(output, '^[')
			output.push(...pending.children.map(transformChild))
		}
	}

	return changed ? output : children
}
