import { isNil } from 'lodash-es'
import type {
	FootnoteDefinition,
	FootnoteReference,
	Link,
	PhrasingContent,
	Root,
	Text,
} from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { toIdentifier } from './utils/to-identifier'

export interface PluginOptions {
	breakLink?: boolean
}

const remarkFootnotesExtra: Plugin<any[], Root> = function ({
	breakLink = false,
}: PluginOptions = {}) {
	return (root) => {
		const footnoteDefinitionMap: Map<string, boolean> = new Map()

		function createFootnoteDefinitionForTextOrLink(url: string | Link) {
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

		function createFootnoteDefinitionForMixed(collection: PhrasingContent[]) {
			const identifier = toIdentifier(...collection)
			if (!footnoteDefinitionMap.has(identifier)) {
				const definition: FootnoteDefinition = {
					type: 'footnoteDefinition',
					identifier,
					label: identifier,
					children: [
						{
							type: 'paragraph',
							children: collection,
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

		// common case: plain text^[plain text]
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
				const identifier = createFootnoteDefinitionForTextOrLink(
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

		// case: plain text^[plain text: [link](url)]
		visit(root, 'text', (node, idx, parent) => {
			if (isNil(parent) || isNil(idx) || parent.children.length < idx + 2) {
				return
			}
			const texts: Text[] = []
			if (node.value.indexOf('^[') === -1) {
				return
			}
			node.value.split('^[').forEach((text, i) => {
				if (i % 2 == 0) {
					text += '^['
				}
				if (text.length === 0) {
					return
				}
				texts.push({
					type: 'text',
					value: text,
				})
			})
			parent.children.splice(idx, 1, ...texts)
		})

		if (breakLink) {
			/**
			 * fix GFM bug:
			 * issue: https://github.com/remarkjs/remark-gfm/issues/72#issuecomment-2572793322
			 *
			 * case: hi^[https://github.com]test
			 */
			visit(root, 'link', (node, idx, parent) => {
				if (isNil(parent) || isNil(idx) || node.children.length !== 1) {
					return
				}
				if (
					!parent.children
						.slice(0, idx)
						.some((node) => node.type === 'text' && node.value.endsWith('^['))
				) {
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

		// collect footnote content
		visit(root, 'text', (node, idx, parent) => {
			if (
				isNil(parent) ||
				isNil(idx) ||
				!node.value.endsWith('^[') ||
				parent.children.length < idx + 2
			) {
				return
			}

			let endIdx = parent.children
				.slice(idx)
				.findIndex((node) => node.type === 'text' && node.value.startsWith(']'))
			if (endIdx === -1) {
				return
			}
			endIdx += idx
			node.value = node.value.slice(0, node.value.length - 2)
			const end = parent.children[endIdx] as Text
			end.value = end.value.slice(1)

			const footnoteContent = parent.children.slice(
				idx + 1,
				endIdx,
			) as PhrasingContent[]
			const identifier = createFootnoteDefinitionForMixed(footnoteContent)
			parent.children.splice(idx + 1, endIdx - idx - 1, {
				type: 'footnoteReference',
				label: identifier,
				identifier,
			})
		})
	}
}

export default remarkFootnotesExtra
