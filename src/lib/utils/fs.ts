import '$lib/utils/nodes.server';

class ExtendableProxy {
	constructor(a: any, b: any) {
		return new Proxy(a, b);
	}
}

export class Repository extends ExtendableProxy {
	#cache = {};

	static Adapter = class implements ProxyHandler<object> {
		get(target: any, prop: string) {
			console.log(`Reading file ${prop}`);
			return Reflect.get(...arguments);
		}

		set(target: any, prop: string, value: unknown) {
			console.log(`Editing file ${prop}`);
			return Reflect.set(...arguments);
		}

		defineProperty(target: any, prop: string /*, descriptor*/) {
			console.log(`Create new file ${prop}`);
			return Reflect.defineProperty(...arguments);
		}

		deleteProperty(target: any, prop: string) {
			console.log(`Remove file ${prop}`);
			return Reflect.deleteProperty(...arguments);
		}
	};

	constructor() {
		const cache = {};
		super(cache, new Repository.Adapter());
		this.#cache = cache;
	}
}
