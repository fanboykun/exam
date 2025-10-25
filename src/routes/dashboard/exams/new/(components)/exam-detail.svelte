<script lang="ts">
	import * as Card from '$lib/components/ui/card/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
</script>

<Card.Root>
	<Card.Content class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<Label>Title</Label>
			<Input />
		</div>
		<div class="flex flex-col gap-2">
			<Label>Description</Label>
			<Textarea />
		</div>
		<div class="flex flex-col gap-2">
			<Label>Duration</Label>
			<Input type="number" min="1" />
		</div>
		<div class="flex flex-col gap-2">
			<Label
				class="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
			>
				<Checkbox
					id="toggle-2"
					checked
					class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
				/>
				<div class="grid gap-1.5 font-normal">
					<p class="text-sm leading-none font-medium">Randomize questions</p>
					<p class="text-sm text-muted-foreground">Make questions number out of order</p>
				</div>
			</Label>
		</div>
	</Card.Content>
</Card.Root>
