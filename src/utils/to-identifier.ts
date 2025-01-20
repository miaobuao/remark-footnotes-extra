import type { RootContent } from 'mdast'
import { visit } from 'unist-util-visit'

export function toIdentifier(...el: RootContent[]) {
	let identifier = ''
	for (const child of el) {
		visit(child, 'text', (node) => {
			identifier += node.value
		})
	}
	return identifier
}
