<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AwaitButton from '$lib/components/AwaitButton.svelte';
	import { notifications } from '$lib/utils/notify';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { dataAsFile } from '$lib/utils/download';
	import { trpc } from '$lib/trpc/client';
	import { dialog } from '$lib/utils/dialogs/dialogs';
	import { diff, patch, unpatch } from 'jsondiffpatch';
	import { LGraph } from 'litegraph.js';
	import GraphEditor from '$lib/components/GraphEditor.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import MetadataDialog from '$lib/dialogs/MetadataDialog.svelte';
	import FilesDialog from '$lib/dialogs/FilesDialog.svelte';
	import { run } from 'svelte/internal';
	import { workflowsState } from '../../state/workflows';

	export class entry_t<T extends object, dT> {
		uid: string;
		name?: string;
		desc?: string;
		tags: string[];
		history: {
			prev: dT[];
			next: dT[];
			tmp: T;
			synchronized: boolean;
		};
		constructor(uid: string) {
			this.uid = uid;
			this.history = {
				prev: [],
				next: [],
				tmp: {} as T,
				synchronized: false
			};
			this.history.prev.push({} as dT);
			this.tags = [];
		}
	}

	let files: { [key: string]: any } = {};
	let selectedFile: { uid: string; data: entry_t<object, object> } | undefined = undefined;
	let graph: LGraph = new LGraph();

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', shortcuts);
		}
		if ($workflowsState != undefined) {
			[files, selectedFile, graph] = [
				$workflowsState.files,
				$workflowsState.selectedFile,
				$workflowsState.graph
			];
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', shortcuts);
		}
		$workflowsState = { files, selectedFile, graph };
	});

	function shortcuts(e: KeyboardEvent) {
		if (e.key == 'ArrowLeft' && e.ctrlKey && e.shiftKey) {
			Operators.movePrev();
			e.preventDefault();
		} else if (e.key == 'ArrowRight' && e.ctrlKey && e.shiftKey) {
			Operators.moveNext();
			e.preventDefault();
		} else if (e.key == 'ArrowLeft' && e.ctrlKey) {
			Operators.switchPrev();
			e.preventDefault();
		} else if (e.key == 'ArrowRight' && e.ctrlKey) {
			Operators.switchNext();
			e.preventDefault();
		} else if (e.key == 'Z' && e.ctrlKey) {
			Operators.redo();
			e.preventDefault();
		} else if (e.key == 'z' && e.ctrlKey) {
			Operators.undo();
			e.preventDefault();
		} else if (e.key == 'S' && e.ctrlKey) {
			Operators.saveAll();
			e.preventDefault();
		} else if (e.key == 's' && e.ctrlKey) {
			Operators.save();
			e.preventDefault();
		} else if (e.key == 'F2') {
			Operators.rename();
			e.preventDefault();
		} else {
		}
	}

	const Operators = {
		move: (keyA?: string, keyB?: string) => {
			if (keyA == undefined || keyB == undefined) return;
			let seq = Object.entries(files);
			seq = seq.map((k) => {
				if (k[0] == keyA) return [keyB, files[keyB]];
				else if (k[0] == keyB) return [keyA, files[keyA]];
				else return k;
			});
			files = Object.fromEntries(seq);
		},
		movePrev: () => {
			if (selectedFile == undefined) return;
			let index = undefined;
			let keys = Object.keys(files);
			keys.find((x, i) => {
				index = i;
				return x == selectedFile?.uid;
			});
			if (index) return Operators.move(keys[index], keys[index - 1]);
		},
		moveNext: () => {
			if (selectedFile == undefined) return;
			let index = undefined;
			let keys = Object.keys(files);
			keys.find((x, i) => {
				index = i;
				return x == selectedFile?.uid;
			});
			if (index) return Operators.move(keys[index], keys[index + 1]);
		},
		switch: async (uid?: string) => {
			if (uid == undefined) return;
			await goto(`/workflows/${uid}`);
			selectedFile = { uid, data: files[uid] };
			graph.configure(files[uid].history?.tmp ?? {});
		},
		switchPrev: async () => {
			if (selectedFile == undefined) return;
			let index = undefined;
			let keys = Object.keys(files);
			keys.find((x, i) => {
				index = i;
				return x == selectedFile?.uid;
			});
			if (index != undefined && index > 0) await Operators.switch(keys[index - 1]);
			else return false;
		},
		switchNext: async () => {
			if (selectedFile == undefined) return;
			let index = undefined;
			let keys = Object.keys(files);
			keys.find((x, i) => {
				index = i;
				return x == selectedFile?.uid;
			});
			if (index != undefined && index + 1 < keys.length) await Operators.switch(keys[index + 1]);
			else return false;
		},

		create: async () => {
			const t = await trpc($page)['programs/new'].query();
			files[t] = new entry_t<object, object>(t);
			await Operators.switch(t);
			//To make svelte happy
			files = files;
		},

		save: async () => {
			if (selectedFile == undefined) return;
			const t = await trpc($page)['programs/update'].query({
				uid: selectedFile.uid,
				data: {
					graph: selectedFile.data.history.tmp,
					tags: selectedFile.data.tags,
					name: selectedFile.data.name,
					desc: selectedFile.data.desc
				},
				mode: 'replace'
			});
			selectedFile.data.history.synchronized = t;
			files = files;
		},

		saveAll: async () => {
			for (const file of Object.values(files)) {
				const t = await trpc($page)['programs/update'].query({
					uid: file.uid,
					data: {
						graph: file.history.tmp,
						tags: file.tags,
						name: file.name,
						desc: file.desc
					},
					mode: 'replace'
				});
				file.history.synchronized = t;
			}

			files = files;
		},

		rename: async (name?: string) => {
			if (selectedFile != undefined) {
				selectedFile.data.name =
					name ??
					(await dialog?.prompt('Input filename', selectedFile.data.name ?? selectedFile.uid))
						.prompt ??
					selectedFile.data.name ??
					selectedFile.uid;
			}
			files = files;
		},

		metadata: async (data: any) => {
			if (selectedFile == undefined) return;
			selectedFile.data.name = data.name;
			selectedFile.data.tags = data.tags;
			selectedFile.data.desc = data.desc;
			console.log(data);
			files = files;
		},
		//Todo maybe it should not allow the arg. Either all of them accept an optional target, or none.
		close: async (uid?: string) => {
			uid ??= selectedFile?.uid;
			if (uid == undefined) return;
			if ((await Operators.switchNext()) == false) {
				if ((await Operators.switchPrev()) == false) {
					selectedFile = undefined;
					await goto('/workflows');
				}
			}
			delete files[uid];
			files = files;
		},

		delete: async () => {
			await trpc($page)['programs/delete'].query({ uid: selectedFile?.uid ?? '' });
			Operators.close();
		},

		undo: () => {
			if (selectedFile == undefined || selectedFile?.data.history.prev.length < 2) return;

			if (selectedFile == undefined) return;
			patch(selectedFile.data.history.tmp, selectedFile.data.history.prev.at(-1) ?? {});
			const p = selectedFile?.data.history.prev.pop();
			if (p) selectedFile.data.history.next.push(p);
			graph.configure(structuredClone(selectedFile.data.history.tmp));
			selectedFile.data.history.synchronized = false;
			//To make svelte happy
			selectedFile = selectedFile;
			files = files;
		},

		redo: () => {
			if (selectedFile == undefined || selectedFile?.data.history.next.length < 1) {
				return;
			}

			if (selectedFile == undefined) return;

			const p = selectedFile.data.history.next.pop();
			if (p) {
				selectedFile.data.history.prev.push(p);
				graph.configure(unpatch(selectedFile.data.history.tmp, p));
				selectedFile.data.history.tmp = structuredClone(graph.serialize());
				selectedFile.data.history.synchronized = false;
			}
			//To make svelte happy
			selectedFile = selectedFile;
			files = files;
		},

		run: async () => {
			dialog?.alert('No run op supported at this stage');
		}
	};

	const updateHistory = () => {
		if (selectedFile == undefined) return;

		const tmp = structuredClone(graph.serialize());
		const d = diff(tmp, selectedFile.data.history.tmp);
		if (d != undefined) {
			selectedFile.data.history.tmp = tmp;
			selectedFile.data.history.prev.push(d);
			if (selectedFile.data.history.prev.length > 100) {
				selectedFile.data.history.prev.splice(0, 1);
				console.log('Removed older history');
			}
			selectedFile.data.history.next.length = 0;
			selectedFile.data.history.synchronized = false;

			//To make svelte happy
			selectedFile = selectedFile;
			files = files;
		}
	};

	graph.afterChange = updateHistory;

	let DialogFiles: FilesDialog;
	let DialogTest: Dialog;
	let DialogMetadata: MetadataDialog;
