import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';

async function sum(a: number, b: number) {
	console.log('Server side execution');
	return a + b;
}

LiteGraph.clearRegisteredTypes();
LiteGraph.wrapFunctionAsNode('basic/sum', sum, ['Number', 'Number'], 'Number');
LiteGraph.wrapFunctionAsNode('basic/mul', sum, ['Number', 'Number'], 'Number');
