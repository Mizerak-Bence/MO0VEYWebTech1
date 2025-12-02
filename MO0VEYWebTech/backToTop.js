document.addEventListener('DOMContentLoaded', function () {
	let backToTopBtn = document.getElementById('backToTop');

	if (!backToTopBtn) {
		backToTopBtn = document.createElement('button');
		backToTopBtn.id = 'backToTop';
		backToTopBtn.type = 'button';
		backToTopBtn.setAttribute('aria-label', 'Vissza az oldal tetejére');
		backToTopBtn.textContent = '↑';
		document.body.appendChild(backToTopBtn);
	}

	backToTopBtn.style.display = 'none';

	window.addEventListener('scroll', function () {
		if (window.scrollY > 200) {
			backToTopBtn.style.display = 'block';
		} else {
			backToTopBtn.style.display = 'none';
		}
	});

	backToTopBtn.addEventListener('click', function () {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
});
