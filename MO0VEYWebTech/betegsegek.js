const state = {
	all: [],
	medicines: [],
	synonymsById: {},
	query: "",
	category: "",
	tags: new Set()
};

let categoryObserver = null;
let typeaheadBox = null;

function readUrlPrefill() {
	try {
		const url = new URL(window.location.href);
		const q = url.searchParams.get("q");
		const focus = url.searchParams.get("focus");
		const category = url.searchParams.get("category");
		const tags = url.searchParams.get("tags");
		return { q, focus, category, tags };
	} catch {
		return { q: null, focus: null, category: null, tags: null };
	}
}

function normalizeText(value) {
	return String(value ?? "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

function applyUrlPrefillToState() {
	const prefill = readUrlPrefill();
	if (typeof prefill.q === "string" && prefill.q.trim()) state.query = prefill.q.trim();
	if (typeof prefill.category === "string" && prefill.category.trim()) state.category = prefill.category.trim();
	if (typeof prefill.tags === "string" && prefill.tags.trim()) {
		const parts = prefill.tags
			.split(",")
			.map(s => s.trim())
			.filter(Boolean);
		state.tags = new Set(parts);
	}
}

function findBestDiseaseForText(text) {
	const q = normalizeText(text);
	if (!q) return null;
	let best = null;
	for (const d of state.all) {
		const nameNorm = normalizeText(d.name);
		const aliases = asArray(state.synonymsById[d.id]);
		let score = Infinity;
		if (nameNorm.includes(q)) score = Math.min(score, nameNorm.indexOf(q));
		for (const a of aliases) {
			const aNorm = normalizeText(a);
			if (!aNorm) continue;
			if (aNorm.includes(q)) score = Math.min(score, 100 + aNorm.indexOf(q));
		}
		if (score === Infinity) continue;
		if (!best || score < best.score) best = { d, score };
	}
	return best ? best.d : null;
}

function scrollToLandingTarget() {
	try {
		const prefill = readUrlPrefill();
		if (window.location.hash && window.location.hash.length > 1) return;

		const focus = typeof prefill.focus === "string" ? prefill.focus.trim() : "";
		if (focus) {
			const d = findBestDiseaseForText(focus);
			if (!d) return;
			const card = document.querySelector(`.condition-card[data-disease-id='${d.id}']`);
			if (!card) return;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					card.scrollIntoView({ behavior: "smooth", block: "start" });
				});
			});
			return;
		}

		const hasFilteringPrefill = Boolean(
			(typeof prefill.q === "string" && prefill.q.trim()) ||
			(typeof prefill.category === "string" && prefill.category.trim()) ||
			(typeof prefill.tags === "string" && prefill.tags.trim())
		);
		if (!hasFilteringPrefill) return;

		const directory = document.getElementById("diseaseDirectory");
		if (!directory) return;
		const targetHeader = directory.querySelector(".disease-category");
		const targetCard = directory.querySelector(".condition-card");
		const target = targetHeader || targetCard || directory;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				target.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		});
	} catch {
	}
}

function uniq(values) {
	return Array.from(new Set(values));
}

function asArray(value) {
	return Array.isArray(value) ? value : [];
}

function minPackagePrice(packages) {
	const prices = (packages ?? []).map(p => Number(p?.ar)).filter(n => Number.isFinite(n) && n > 0);
	if (!prices.length) return 0;
	return Math.min(...prices);
}

function normalizeMedicine(raw) {
	const diseaseIds = Array.isArray(raw?.diseaseIds) ? raw.diseaseIds.filter(Boolean) : [];
	return {
		name: typeof raw?.nev === "string" ? raw.nev : "",
		disease: typeof raw?.betegseg === "string" ? raw.betegseg : "",
		diseaseIds,
		prescriptionOnly: Boolean(raw?.venykoteles),
		priceFrom: minPackagePrice(raw?.kiszerelesek)
	};
}

