

import { LGraph } from 'litegraph.js';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
	return { uid: params.uid };
}) satisfies PageLoad;
