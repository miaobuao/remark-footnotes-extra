<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

const { system, store } = useColorMode()

watch(
	system,
	(value) => {
		if (value === 'dark') {
			document.body.classList.add('dark')
		} else {
			document.body.classList.remove('dark')
		}
	},
	{ immediate: true },
)
</script>