function medicinesForDiseaseId(diseaseId) {
	return state.medicines
		.filter(m => (m.diseaseIds ?? []).includes(diseaseId))
		.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0) || a.name.localeCompare(b.name, "hu"));
}

function medicineLink(medicineName) {
	const url = new URL("gyogyszerek.html", window.location.href);
	url.searchParams.set("name", medicineName);
	return url.toString();
}

function el(tagName, attrs, ...children) {
	const node = document.createElement(tagName);
	if (attrs) {
		for (const [key, value] of Object.entries(attrs)) {
			if (value === undefined || value === null) continue;
			if (key === "class") node.className = value;
			else if (key === "dataset") {
				for (const [dKey, dValue] of Object.entries(value)) node.dataset[dKey] = dValue;
			} else if (key.startsWith("on") && typeof value === "function") {
				node.addEventListener(key.slice(2), value);
			} else {
				node.setAttribute(key, String(value));
			}
		}
	}
	for (const child of children.flat()) {
		if (child === undefined || child === null) continue;
		node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
	}
	return node;
}

function matchesRecord(record) {
	const q = normalizeText(state.query);
	if (q) {
		const extra = state.synonymsById[record.id] || [];
		const haystack = normalizeText([
			record.name,
			record.category,
			...(record.symptoms ?? []),
			...(record.tags ?? []),
			...extra
		].join(" "));
		if (!haystack.includes(q)) return false;
	}
	if (state.category && record.category !== state.category) return false;
	if (state.tags.size) {
		const recordTags = new Set(record.tags ?? []);
		for (const t of state.tags) {
			if (!recordTags.has(t)) return false;
		}
	}
	return true;
}

function getSuggestions(query, maxCount) {
	const q = normalizeText(query);
	if (!q || q.length < 2) return [];
	const out = [];
	for (const d of state.all) {
		const nameNorm = normalizeText(d.name);
		const aliases = asArray(state.synonymsById[d.id]);
		let score = Infinity;
		if (nameNorm.includes(q)) score = Math.min(score, nameNorm.indexOf(q));
		for (const a of aliases) {
			const aNorm = normalizeText(a);
			if (!aNorm) continue;
			if (aNorm.includes(q)) score = Math.min(score, 100 + aNorm.indexOf(q));
		}
		if (score !== Infinity) out.push({ d, score });
	}
	out.sort((a, b) => a.score - b.score || a.d.name.localeCompare(b.d.name, "hu"));
	return out.slice(0, maxCount).map(x => x.d);
}

function ensureTypeahead(searchInput) {
	if (!searchInput) return null;
	if (typeaheadBox && typeaheadBox.isConnected) return typeaheadBox;
	typeaheadBox = el("div", { id: "diseaseTypeahead", class: "disease-typeahead", role: "listbox" });
	searchInput.insertAdjacentElement("afterend", typeaheadBox);
	return typeaheadBox;
}

function hideTypeahead() {
	if (!typeaheadBox) return;
	typeaheadBox.style.display = "none";
	typeaheadBox.textContent = "";
}

function renderTypeahead(searchInput) {
	const box = ensureTypeahead(searchInput);
	if (!box) return;
	const suggestions = getSuggestions(state.query, 6);
	box.textContent = "";
	if (!suggestions.length) {
		hideTypeahead();
		return;
	}
	for (const d of suggestions) {
		const option = el(
			"button",
			{
				type: "button",
				class: "disease-typeahead-item",
				role: "option",
				onclick: () => {
					if (searchInput) searchInput.value = d.name;
					state.query = d.name;
					hideTypeahead();
					renderAll();
				}
			},
			d.name
		);
		box.appendChild(option);
	}
	box.style.display = "block";
}

function setActiveCategoryLink(anchorId) {
	const root = document.getElementById("categoryLinks");
	if (!root) return;
	const links = root.querySelectorAll("a[href^='#category-']");
	for (const a of links) {
		if (a.getAttribute("href") === `#${anchorId}`) a.classList.add("active");
		else a.classList.remove("active");
	}
}

