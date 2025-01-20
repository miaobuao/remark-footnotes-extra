import { isNil } from 'lodash-es'
import type {
	FootnoteDefinition,
	FootnoteReference,
	Link,
	Root,
	Text,
} from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

export interface PluginOptions {
	breakLink?: boolean
}

const remarkFootnotesExtra: Plugin<any[], Root> = function ({
	breakLink = false,
}: PluginOptions = {}) {
	return (root) => {
		const footnoteDefinitionMap: Map<string, boolean> = new Map()

		function createFootnoteDefinition(url: string | Link) {
			if (typeof url === 'string') {
				var annotation: Text | Link = {
					type: 'text',
					value: url,
				}
			} else {
				annotation = url
			}
			const identifier =
				annotation.type === 'link' ? annotation.url : annotation.value
			if (!footnoteDefinitionMap.has(identifier)) {
				const definition: FootnoteDefinition = {
					type: 'footnoteDefinition',
					identifier,
					label: identifier,
					children: [
						{
							type: 'paragraph',
							children: [annotation],
						},
					],
				}
				footnoteDefinitionMap.set(identifier, true)
				root.children.push(definition)
			}
			return identifier
		}

		visit(root, 'footnoteDefinition', (node) => {
			footnoteDefinitionMap.set(node.identifier, true)
		})

		if (breakLink) {
			visit(root, 'link', (node, idx, parent) => {
				if (isNil(parent) || isNil(idx) || node.children.length !== 1) {
					return
				}
				const linkText = node.children.at(0)!
				if (linkText.type !== 'text' || node.url !== linkText.value) {
					return
				}
				const breakIdx = node.url.indexOf(']')
				if (breakIdx === -1) {
					return
				}
				const url = node.url.slice(0, breakIdx)
				const tailText = node.url.slice(breakIdx)
				node.url = url
				linkText.value = url
				const tailTextNode: Text = {
					type: 'text',
					value: tailText,
				}
				parent.children.splice(idx + 1, 0, tailTextNode)
			})
		}

		visit(root, 'text', (node, idx, parent) => {
			if (isNil(parent) || isNil(idx)) {
				return
			}
			const link = parent.children.at(idx + 1)
			const tailNode = parent.children.at(idx + 2)
			if (
				!node.value.endsWith('^[') ||
				link?.type !== 'link' ||
				tailNode?.type !== 'text' ||
				!tailNode.value.startsWith(']')
			) {
				return
			}
			const identifier = createFootnoteDefinition(link)
			// replace text
			node.value = node.value.slice(0, node.value.length - 2)
			tailNode.value = tailNode.value.slice(1)
			if (tailNode.value.length === 0) {
				parent.children.splice(idx + 2, 1)
			}
			parent.children[idx + 1] = {
				type: 'footnoteReference',
				label: identifier,
				identifier,
			}
		})

		visit(root, 'text', (node, idx, parent) => {
			const reg = /\^\[[^\]]*\]/g
			const matches = node.value.matchAll(reg)
			const paragraph: Array<FootnoteReference | Text> = []
			let offset = 0
			for (const match of matches) {
				const matchStr = match[0]
				const preText = node.value.slice(offset, match.index)
				offset = match.index + matchStr.length
				paragraph.push({
					type: 'text',
					value: preText,
				})
				const identifier = createFootnoteDefinition(
					matchStr.slice(2).slice(0, matchStr.length - 3),
				)
				paragraph.push({
					type: 'footnoteReference',
					label: identifier,
					identifier,
				})
			}
			if (offset < node.value.length) {
				paragraph.push({
					type: 'text',
					value: node.value.slice(offset),
				})
			}
			if (isNil(parent) || isNil(idx)) {
				return
			}
			parent.children.splice(idx, 1, ...paragraph)
		})
	}
}

export default remarkFootnotesExtra
