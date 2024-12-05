import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type {
	FootnoteDefinition,
	FootnoteReference,
	Text,
	Root,
	Link,
} from "mdast";
import { isNil } from "./utils/is-nil";

const remarkFootnotesExtra: Plugin<any[], Root> = function () {
	return (root) => {
		const footnoteDefinitionMap: Map<string, boolean> = new Map();
		function createFootnoteDefinition(url: string | Link) {
			if (typeof url === "string") {
				var link: Link = {
					type: "link",
					url: url,
					children: [
						{
							type: "text",
							value: url,
						},
					],
				};
			} else {
				link = url;
			}
			const identifier = link.url;
			if (!footnoteDefinitionMap.has(identifier)) {
				const definition: FootnoteDefinition = {
					type: "footnoteDefinition",
					identifier,
					label: identifier,
					children: [
						{
							type: "paragraph",
							children: [link],
						},
					],
				};
				footnoteDefinitionMap.set(identifier, true);
				root.children.push(definition);
			}
			return identifier;
		}
		visit(root, "footnoteDefinition", (node) => {
			footnoteDefinitionMap.set(node.identifier, true);
		});
		visit(root, "text", (node, idx, parent) => {
			if (isNil(parent) || isNil(idx)) {
				return;
			}
			const link = parent.children.at(idx + 1);
			const tailNode = parent.children.at(idx + 2);
			if (
				!node.value.endsWith("^[") ||
				link?.type !== "link" ||
				tailNode?.type !== "text" ||
				!tailNode.value.startsWith("]")
			) {
				return;
			}
			const identifier = createFootnoteDefinition(link);
			// replace text
			node.value = node.value.slice(0, node.value.length - 2);
			tailNode.value = tailNode.value.slice(1);
			if (tailNode.value.length === 0) {
				parent.children.splice(idx + 2, 1);
			}
			parent.children[idx + 1] = {
				type: "footnoteReference",
				label: identifier,
				identifier,
			};
		});
		visit(root, "text", (node, idx, parent) => {
			const reg = /\^\[[^\]]*\]/g;
			const matches = node.value.matchAll(reg);
			const paragraph: Array<FootnoteReference | Text> = [];
			let offset = 0;
			for (const match of matches) {
				const matchStr = match[0];
				const preText = node.value.slice(offset, match.index);
				offset = match.index + matchStr.length;
				paragraph.push({
					type: "text",
					value: preText,
				});
				const identifier = createFootnoteDefinition(
					matchStr.slice(2).slice(0, matchStr.length - 3),
				);
				paragraph.push({
					type: "footnoteReference",
					label: identifier,
					identifier,
				});
			}
			if (offset < node.value.length) {
				paragraph.push({
					type: "text",
					value: node.value.slice(offset),
				});
			}
			if (isNil(parent) || isNil(idx)) {
				return;
			}
			parent.children.splice(idx, 1, ...paragraph);
		});
	};
};

export default remarkFootnotesExtra;