function setupCategoryObserver() {
	if (categoryObserver) {
		categoryObserver.disconnect();
		categoryObserver = null;
	}
	const directory = document.getElementById("diseaseDirectory");
	if (!directory) return;
	const headers = Array.from(directory.querySelectorAll(".disease-category"));
	if (!headers.length) return;
	let best = null;
	categoryObserver = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				if (!best || e.intersectionRatio > best.ratio) best = { id: e.target.id, ratio: e.intersectionRatio };
			}
			if (best) setActiveCategoryLink(best.id);
			best = null;
		},
		{ root: null, rootMargin: "-20% 0px -70% 0px", threshold: [0.15, 0.25, 0.35, 0.5, 0.65] }
	);
	for (const h of headers) categoryObserver.observe(h);
}

function renderTags(container, tags) {
	container.textContent = "";
	if (!tags.length) return;
	const field = el("div", { class: "disease-tags" });
	for (const t of tags) {
		const id = `tag-${normalizeText(t).replace(/\s+/g, "-")}`;
		const checkbox = el("input", { type: "checkbox", id, value: t });
		checkbox.checked = state.tags.has(t);
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) state.tags.add(t);
			else state.tags.delete(t);
			renderAll();
		});
		field.appendChild(el("label", { for: id, class: "disease-tag" }, checkbox, el("span", null, t)));
	}
	container.appendChild(field);
}

function renderCategoryLinks(container, categories) {
	container.textContent = "";
	const nav = el("nav", { class: "oldal-aside-nav", "aria-label": "Kategóriák" });
	for (const c of categories) {
		const anchor = `category-${normalizeText(c).replace(/\s+/g, "-")}`;
		nav.appendChild(el("a", { href: `#${anchor}` }, c));
	}
	container.appendChild(nav);
}

function renderDropdownCategories(categories) {
	const dropdown = document.querySelector("nav .dropdown-menu");
	if (!dropdown) return;
	const existing = dropdown.querySelector("[data-dynamic='categories']");
	if (existing) existing.remove();
	const wrapper = el("li", { dataset: { dynamic: "categories" } });
	const inner = el("ul", { class: "dropdown-menu", style: "position: static; transform: none; width: 100%; box-shadow: none; border: none; padding: 0; background: transparent;" });
	for (const c of categories.slice(0, 8)) {
		const anchor = `category-${normalizeText(c).replace(/\s+/g, "-")}`;
		inner.appendChild(el("li", null, el("a", { href: `#${anchor}` }, c)));
	}
	wrapper.appendChild(inner);
	dropdown.appendChild(wrapper);
}

