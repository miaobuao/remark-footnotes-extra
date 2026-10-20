import type {
	FootnoteDefinition,
	FootnoteReference,
	PhrasingContent,
	Root,
} from 'mdast'
import { visit } from 'unist-util-visit'
import { toIdentifier } from './to-identifier'

function normalizeIdentifier(identifier: string) {
	return identifier
		.replace(/[\t\n\r ]+/g, ' ')
		.trim()
		.toUpperCase()
		.toLowerCase()
}

// Positions vary between occurrences; URLs, formatting, and data are meaningful.
function contentKey(value: unknown): string {
	return JSON.stringify(value, (key, item) => {
		if (key === 'position') return undefined
		if (item && typeof item === 'object' && !Array.isArray(item)) {
			return Object.fromEntries(
				Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
			)
		}
		return item
	})
}

export function createFootnoteRegistry(root: Root) {
	const identifiers = new Set<string>()
	const contents = new Map<string, string>()
	const definitions: FootnoteDefinition[] = []

	visit(root, 'footnoteDefinition', (node) => {
		const normalized = normalizeIdentifier(node.identifier)
		// Markdown resolves duplicate identifiers to the first definition.
		if (!identifiers.has(normalized)) {
			contents.set(contentKey(node.children), node.identifier)
		}
		identifiers.add(normalized)
	})

	function reference(children: PhrasingContent[]): FootnoteReference {
		const blocks = [{ type: 'paragraph' as const, children }]
		const key = contentKey(blocks)
		let identifier = contents.get(key)
		if (identifier === undefined) {
			const base = toIdentifier(...children) || 'footnote'
			identifier = base
			let suffix = 2
			while (identifiers.has(normalizeIdentifier(identifier))) {
				identifier = `${base}-${suffix++}`
			}
			identifiers.add(normalizeIdentifier(identifier))
			contents.set(key, identifier)
			definitions.push({
				type: 'footnoteDefinition',
				identifier,
				label: identifier,
				children: blocks,
			})
		}
		return { type: 'footnoteReference', identifier, label: identifier }
	}

	return { definitions, reference }
}
