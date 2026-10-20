import type { Root } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'
import { createFootnoteRegistry } from './utils/footnote-registry'
import { transformInlineFootnotes } from './utils/inline-footnotes'

export interface PluginOptions {
	/** Split closing footnote brackets swallowed by GFM literal autolinks. */
	breakLink?: boolean
}

const remarkFootnotesExtra = function ({
	breakLink = false,
}: PluginOptions = {}) {
	return (root: Root) => {
		const registry = createFootnoteRegistry(root)

		visit(root, (node) => {
			// Definitions are terminal: do not create nested notes on a later run.
			if (node.type === 'footnoteDefinition') return SKIP
			if (
				node.type === 'paragraph' ||
				node.type === 'heading' ||
				node.type === 'tableCell'
			) {
				node.children = transformInlineFootnotes(
					node.children,
					registry.reference,
					breakLink,
				)
				return SKIP
			}
		})

		// Append only after traversal, so generated content is never revisited.
		root.children.push(...registry.definitions)
	}
}

export default remarkFootnotesExtra