function renderDirectory(container) {
	container.textContent = "";
	const filtered = state.all.filter(matchesRecord);
	const byCategory = new Map();
	for (const item of filtered) {
		const c = item.category || "Egyéb";
		if (!byCategory.has(c)) byCategory.set(c, []);
		byCategory.get(c).push(item);
	}

	if (!filtered.length) {
		container.appendChild(el("p", null, "Nincs találat a megadott szűrésre."));
		return;
	}

	for (const [category, items] of byCategory.entries()) {
		const anchor = `category-${normalizeText(category).replace(/\s+/g, "-")}`;
		const cards = el("div", { class: "condition-cards" });
		for (const d of items) {
			const parts = [];
			parts.push(el("p", null, el("strong", null, "Tünetek: "), (d.symptoms ?? []).join(", ") || "-"));
			if ((d.redFlags ?? []).length) parts.push(el("p", { class: "disease-redflags" }, el("strong", null, "Figyelmeztető jelek: "), d.redFlags.join(", ")));
			if ((d.homeTips ?? []).length) parts.push(el("p", null, el("strong", null, "Otthoni tippek: "), d.homeTips.join(" • ")));
			if ((d.recommendedOTC ?? []).length) parts.push(el("p", null, el("strong", null, "Recept nélkül: "), d.recommendedOTC.join(", ")));
			if (d.whenToSeeDoctor) parts.push(el("p", null, el("strong", null, "Mikor érdemes orvoshoz fordulni? "), d.whenToSeeDoctor));

			const badges = el("div", { class: "disease-badges" });
			if (d.category) badges.appendChild(el("span", { class: "condition-badge" }, d.category));
			for (const tag of (d.tags ?? []).slice(0, 4)) badges.appendChild(el("span", { class: "condition-badge" }, tag));

			const rec = medicinesForDiseaseId(d.id);
			const recBlock = el("div", { class: "disease-recs" });
			if (rec.length) {
				const list = el("ul", { class: "disease-recs-list" });
				for (const m of rec.slice(0, 6)) {
					list.appendChild(
						el(
							"li",
							null,
							el("a", { href: medicineLink(m.name) }, m.name),
							m.priceFrom ? ` (${m.priceFrom} Ft-tól)` : ""
						)
					);
				}
				recBlock.appendChild(el("p", null, el("strong", null, "Ajánlott készítmények: ")));
				recBlock.appendChild(list);
			}

			cards.appendChild(
				el(
					"div",
					{ class: "condition-card", dataset: { diseaseId: d.id } },
					el("h3", null, d.name),
					...parts,
					badges,
					recBlock
				)
			);
		}

		container.appendChild(el("h3", { id: anchor, class: "disease-category" }, category));
		container.appendChild(cards);
	}
}

function renderAll() {
	const directory = document.getElementById("diseaseDirectory");
	if (directory) renderDirectory(directory);
	setupCategoryObserver();
}

async function loadDiseases() {
	const res = await fetch("betegsegek.json", { cache: "no-store" });
	if (!res.ok) throw new Error("load_failed");
	const data = await res.json();
	if (!Array.isArray(data)) throw new Error("invalid_data");
	return data;
}

async function loadMedicines() {
	const res = await fetch("gyogyszertar.json", { cache: "no-store" });
	if (!res.ok) throw new Error("load_failed");
	const data = await res.json();
	if (!data || !Array.isArray(data.gyogyszerek)) return [];
	return data.gyogyszerek.map(normalizeMedicine).filter(m => m.name);
}

async function loadSynonyms() {
	const res = await fetch("synonyms.json", { cache: "no-store" });
	if (!res.ok) return {};
	const data = await res.json();
	if (!Array.isArray(data)) return {};
	const out = {};
	for (const row of data) {
		if (!row || typeof row.id !== "string") continue;
		out[row.id] = asArray(row.aliases).filter(a => typeof a === "string" && a);
	}
	return out;
}

function initControls(all) {
	const search = document.getElementById("diseaseSearch");
	const category = document.getElementById("categoryFilter");
	const tags = document.getElementById("tagFilters");
	const categoryLinks = document.getElementById("categoryLinks");

	const categories = uniq(all.map(d => d.category).filter(Boolean)).sort((a, b) => a.localeCompare(b, "hu"));
	const allTags = uniq(all.flatMap(d => d.tags ?? [])).sort((a, b) => a.localeCompare(b, "hu"));

	if (category) {
		category.textContent = "";
		category.appendChild(el("option", { value: "" }, "Mindegy"));
		for (const c of categories) category.appendChild(el("option", { value: c }, c));
		if (state.category) category.value = state.category;
		category.addEventListener("change", () => {
			state.category = category.value;
			renderAll();
		});
	}

	if (search) {
		if (state.query) search.value = state.query;
		search.addEventListener("input", () => {
			state.query = search.value;
			renderTypeahead(search);
			renderAll();
		});
		search.addEventListener("blur", () => {
			setTimeout(() => hideTypeahead(), 120);
		});
		search.addEventListener("keydown", (e) => {
			if (e.key === "Escape") hideTypeahead();
		});
	}

	if (tags) renderTags(tags, allTags);
	if (categoryLinks) renderCategoryLinks(categoryLinks, categories);
	renderDropdownCategories(categories);
}

