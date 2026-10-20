import remarkFootnotesExtra, {
	type PluginOptions,
} from 'remark-footnotes-extra'

const options: PluginOptions = { breakLink: true }
const transform = remarkFootnotesExtra(options)
transform({ type: 'root', children: [] })
