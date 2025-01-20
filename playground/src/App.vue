<script setup lang="ts">
import DarkModeAdaptor from '@/components/DarkModeAdaptor.vue'
import { Label } from '@/components/ui/label'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from './components/ui/checkbox'

const markdown = ref(`hello world^[this is footnote]

hello^[https://yangqiuyi.com]test

test^[bing: https://bing.com]
`)
const htmlWithGfm = ref('')
const htmlNoGfm = ref('')

const pluginConfig = reactive({
	breakLink: false,
})

watch(
	[markdown, pluginConfig],
	async () => {
		htmlWithGfm.value = await md2html(markdown.value, {
			gfm: true,
			...pluginConfig,
		})
		htmlNoGfm.value = await md2html(markdown.value, {
			gfm: false,
			...pluginConfig,
		})
	},
	{
		immediate: true,
	},
)
</script>

<template>
	<DarkModeAdaptor />
	<ResizablePanelGroup direction="horizontal" class="w-screen !h-screen">
		<ResizablePanel class="flex flex-col p-1 gap-1" :default-size="50">
			<div>
				<div class="flex items-center space-x-2">
					<Checkbox id="beak-link" v-model:checked="pluginConfig.breakLink" />
					<label
						for="beak-link"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Break Link
					</label>
				</div>
			</div>
			<Textarea v-model="markdown" class="w-full flex-1" />
		</ResizablePanel>
		<ResizableHandle />
		<ResizablePanel :default-size="50">
			<ResizablePanelGroup direction="vertical">
				<ResizablePanel class="flex flex-col gap-2 p-2" :default-size="50">
					<Label class="text-lg font-semibold">GFM</Label>
					<ScrollArea class="flex-1">
						<div class="prose dark:prose-invert" v-html="htmlWithGfm"></div>
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel class="flex flex-col gap-2 p-2" :default-size="50">
					<Label class="text-lg font-semibold">No GFM</Label>
					<ScrollArea class="flex-1">
						<div class="prose dark:prose-invert" v-html="htmlNoGfm"></div>
					</ScrollArea>
				</ResizablePanel>
			</ResizablePanelGroup>
		</ResizablePanel>
	</ResizablePanelGroup>
</template>
