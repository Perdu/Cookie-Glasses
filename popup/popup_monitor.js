function listenForClicks() {
    document.addEventListener("click", (e) => {
	if (e.target.classList.contains("getConsentData")) {
	    fetch_data();
	}
    });
}

listenForClicks();
