import {createEffect, createSignal, For, JSX, Show} from 'solid-js';
import {createStore} from 'solid-js/store';

const matchesAny = (string: string, ...matchesAnyOf: string[]) => matchesAnyOf.includes(string);

const [editing, setEditing] = createSignal(false);

const Button = (props: { onClick?: () => void, children: JSX.Element }) => {
	return <button onClick={props.onClick} class="border border-black rounded px-2 py-4 cursor-pointer">{props.children}</button>
};

const StatButton = (props: { name: string, value: number, setValue: (newValue: number) => void }) => {
	return <div class="flex flex-col w-20">
		<span class="self-center">{props.name}</span>
		<div class="flex flex-row justify-between w-full">
			<Show when={editing()} fallback={<div></div>}>
				<Button onClick={() => props.setValue(props.value - 1)}>-</Button>
			</Show>
			<span class="self-center text-3xl">{props.value}</span>
			<Show when={editing()} fallback={<div></div>}>
				<Button onClick={() => props.setValue(props.value + 1)}>+</Button>
			</Show>
		</div>
	</div>
};

const DEFAULT_STAT_LEVEL = 5;
const DEFAULT_STATE = {
	level: 0,
	stats: {
		speed: DEFAULT_STAT_LEVEL,
		strength: DEFAULT_STAT_LEVEL,
		dexterity: DEFAULT_STAT_LEVEL,
		willpower: DEFAULT_STAT_LEVEL,
		perception: DEFAULT_STAT_LEVEL
	},
	bleeding: false,
	armor: "UNARMORED" as "UNARMORED" | "LIGHT" | "MEDIUM" | "HEAVY",
	health: 50,
	maxHealth: 50,
	items: [] as string[],
	notes: ""
};