</script>

<Layout>
	<svelte:fragment slot="toolbar">
		<section>
			<AwaitButton
				op={async (e) => {
					await Operators.create();
					if (e?.shiftKey == false) await Operators.rename();
				}}
				tip="Add file"
				icon="material-symbols:add-box-outline"
			/>
			<AwaitButton
				op={async (e) => {
					const t = (await trpc($page)['programs/ls'].query()).filter((x) => {
						return !Object.keys(files).includes(x.uid);
					});
					if (e?.shiftKey == false) {
						DialogFiles.files = t;
						await DialogFiles.open();
					}
					const selection =
						e?.shiftKey == true ? t.map((x) => x.uid) : Object.keys(DialogFiles.data() ?? {});
					for (const file of selection) {
						files[file] ??= new entry_t(file);
						//TODO Load file.
						const tmp = await trpc($page)['programs/get'].query({ uid: file });
						files[file].name = tmp.name;
						files[file].desc = tmp.desc;
						files[file].tags = tmp.tags;
						files[file].history.tmp = tmp.graph;
						files[file].history.synchronized = true;
					}
					if (selection.length > 0) Operators.switch(selection[0]);

					//console.log('Output data', DialogFiles.data());
					files = files;
				}}
				tip="Open"
				icon="material-symbols:file-open-outline-sharp"
			/>
			<AwaitButton icon="ic:round-save-all" tip="Save all" op={Operators.saveAll} />
		</section>
		<section class="git">
			<AwaitButton icon="material-symbols:commit" tip="Save & Commit" />
			<AwaitButton icon="material-symbols:settings-backup-restore" tip="Scrap changes" />

			<AwaitButton icon="material-symbols:download" tip="Pull" />
			<AwaitButton icon="material-symbols:upload" tip="Push" />
		</section>

		<section>
			<h1
				on:dblclick={async (e) => {
					if (selectedFile == undefined) return;
					if (e.shiftKey == false) {
						DialogMetadata.name = selectedFile.data.name ?? selectedFile.data.uid;
						DialogMetadata.tags = selectedFile.data.tags;
						DialogMetadata.desc = selectedFile.data.desc ?? '';
						await DialogMetadata.open();
						if (DialogMetadata.data() != null) Operators.metadata(DialogMetadata.data());
					} else Operators.rename();
				}}
			>
				{selectedFile?.data.name ?? selectedFile?.uid ?? 'No file selected'}
			</h1>
		</section>
	</svelte:fragment>
	<svelte:fragment slot="default">
		{#if selectedFile != undefined}
			<GraphEditor {graph} />
		{:else}<slot />
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="tabbar">
		<section>
			<AwaitButton
				disabled={selectedFile == undefined || selectedFile?.data.history.synchronized == true}
				op={Operators.save}
				tip="Save"
				icon="material-symbols:save"
			/>
			<AwaitButton
				confirm={selectedFile?.data.history.synchronized == false
					? 'Close without saving?'
					: undefined}
				disabled={selectedFile == undefined}
				op={() => Operators.close()}
				tip="Close"
				icon="mdi:close-box"
			/>
			<AwaitButton
				confirm={'Are you sure you want to delete this file?'}
				disabled={selectedFile == undefined}
				op={Operators.delete}
				tip="Delete"
				icon="material-symbols:delete-outline"
			/>
		</section>
		<section>
			<AwaitButton
				disabled={selectedFile == undefined}
				tip="Import"
				icon="fontisto:import"
				op={async (e) => {
					const loader = document.createElement('input');
					loader.setAttribute('type', 'file');
					loader.click();
					loader.onchange = (e) => {
						let reader = new FileReader();

						reader.onload = function () {
							let data = JSON.parse(reader.result?.toString() ?? '');
							graph.configure(data);
							graph.afterChange();
						};
						reader.readAsText(loader.files?.item(0) ?? new Blob());
					};
				}}
			/>
			<AwaitButton
				disabled={selectedFile == undefined}
				tip="Export"
				icon="fontisto:export"
				op={() => {
					const t = dataAsFile();
					//notifications.info(selectedFile?.data?.label ?? selectedFile?.uid, 1000);
					t(selectedFile?.data, `${selectedFile?.data.name ?? selectedFile?.uid}.json`);
				}}
			/>
		</section>
		<section>
			<AwaitButton
				disabled={selectedFile == undefined || selectedFile?.data.history.prev.length < 2}
				tip="Run task"
				icon="material-symbols:directions-run"
				op={Operators.run}
			/>
		</section>
		<section class="history">
			<AwaitButton
				disabled={selectedFile == undefined || selectedFile?.data.history.prev.length < 2}
				tip="Undo"
				icon="ic:baseline-undo"
				op={Operators.undo}
			/>
			<AwaitButton
				disabled={selectedFile == undefined || selectedFile?.data.history.next.length < 1}
				tip="Redo"
				icon="ic:baseline-redo"
				op={Operators.redo}
			/>
		</section>

		<section class="programs">
			<!--files here-->

			{#each Object.entries(files) as [uid, data]}
				<button class:selected={uid == selectedFile?.uid} on:click={() => Operators.switch(uid)}
					>{files[uid].name ?? uid}{files[uid].history.synchronized ? `` : `*`}</button
				>
			{/each}
		</section>
	</svelte:fragment>

	<svelte:fragment slot="dialog-area">
		<Dialog bind:this={DialogTest}
			><h1>Test dialog general</h1>
			<input name="hello" />
		</Dialog>
		<FilesDialog bind:this={DialogFiles} />
		<MetadataDialog bind:this={DialogMetadata} />
	</svelte:fragment>
</Layout>

<style lang="scss">
	.programs {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-start;
		align-items: center;
		align-content: center;
		gap: 5px;

		button.selected {
			background-color: lightblue;
		}
	}
</style>
