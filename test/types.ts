import { unified } from 'unified'
import remarkFootnotesExtra, { type PluginOptions } from '../src'

const options: PluginOptions = { breakLink: true }
unified().use(remarkFootnotesExtra).use(remarkFootnotesExtra, options)

// @ts-expect-error Options must retain their public boolean type.
unified().use(remarkFootnotesExtra, { breakLink: 'yes' })
// @ts-expect-error Unknown options must not be silently accepted.
unified().use(remarkFootnotesExtra, { unknown: true })
