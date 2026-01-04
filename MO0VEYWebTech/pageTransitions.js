(function () {
	function isSamePageHashLink(anchor) {
		try {
			var href = anchor.getAttribute("href") || "";
			if (!href || href === "#") return true;
			if (!href.startsWith("#")) return false;
			return true;
		} catch (e) {
			return false;
		}
	}

	function shouldIgnore(anchor, event) {
		if (!anchor) return true;
		if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return true;

		var href = anchor.getAttribute("href") || "";
		if (!href) return true;
		if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;
		if (anchor.getAttribute("target") === "_blank") return true;
		if (anchor.hasAttribute("download")) return true;
		if (isSamePageHashLink(anchor)) return true;

		return false;
	}

	function isInternalHtmlNavigation(url) {
		try {
			if (url.origin !== window.location.origin) return false;
			var path = url.pathname.toLowerCase();
			if (!path.endsWith(".html")) return false;
			if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
			return true;
		} catch (e) {
			return false;
		}
	}

	document.addEventListener("click", function (e) {
		var anchor = e.target && e.target.closest ? e.target.closest("a") : null;
		if (shouldIgnore(anchor, e)) return;

		var href = anchor.getAttribute("href") || "";
		var url;
		try {
			url = new URL(href, window.location.href);
		} catch (err) {
			return;
		}

		if (!isInternalHtmlNavigation(url)) return;

		e.preventDefault();
		if (!document.body) {
			window.location.href = url.toString();
			return;
		}

		document.body.classList.add("page-leave");
		window.setTimeout(function () {
			window.location.href = url.toString();
		}, 170);
	});

	window.addEventListener("pageshow", function () {
		if (document.body) document.body.classList.remove("page-leave");
	});
})();
