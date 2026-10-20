import type { RootContent } from 'mdast'
import { visit } from 'unist-util-visit'

export function toIdentifier(...el: RootContent[]) {
	let identifier = ''
	for (const child of el) {
		visit(child, (node) => {
			if (node.type === 'text' || node.type === 'inlineCode') {
				identifier += node.value
			} else if (node.type === 'image' || node.type === 'imageReference') {
				identifier += node.alt ?? ''
			}
		})
	}
	return identifier.trim()
}
