import remarkFootnotesExtra, {
	type PluginOptions,
} from 'remark-footnotes-extra'
import { unified } from 'unified'

const options: PluginOptions = { breakLink: true }
unified().use(remarkFootnotesExtra, options)
