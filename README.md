# remark-footnotes-extra

## Install

```sh
pnpm add -D remark-footnotes-extra
``` 

**Input:**

```markdown
hello world^[this is footnote]
```

**Output:**

![output](assets/image-1.png)

## Usage

```js
import remarkFootnotesExtra from "remark-footnotes-extra";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
    .use(remarkParse)
    .use(remarkFootnotesExtra)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify);

const value = "hello world^[this is footnote]";
const file = await processor.process(value);
console.log(String(file));
```
