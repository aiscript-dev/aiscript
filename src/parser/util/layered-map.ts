import autobind from 'autobind-decorator';

export class LayeredMap<T> {
	private layers: Map<string, T>[];

	constructor(layers: LayeredMap<T>['layers'] = []) {
		this.layers = layers;
	}

	@autobind
	public createSubLayer(map: Map<string, T> = new Map()): LayeredMap<T> {
		return new LayeredMap<T>([map, ...this.layers]);
	}

	@autobind
	public set(name: string, value: T) {
		this.layers[0].set(name, value);
	}

	@autobind
	public get(name: string, top?: boolean): T {
		if (top) {
			if (this.layers[0].has(name)) {
				return this.layers[0].get(name)!;
			}
		} else {
			for (const layer of this.layers) {
				if (layer.has(name)) {
					return layer.get(name)!;
				}
			}
		}
		throw new Error(`No such item '${name}'`);
	}

	@autobind
	public has(name: string, top?: boolean): boolean {
		if (top) {
			return this.layers[0].has(name);
		} else {
			for (const layer of this.layers) {
				if (layer.has(name)) return true;
			}
			return false;
		}
	}
}
