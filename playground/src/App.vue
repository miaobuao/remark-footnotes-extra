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

const markdown = ref(`hello world^[this is footnote]

hello^[https://yangqiuyi.com]test
`)
const htmlWithGfm = ref('')
const htmlNoGfm = ref('')

const pluginConfig = reactive({
	breakLink: false,
})

watch(
	markdown,
	async () => {
		htmlWithGfm.value = await md2html(markdown.value, { gfm: true })
		htmlNoGfm.value = await md2html(markdown.value, { gfm: false })
	},
	{
		immediate: true,
	},
)
</script>

<template>
	<DarkModeAdaptor />
	<ResizablePanelGroup direction="horizontal" class="w-screen !h-screen">
		<ResizablePanel class="flex p-1 gap-1" :default-size="50">
			<Textarea v-model="markdown" class="w-full h-full" />
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
