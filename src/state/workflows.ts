import { writable } from 'svelte/store';

export const workflowsState: Writable<undefined|unknown> = writable(undefined);
