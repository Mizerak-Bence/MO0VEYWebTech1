

(() => {
	'use strict';

	const GLOSSARY = [
		{
			key: 'venykoteles',
			terms: ['vényköteles', 'vény', 'recept', 'receptköteles'],
			title: 'Vényköteles',
			body:
				'Olyan gyógyszer, amit a gyógyszertár jellemzően csak orvosi recept alapján ad ki. Ha bizonytalan, kérdezze meg a gyógyszerészt.',
			links: [{ label: 'Gyógyszerek', href: 'gyogyszerek.html' }]
		},
		{
			key: 'adagolas',
			terms: ['adagolás', 'adag', 'dózis'],
			title: 'Adagolás',
			body:
				'Az ajánlott mennyiség és gyakoriság. Mindig olvassa el a betegtájékoztatót, és tartsa be a javasolt maximumot.',
			links: [{ label: 'Tanácsok', href: 'tanacsok.html' }]
		},
		{
			key: 'mellekhatas',
			terms: ['mellékhatás', 'mellékhatások', 'nemkívánatos hatás'],
			title: 'Mellékhatás',
			body:
				'Nem várt tünet vagy reakció, ami a gyógyszer szedése során jelentkezhet. Új vagy erős panasz esetén kérjen szakmai tanácsot.',
			links: [{ label: 'Gyógyszerek', href: 'gyogyszerek.html' }]
		},
		{
			key: 'hatoanyag',
			terms: ['hatóanyag', 'hatóanyaga'],
			title: 'Hatóanyag',
			body:
				'A készítmény „fő összetevője”, amely a kívánt hatást kiváltja. Különböző márkák tartalmazhatnak azonos hatóanyagot.',
			links: [{ label: 'Gyógyszerek', href: 'gyogyszerek.html' }]
		},
		{
			key: 'ellenjavallat',
			terms: ['ellenjavallat', 'ellenjavallatok'],
			title: 'Ellenjavallat',
			body:
				'Olyan állapot vagy helyzet, amikor egy gyógyszer szedése nem javasolt. Ilyenkor érdemes alternatívát keresni szakemberrel.',
			links: [{ label: 'Tanácsok', href: 'tanacsok.html' }]
		},
		{
			key: 'interakcio',
			terms: ['interakció', 'kölcsönhatás', 'gyógyszerkölcsönhatás'],
			title: 'Gyógyszerkölcsönhatás',
			body:
				'Két (vagy több) gyógyszer együtt szedve megváltoztathatja egymás hatását. Több készítmény esetén kérjen gyógyszerészi tanácsot.',
			links: [{ label: 'Rendelés', href: 'Rendeles.html' }]
		},
		{
			key: 'reflux',
			terms: ['reflux', 'gyomorégés'],
			title: 'Reflux / gyomorégés',
			body:
				'Gyakori panasz, amikor a gyomorsav visszaáramlik és égő érzést okoz. Életmódbeli lépések és célzott készítmények is segíthetnek.',
			links: [{ label: 'Betegségek (Reflux)', href: 'betegsegek.html?focus=reflux' }]
		},
		{
			key: 'laz',
			terms: ['láz', 'hőemelkedés'],
			title: 'Láz',
			body:
				'Emelkedett testhőmérséklet. Fontos a folyadékpótlás, pihenés, és a tünetek/állapot romlásának figyelése.',
			links: [{ label: 'Betegségek (Láz)', href: 'betegsegek.html?focus=láz' }]
		},
		{
			key: 'allergia',
			terms: ['allergia', 'allergiás'],
			title: 'Allergia',
			body:
				'Túlzott immunreakció (pl. pollen, étel, gyógyszer). Duzzanat, nehézlégzés vagy gyors romlás esetén kérjen azonnal segítséget.',
			links: [{ label: 'Betegségek (Allergia)', href: 'betegsegek.html?focus=allergia' }]
		}
	];

	const MAX_OCCURRENCES_PER_TERM = 6;

	function escapeRegExp(value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function buildTermIndex() {
		const termToEntry = new Map();
		for (const entry of GLOSSARY) {
			for (const t of entry.terms) {
				termToEntry.set(t.toLowerCase(), {
					key: entry.key,
					title: entry.title,
					body: entry.body,
					links: entry.links || []
				});
			}
		}
		return termToEntry;
	}

	function buildRegex(terms) {
		const sorted = [...terms].sort((a, b) => b.length - a.length);
		const pattern = sorted.map(escapeRegExp).join('|');
		return new RegExp(`(^|[^A-Za-z0-9ÁÉÍÓÖŐÚÜŰáéíóöőúüű_])(${pattern})(?![A-Za-z0-9ÁÉÍÓÖŐÚÜŰáéíóöőúüű_])`, 'gi');
	}

	function shouldSkipElement(element) {
		if (!element) return true;
		const tag = element.tagName;
		if (!tag) return true;
		const blocked = new Set([
			'SCRIPT',
			'STYLE',
			'TEXTAREA',
			'INPUT',
			'SELECT',
			'OPTION',
			'BUTTON',
			'A',
			'CODE',
			'PRE'
		]);
		if (blocked.has(tag)) return true;
		if (element.closest && element.closest('[data-glossary="off"]')) return true;
		return false;
	}

	function createPopover() {
		let popover = document.getElementById('glossaryPopover');
		if (popover) return popover;

		popover = document.createElement('div');
		popover.id = 'glossaryPopover';
		popover.className = 'glossary-popover';
		popover.setAttribute('role', 'dialog');
		popover.setAttribute('aria-modal', 'false');
		popover.setAttribute('aria-hidden', 'true');

		popover.innerHTML = `
			<div class="glossary-popover-header">
				<div class="glossary-popover-title" id="glossaryPopoverTitle">–</div>
				<button class="glossary-popover-close" type="button" aria-label="Bezárás">×</button>
			</div>
			<div class="glossary-popover-body" id="glossaryPopoverBody"></div>
			<div class="glossary-popover-links" id="glossaryPopoverLinks"></div>
		`;

		document.body.appendChild(popover);

		popover.querySelector('.glossary-popover-close')?.addEventListener('click', () => {
			hidePopover();
		});

		return popover;
	}

	let activeTrigger = null;
	let activeEntryKey = null;
	let popoverRepositionRaf = 0;

	function isPopoverOpen() {
		const popover = document.getElementById('glossaryPopover');
		return !!popover && popover.getAttribute('aria-hidden') === 'false';
	}

	function hidePopover() {
		const popover = document.getElementById('glossaryPopover');
		if (!popover) return;
		popover.setAttribute('aria-hidden', 'true');
		popover.style.display = 'none';
		activeEntryKey = null;
		const toFocus = activeTrigger;
		activeTrigger = null;
		if (toFocus && typeof toFocus.focus === 'function') {
			toFocus.focus();
		}
	}

	function setPopoverContent(entry) {
		const title = document.getElementById('glossaryPopoverTitle');
		const body = document.getElementById('glossaryPopoverBody');
		const links = document.getElementById('glossaryPopoverLinks');

		if (title) title.textContent = entry.title;
		if (body) body.textContent = entry.body;
		if (links) {
			links.innerHTML = '';
			for (const link of entry.links || []) {
				const a = document.createElement('a');
				a.href = link.href;
				a.textContent = link.label;
				a.className = 'glossary-popover-link';
				links.appendChild(a);
			}
		}
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function positionPopover(triggerEl) {
		const popover = createPopover();
		if (!triggerEl) return;

		popover.style.display = 'block';
		popover.style.left = '0px';
		popover.style.top = '0px';

		const margin = 12;
		const rect = triggerEl.getBoundingClientRect();
		const popRect = popover.getBoundingClientRect();

		const preferredTop = rect.bottom + 10;
		const preferredLeft = rect.left;

		let top = preferredTop;
		if (top + popRect.height + margin > window.innerHeight) {
			top = rect.top - popRect.height - 10;
		}

		let left = preferredLeft;
		left = clamp(left, margin, window.innerWidth - popRect.width - margin);
		top = clamp(top, margin, window.innerHeight - popRect.height - margin);

		popover.style.left = `${Math.round(left)}px`;
		popover.style.top = `${Math.round(top)}px`;
	}

	function scheduleReposition() {
		if (!activeTrigger) return;
		if (popoverRepositionRaf) return;
		popoverRepositionRaf = requestAnimationFrame(() => {
			popoverRepositionRaf = 0;
			positionPopover(activeTrigger);
		});
	}

	function showPopover(triggerEl, entry) {
		const popover = createPopover();
		activeTrigger = triggerEl;
		activeEntryKey = entry.key;

		setPopoverContent(entry);
		popover.setAttribute('aria-hidden', 'false');
		positionPopover(triggerEl);

		scheduleReposition();
	}

	function togglePopover(triggerEl, entry) {
		if (isPopoverOpen() && activeEntryKey === entry.key && activeTrigger === triggerEl) {
			hidePopover();
			return;
		}
		showPopover(triggerEl, entry);
	}

	function wrapMatchesInTextNode(textNode, regex, termToEntry, countsByKey) {
		const text = textNode.nodeValue;
		if (!text) return;

		regex.lastIndex = 0;
		let match;
		let lastIndex = 0;
		let didReplace = false;
		const fragment = document.createDocumentFragment();

		while ((match = regex.exec(text))) {
			const leading = match[1] || '';
			const term = match[2] || '';
			const termLower = term.toLowerCase();

			const entry = termToEntry.get(termLower);
			if (!entry) continue;

			const count = countsByKey.get(entry.key) || 0;
			if (count >= MAX_OCCURRENCES_PER_TERM) continue;

			const matchStart = match.index;
			const leadingLen = leading.length;
			const termStart = matchStart + leadingLen;
			const termEnd = termStart + term.length;

			if (termStart > lastIndex) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex, termStart)));
			}

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'glossary-term';
			btn.setAttribute('data-glossary-key', entry.key);
			btn.setAttribute('aria-haspopup', 'dialog');
			btn.textContent = term;

			fragment.appendChild(btn);

			countsByKey.set(entry.key, count + 1);
			lastIndex = termEnd;
			didReplace = true;
		}

		if (!didReplace) return;

		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
		}

		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	function enhanceGlossary() {
		const main = document.querySelector('main');
		if (!main) return;

		const termToEntry = buildTermIndex();
		const terms = [...termToEntry.keys()];
		if (!terms.length) return;

		const regex = buildRegex(terms);
		const countsByKey = new Map();

		const walker = document.createTreeWalker(
			main,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode(node) {
					const parent = node.parentElement;
					if (!parent) return NodeFilter.FILTER_REJECT;
					if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;

					const value = node.nodeValue || '';
					if (!value.trim()) return NodeFilter.FILTER_REJECT;

					const lower = value.toLowerCase();
					let hit = false;
					for (const t of terms) {
						if (lower.includes(t)) {
							hit = true;
							break;
						}
					}
					return hit ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
				}
			},
			false
		);

		const nodes = [];
		let current;
		while ((current = walker.nextNode())) nodes.push(current);

		for (const node of nodes) {
			wrapMatchesInTextNode(node, regex, termToEntry, countsByKey);
		}

		main.addEventListener('click', (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			const btn = target.closest('.glossary-term');
			if (!btn) return;

			const key = btn.getAttribute('data-glossary-key');
			if (!key) return;
			const entry = GLOSSARY.find((e) => e.key === key);
			if (!entry) return;

			togglePopover(btn, entry);
		});

		main.addEventListener('keydown', (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			if (!target.classList.contains('glossary-term')) return;

			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				const key = target.getAttribute('data-glossary-key');
				const entry = GLOSSARY.find((e) => e.key === key);
				if (entry) togglePopover(target, entry);
			}
		});

		document.addEventListener('click', (event) => {
			if (!isPopoverOpen()) return;
			const popover = document.getElementById('glossaryPopover');
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (popover && popover.contains(target)) return;
			if (activeTrigger && activeTrigger.contains && activeTrigger.contains(target)) return;
			hidePopover();
		});

		document.addEventListener('keydown', (event) => {
			if (event.key !== 'Escape') return;
			if (!isPopoverOpen()) return;
			event.preventDefault();
			hidePopover();
		});

		window.addEventListener('resize', scheduleReposition, { passive: true });
		window.addEventListener('scroll', scheduleReposition, { passive: true, capture: true });
		window.addEventListener('pageshow', () => {
			hidePopover();
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', enhanceGlossary);
	} else {
		enhanceGlossary();
	}
})();