export const App = () => {
	// TODO: This is gonna blow up. Implement zod parsing or whatever to make this safe
	const localData = JSON.parse(localStorage.getItem('store')!) ?? DEFAULT_STATE;

	const [store, setStore] = createStore<typeof DEFAULT_STATE>(localData);

	createEffect(() => {
		localStorage.setItem('store', JSON.stringify(store));
	});

	const attackDice = () => {
		if (store.stats.strength <= 4) {
			return 1;
		} else if (store.stats.strength <= 9) {
			return 2;
		} else if (store.stats.strength <= 16) {
			return 3;
		} else if (store.stats.strength <= 24) {
			return 4;
		} else if (store.stats.strength <= 33) {
			return 5;
		} else if (store.stats.strength <= 41) {
			return 6;
		} else if (store.stats.strength <= 49) {
			return 7;
		} else {
			return 8;
		}
	};

	const speedBonus = () => {
		switch (store.armor) {
			case 'UNARMORED':
				return 2;
			case 'LIGHT':
				return 0;
			case 'MEDIUM':
				return -1;
			case 'HEAVY':
				return -3;
		}
	};

	const totalSpeed = () => {
		return store.stats.speed + speedBonus();
	};

	const parryDice = () => {
		if (totalSpeed() <= 12) {
			return 1;
		} else if (totalSpeed() <= 24) {
			return 2;
		} else if (totalSpeed() <= 36) {
			return 3;
		} else {
			return 4;
		}
	};

	const diceSize = () => {
		if (store.level <= 2) {
			return "d6";
		} else if (store.level <= 5) {
			return "d8";
		} else if (store.level <= 8) {
			return "d10";
		} else {
			return "d12";
		}
	}

	const defense = () => {
		return parseInt(diceSize().replace("d", "")) / 2;
	};

	const defenseBonus = () => {
		if (store.armor === 'UNARMORED') {
			return 1;
		} else if (store.armor === 'HEAVY') {
			return -1;
		} else {
			return 0;
		}
	};

	const armorBonuses = () => {
		return {
			SLASHING: matchesAny(store.armor, 'UNARMORED', 'LIGHT') ? 1.5 : 0.5,
			PIERCING: matchesAny(store.armor, 'UNARMORED', 'MEDIUM') ? 1.5 : 0.5,
			BLUNT: matchesAny(store.armor, 'LIGHT', 'MEDIUM') ? 1 : store.armor === 'UNARMORED' ? 1.5 : 0.5,
			BLUDGEONING: store.armor === 'UNARMORED' ? 1.5 : 1
		};
	}

	const formattedArmor = () => {
		switch (store.armor) {
			case 'UNARMORED':
				return 'Unarmored';
			case 'LIGHT':
				return 'Light';
			case 'MEDIUM':
				return 'Medium';
			case 'HEAVY':
				return 'Heavy';
		}
	};

	return (
		<div class="flex flex-col h-full w-full gap-5 pt-5 px-5">
			<div class="flex flex-row gap-2">
				<button
					class="border border-black rounded p-2 cursor-pointer"
					onClick={() => setEditing(!editing())}
				>
					{editing() ? 'Stop editing' : 'Edit'}
				</button>

				<button
					class="border border-black rounded p-2 cursor-pointer"
					onClick={() => setStore(DEFAULT_STATE)}
				>
					Reset
				</button>
			</div>
			<div class="self-center">
				<span class="text-xl">
					Level:{' '}
					<Show when={editing()}>
						<Button onClick={() => setStore('level', store.level - 1)}>
							-
						</Button>
					</Show>
					{store.level}
					<Show when={editing()}>
						<Button onClick={() => setStore("level", store.level + 1)}>
							+
						</Button>
					</Show>
				</span>
			</div>
			<div class="flex flex-row justify-between">
				<div class="flex flex-col w-20">
					<span class="self-center">Speed</span>
					<div class="flex flex-row justify-between w-full">
						<Show when={editing()} fallback={<div></div>}>
							<Button onClick={() => setStore("stats", {speed: store.stats.speed - 1})}>-</Button>
						</Show>
						<span class="self-center text-3xl">{store.stats.speed + (editing() ? 0 : speedBonus())} <Show when={!editing()}><span class="text-xl">({store.stats.speed}{speedBonus() >= 0 ? `+${speedBonus()}` : speedBonus()})</span></Show></span>
						<Show when={editing()} fallback={<div></div>}>
							<Button onClick={() => setStore("stats", {speed: store.stats.speed + 1})}>+</Button>
						</Show>
					</div>
				</div>
				<StatButton
					name="Strength"
					value={store.stats.strength}
					setValue={(newValue: number) => setStore('stats', {strength: newValue})}
				/>
				<StatButton
					name="Dexterity"
					value={store.stats.dexterity}
					setValue={(newValue: number) => setStore('stats', {dexterity: newValue})}
				/>
				<StatButton
					name="Willpower"
					value={store.stats.willpower}
					setValue={(newValue: number) => setStore('stats', {willpower: newValue})}
				/>
				<StatButton
					name="Perception"
					value={store.stats.perception}
					setValue={(newValue: number) => setStore("stats", { perception: newValue })}
				/>
			</div>
			<div class="grid grid-cols-2">
				<span class="text-xl">
					Health:{" "}
					<Show when={editing()}>
						<Button onClick={() => setStore("health", store.health - 1)}>
							-
						</Button>
					</Show>
					<strong>{store.health}</strong>
					<Show when={editing()}>
						<Button onClick={() => setStore("health", store.health + 1)}>
							+
						</Button>
					</Show>
					<strong>/{store.maxHealth}</strong>
				</span>
				<div class="flex flex-col">
					<span class="text-xl">Statuses:</span>
					<label><input type="checkbox" checked={store.bleeding} onChange={e => setStore("bleeding", e.target.checked)}/> Bleeding</label>
				</div>
			</div>
			<div class="flex flex-col">
				<span class="text-xl">Attack dice: <strong>{attackDice()} {diceSize()}</strong></span>
				<span class="text-xl">Parry pool: <strong>{parryDice()} {diceSize()}</strong></span>
				<span class="text-xl">Defense: <strong>{defense() + defenseBonus()}</strong> ({defense()}, {defenseBonus() >= 0 ? `+${defenseBonus()}` : defenseBonus()} from armor)</span>
			</div>
			<div class="flex flex-col">
				<span>Armour:</span>
				<Show when={editing()} fallback={<span><strong>{formattedArmor()}</strong></span>}>
					<select
						class="border border-black rounded py-2"
						value={store.armor}
						onChange={e => setStore("armor", e.target.value as typeof DEFAULT_STATE['armor'])}
					>
						<option value="UNARMORED">Unarmored</option>
						<option value="LIGHT">Light</option>
						<option value="MEDIUM">Medium</option>
						<option value="HEAVY">Heavy</option>
					</select>
				</Show>
				<span>Bonuses:</span>
				<ul class="list-disc">
					<li class="ml-5">Slashing: {armorBonuses().SLASHING}</li>
					<li class="ml-5">Piercing: {armorBonuses().PIERCING}</li>
					<li class="ml-5">Blunt: {armorBonuses().BLUNT}</li>
					<li class="ml-5">Bludgeoning: {armorBonuses().BLUDGEONING}</li>
				</ul>
			</div>
			<div class="flex flex-col">
				<span>Items:</span>

				{/* Reactivity in Solid is weird; I tried writing a single For with a editing() ? <input> : <span>,
				but it didn't update when editing was enabled. This is ugly, but does the job for now... */}
				{editing() ? (
					<div class="flex flex-col py-2 gap-2">
						<For each={store.items} fallback={<span></span>}>
							{(item, index) => (
								<div class="flex flex-row gap-2">
									<input
										type="text"
										class="border border-black rounded p-1"
										value={item} onChange={e => setStore('items', index(), e.target.value)}
									/>
									<Button onClick={() => setStore("items", store.items.filter((_, i) => i !== index()))}>-</Button>
								</div>
							)}
						</For>
					</div>
				) : (
					<ul class="list-disc">
						<For each={store.items} fallback={<span></span>}>
							{item => (
								<li class="ml-5">{item}</li>
							)}
						</For>
					</ul>
				)}

				<Show when={editing()}>
					<button
						class="self-start border border-black rounded p-2 cursor-pointer"
						onClick={() => setStore('items', store.items.length, 'My first item')}
					>
						Add Item
					</button>
				</Show>
			</div>
			<div class="flex flex-col">
				<span class="text-2xl">Notes:</span>
				<textarea
					class="border border-black rounded"
					rows={5}
					value={store.notes}
					onChange={e => setStore('notes', e.target.value)}
				></textarea>
			</div>
		</div>
	)
}