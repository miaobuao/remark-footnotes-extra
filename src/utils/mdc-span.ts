import type { PhrasingContent } from 'mdast'

// MDC extends mdast at runtime. Use its structural shape without requiring it
// as a dependency or adding component nodes to every consumer's mdast types.
export function mdcSpanChildren(node: {
	type: string
	name?: string
	attributes?: Record<string, unknown>
	children?: PhrasingContent[]
}): PhrasingContent[] | undefined {
	if (
		node.type === 'textComponent' &&
		node.name === 'span' &&
		Object.keys(node.attributes ?? {}).length === 0
	) {
		return node.children
	}
}