function initWizard() {
	const form = document.getElementById("wizardForm");
	const issue = document.getElementById("wizardIssue");
	const duration = document.getElementById("wizardDuration");
	const breathing = document.getElementById("wizardBreathing");
	const chestPain = document.getElementById("wizardChestPain");
	const highFever = document.getElementById("wizardHighFever");
	const severe = document.getElementById("wizardSevere");
	const reset = document.getElementById("wizardReset");
	const result = document.getElementById("wizardResult");

	if (!form || !issue || !duration || !result) return;

	function clear() {
		form.reset();
		result.style.display = "none";
		result.textContent = "";
	}

	if (reset) reset.addEventListener("click", clear);

	function idsForIssue(v) {
		if (v === "cold") return ["common-cold", "influenza", "bacterial-throat"];
		if (v === "headache") return ["migraine"];
		if (v === "reflux") return ["reflux"];
		if (v === "allergy") return ["allergy-hayfever"];
		if (v === "constipation") return ["constipation"];
		if (v === "sleep") return ["insomnia"];
		if (v === "anxiety") return ["anxiety"];
		return [];
	}

	function renderResult(targetIds, isUrgent, extraText) {
		result.textContent = "";
		const top = el("div", null);
		if (isUrgent) {
			top.appendChild(el("p", { class: "wizard-urgent" }, "Figyelem: a válaszok alapján orvosi vizsgálat javasolt."));
			top.appendChild(el("p", null, el("a", { href: "#whenDoctor" }, "Ugrás az orvosi vizsgálat részhez")));
		}
		if (extraText) top.appendChild(el("p", null, extraText));
		result.appendChild(top);

		const uniqueIds = uniq(targetIds).filter(Boolean);
		if (!uniqueIds.length) {
			result.appendChild(el("p", null, "Nem sikerült ajánlást adni ezzel a kombinációval."));
			result.style.display = "block";
			return;
		}

		const list = el("ul", null);
		for (const id of uniqueIds) {
			const d = state.all.find(x => x.id === id);
			if (!d) continue;
			list.appendChild(el("li", null, el("a", { href: `#category-${normalizeText(d.category || "egyeb").replace(/\s+/g, "-")}` }, d.name)));
			const meds = medicinesForDiseaseId(id).slice(0, 4);
			if (meds.length) {
				const medsList = el("ul", null);
				for (const m of meds) medsList.appendChild(el("li", null, el("a", { href: medicineLink(m.name) }, m.name)));
				list.appendChild(el("li", null, el("strong", null, "Ajánlott készítmények:"), medsList));
			}
		}
		result.appendChild(el("p", null, el("strong", null, "Lehetséges irányok:")));
		result.appendChild(list);
		result.style.display = "block";
	}

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const v = String(issue.value || "");
		const d = String(duration.value || "");
		const urgent = Boolean((breathing && breathing.checked) || (chestPain && chestPain.checked) || (highFever && highFever.checked) || (severe && severe.checked));
		let ids = idsForIssue(v);
		let extra = "";
		if (v === "cold" && d === "8+") extra = "Ha a tünetek több mint egy hete fennállnak vagy romlanak, érdemes orvossal egyeztetni.";
		renderResult(ids, urgent, extra);
	});
}

function showLoadError() {
	const target = document.getElementById("diseaseDirectory");
	if (!target) return;
	target.textContent = "";
	target.appendChild(el("p", null, "Nem sikerült betölteni az adatokat. Kérjük, próbálja meg később."));
}

document.addEventListener("DOMContentLoaded", async () => {
	try {
		applyUrlPrefillToState();
		const loaded = await Promise.all([loadDiseases(), loadMedicines(), loadSynonyms()]);
		state.all = loaded[0];
		state.medicines = loaded[1];
		state.synonymsById = loaded[2] || {};
		initControls(state.all);
		initWizard();
		renderAll();
		scrollToLandingTarget();
	} catch {
		showLoadError();
	}
});
