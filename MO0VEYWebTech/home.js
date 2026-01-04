document.addEventListener("DOMContentLoaded", () => {
	function normalizeText(value) {
		return String(value ?? "")
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim();
	}

	function uniq(values) {
		return Array.from(new Set(values));
	}

	function byTextId(id) {
		return document.getElementById(id);
	}

	const els = {
		statMedicines: byTextId("statMedicines"),
		statRx: byTextId("statRx"),
		statDiseases: byTextId("statDiseases"),
		statCategories: byTextId("statCategories"),
		homeSearch: byTextId("homeSearch"),
		homeSearchGo: byTextId("homeSearchGo"),
		typeahead: byTextId("homeTypeahead"),
		highlightMain: byTextId("highlightMain"),
		highlightSub: byTextId("highlightSub"),
		startMedicines: byTextId("startMedicines"),
		startDiseases: byTextId("startDiseases"),
		startTips: byTextId("startTips")
	};

	const state = {
		diseases: [],
		medicines: [],
		synonymsById: {},
		lastResults: { diseases: [], medicines: [] },
		highlights: [],
		highlightIndex: 0,
		highlightTimer: null
	};

	function hideTypeahead() {
		if (!els.typeahead) return;
		els.typeahead.style.display = "none";
		els.typeahead.textContent = "";
	}

	function showTypeahead() {
		if (!els.typeahead) return;
		els.typeahead.style.display = "block";
	}

	function navigateToMedicine(medicineName) {
		const url = new URL("gyogyszerek.html", window.location.href);
		if (medicineName) url.searchParams.set("name", medicineName);
		window.location.href = url.toString();
	}

	function navigateToDisease(diseaseName) {
		const url = new URL("betegsegek.html", window.location.href);
		if (diseaseName) url.searchParams.set("q", diseaseName);
		window.location.href = url.toString();
	}

	function navigateToTips() {
		window.location.href = new URL("tanacsok.html", window.location.href).toString();
	}

	function setText(el, value) {
		if (!el) return;
		el.textContent = value;
	}

	function readJson(url) {
		return fetch(url, { cache: "no-store" }).then(r => {
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return r.json();
		});
	}

	function normalizeSynonyms(raw) {
		if (!Array.isArray(raw)) return {};
		const out = {};
		for (const row of raw) {
			if (!row || typeof row.id !== "string") continue;
			const aliases = Array.isArray(row.aliases) ? row.aliases.filter(a => typeof a === "string" && a) : [];
			out[row.id] = aliases;
		}
		return out;
	}

	function extractMedicines(raw) {
		if (Array.isArray(raw)) return raw;
		if (raw && typeof raw === "object" && Array.isArray(raw.gyogyszerek)) return raw.gyogyszerek;
		return [];
	}

	function normalizeMedicine(raw) {
		const packages = Array.isArray(raw?.kiszerelesek) ? raw.kiszerelesek : [];
		const prices = packages.map(p => Number(p?.ar)).filter(n => Number.isFinite(n) && n > 0);
		const minPrice = prices.length ? Math.min(...prices) : 0;
		return {
			name: typeof raw?.nev === "string" ? raw.nev : "",
			disease: typeof raw?.betegseg === "string" ? raw.betegseg : "",
			diseaseIds: Array.isArray(raw?.diseaseIds) ? raw.diseaseIds.filter(Boolean) : [],
			prescriptionOnly: Boolean(raw?.venykoteles),
			minPrice
		};
	}

	function computeStats() {
		const medicineCount = state.medicines.length;
		const rxCount = state.medicines.filter(m => m.prescriptionOnly).length;
		const diseaseCount = state.diseases.length;
		const categories = uniq(state.diseases.map(d => d.category).filter(Boolean));

		setText(els.statMedicines, String(medicineCount || 0));
		setText(els.statRx, `${rxCount || 0}`);
		setText(els.statDiseases, String(diseaseCount || 0));
		setText(els.statCategories, String(categories.length || 0));
	}

	function bestDiseaseMatches(query, maxCount) {
		const q = normalizeText(query);
		if (!q || q.length < 2) return [];

		const scored = [];
		for (const d of state.diseases) {
			const nameNorm = normalizeText(d.name);
			const aliases = Array.isArray(state.synonymsById[d.id]) ? state.synonymsById[d.id] : [];

			let score = Infinity;
			if (nameNorm.includes(q)) score = Math.min(score, nameNorm.indexOf(q));
			for (const a of aliases) {
				const aNorm = normalizeText(a);
				if (!aNorm) continue;
				if (aNorm.includes(q)) score = Math.min(score, 100 + aNorm.indexOf(q));
			}
			if (score !== Infinity) scored.push({ d, score });
		}

		scored.sort((a, b) => a.score - b.score || a.d.name.localeCompare(b.d.name, "hu"));
		return scored.slice(0, maxCount).map(x => x.d);
	}

	function bestMedicineMatches(query, maxCount) {
		const q = normalizeText(query);
		if (!q || q.length < 2) return [];
		const out = [];
		for (const m of state.medicines) {
			const nameNorm = normalizeText(m.name);
			if (!nameNorm) continue;
			if (!nameNorm.includes(q)) continue;
			out.push({ m, score: nameNorm.indexOf(q) });
		}
		out.sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name, "hu"));
		return out.slice(0, maxCount).map(x => x.m);
	}

	function renderTypeahead(query) {
		if (!els.typeahead) return;

		const diseases = bestDiseaseMatches(query, 4);
		const medicines = bestMedicineMatches(query, 4);
		state.lastResults = { diseases, medicines };

		els.typeahead.textContent = "";
		if (!diseases.length && !medicines.length) {
			hideTypeahead();
			return;
		}

		function addHeader(text) {
			const header = document.createElement("div");
			header.className = "home-typeahead-header";
			header.textContent = text;
			els.typeahead.appendChild(header);
		}

		function addItem(label, meta, onclick) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "home-typeahead-item";
			btn.setAttribute("role", "option");
			btn.textContent = label;
			if (meta) {
				const span = document.createElement("span");
				span.className = "home-typeahead-meta";
				span.textContent = meta;
				btn.appendChild(span);
			}
			btn.addEventListener("click", onclick);
			els.typeahead.appendChild(btn);
		}

		if (medicines.length) {
			addHeader("Gyógyszerek");
			for (const m of medicines) {
				addItem(m.name, m.disease ? `Javasolt: ${m.disease}` : "", () => navigateToMedicine(m.name));
			}
		}

		if (diseases.length) {
			addHeader("Betegségek");
			for (const d of diseases) {
				addItem(d.name, d.category ? d.category : "", () => navigateToDisease(d.name));
			}
		}

		showTypeahead();
	}

	function wireSearch() {
		if (!els.homeSearch) return;

		els.homeSearch.addEventListener("input", () => {
			renderTypeahead(els.homeSearch.value);
		});

		els.homeSearch.addEventListener("focus", () => {
			renderTypeahead(els.homeSearch.value);
		});

		document.addEventListener("click", (e) => {
			if (!els.typeahead || !els.homeSearch) return;
			if (els.typeahead.contains(e.target)) return;
			if (els.homeSearch.contains(e.target)) return;
			hideTypeahead();
		});

		els.homeSearch.addEventListener("keydown", (e) => {
			if (e.key !== "Enter") return;
			e.preventDefault();
			openBestMatch();
		});

		if (els.homeSearchGo) {
			els.homeSearchGo.addEventListener("click", () => openBestMatch());
		}
	}

	function openBestMatch() {
		const q = els.homeSearch ? els.homeSearch.value.trim() : "";
		const diseases = state.lastResults.diseases || [];
		const medicines = state.lastResults.medicines || [];

		if (medicines.length) {
			navigateToMedicine(medicines[0].name);
			return;
		}
		if (diseases.length) {
			navigateToDisease(diseases[0].name);
			return;
		}
		if (q) {
			navigateToDisease(q);
			return;
		}
		navigateToMedicine("");
	}

	function wireStartFlow() {
		if (els.startMedicines) els.startMedicines.addEventListener("click", () => navigateToMedicine(""));
		if (els.startDiseases) els.startDiseases.addEventListener("click", () => navigateToDisease(""));
		if (els.startTips) els.startTips.addEventListener("click", () => navigateToTips());
	}

	function buildHighlights() {
		const categories = uniq(state.diseases.map(d => d.category).filter(Boolean));
		const randomCategory = categories.length ? categories[Math.floor(Math.random() * categories.length)] : "";
		const randomDisease = state.diseases.length ? state.diseases[Math.floor(Math.random() * state.diseases.length)] : null;
		const cheapest = state.medicines
			.filter(m => Number.isFinite(m.minPrice) && m.minPrice > 0)
			.sort((a, b) => a.minPrice - b.minPrice)[0];

		const tips = [
			"Enyhébb panaszoknál: folyadék + pihenés.",
			"Ha romlik vagy szokatlan: kérjen szakmai segítséget.",
			"Tüneteknél segíthet a naplózás (mikor, mennyi, mi váltja ki)."
		];
		const tip = tips[Math.floor(Math.random() * tips.length)];

		state.highlights = [
			{ title: "Tipp a napra", main: tip, sub: "" },
			randomDisease ? { title: "Kiemelt betegség", main: randomDisease.name, sub: randomDisease.category ? `Kategória: ${randomDisease.category}` : "" } : null,
			randomCategory ? { title: "Kiemelt kategória", main: randomCategory, sub: "Betegségek oldalon böngészhető." } : null,
			cheapest ? { title: "Kiemelt készítmény", main: cheapest.name, sub: cheapest.disease ? `Javasolt: ${cheapest.disease}` : "" } : null
		].filter(Boolean);
		state.highlightIndex = 0;
	}

	function renderHighlight() {
		if (!state.highlights.length) return;
		const h = state.highlights[state.highlightIndex % state.highlights.length];
		setText(els.highlightMain, h.main || "–");
		setText(els.highlightSub, h.sub || "");
	}

	function startHighlightRotation() {
		if (state.highlightTimer) {
			clearInterval(state.highlightTimer);
			state.highlightTimer = null;
		}
		renderHighlight();
		state.highlightTimer = setInterval(() => {
			state.highlightIndex = (state.highlightIndex + 1) % Math.max(1, state.highlights.length);
			renderHighlight();
		}, 6500);
	}

	Promise.all([
		readJson("betegsegek.json").catch(() => []),
		readJson("gyogyszertar.json").catch(() => []),
		readJson("synonyms.json").catch(() => ([]))
	])
		.then(([diseasesRaw, medicinesRaw, synonymsRaw]) => {
			state.diseases = Array.isArray(diseasesRaw) ? diseasesRaw : [];
			state.medicines = extractMedicines(medicinesRaw).map(normalizeMedicine).filter(m => m.name);
			state.synonymsById = normalizeSynonyms(synonymsRaw);

			computeStats();
			wireSearch();
			wireStartFlow();
			buildHighlights();
			startHighlightRotation();
		})
		.catch(() => {
			wireSearch();
			wireStartFlow();
			setText(els.highlightMain, "A kiemelések nem elérhetők.");
			setText(els.highlightSub, "" );
		});
});
