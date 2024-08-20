document.addEventListener("DOMContentLoaded", function () {
	const buttons = document.querySelectorAll(".category-btn, .tag-btn");
	const infoText = document.querySelector(".info__text");
	const soundButton = document.querySelector(".info__sound"); 
	let currentIndex = 0;
	let items = [];
	let currentFilter = '';
	let currentAudio = null; 
	soundButton.style.display = "none"; 
	soundButton.textContent = "Play"; 
	buttons.forEach(function (button) {
			button.addEventListener("click", function () {
					if (currentAudio) {
							currentAudio.pause();
							currentAudio.currentTime = 0; 
							currentAudio = null; 
							soundButton.textContent = "Play"; 
					}
					infoText.innerHTML = "";
					midColumn.style.display = "none"; 
					currentIndex = 0; 
					if (button.classList.contains('category-btn')) {
							currentFilter = 'category';
					} else {
							currentFilter = 'tag';
					}
					const clickedButtonId = button.id;
					const dataKey = button.classList.contains('category-btn') ? 'category' : 'tag';
					items = Array.from(document.querySelectorAll(`[data-${dataKey}="${clickedButtonId}"]`));
					
					if (items.length === 0) {
							soundButton.style.display = "none"; 
							return; 
					}
					infoText.innerHTML = "";
					let buttonsDisplay = items.length > 1 ? 'block' : 'none';
					currentFilter === 'category' ? currentIndex = Math.floor(Math.random() * items.length) : currentIndex = 0;
					appendItem();
			});
	});

	function appendItem() {
			const selectedItem = items[currentIndex].cloneNode(true);
			const id = selectedItem.getAttribute('id');
			const ps = selectedItem.querySelectorAll('p');
			for (const p of ps) {
					p.style.display = 'none';
			}
			const audioFormats = ['mp3', 'wav', 'ogg', 'aac']; 
			let audioFileFound = false;
			audioFormats.forEach(format => {
					const soundFile = `sounds/${id}.${format}`;
					const audio = new Audio(soundFile);
					audio.oncanplaythrough = function() {
							soundButton.style.display = "block"; 
							soundButton.onclick = function () {
									if (currentAudio && currentAudio.src === audio.src) {
											
											if (currentAudio.paused) {
													currentAudio.play(); 
													soundButton.textContent = "Pause";
											} else { currentAudio.pause(); soundButton.textContent = "Play";  }
									} else {
											if (currentAudio) {
													currentAudio.pause();  currentAudio.currentTime = 0;  soundButton.textContent = "Play"; 
											}
											currentAudio = audio; 
											currentAudio.play().then(() => {
													soundButton.textContent = "Pause"; 
											}).catch(error => {
													console.error("Error playing sound:", error);
											});
											currentAudio.onended = function() { soundButton.textContent = "Play"; };
									}
							};
							audioFileFound = true; 
					};
					audio.onerror = function() {
							if (!audioFileFound) {
									soundButton.style.display = "none"; 
							}
					};
			});
			if (!audioFileFound) {
					soundButton.style.display = "none"; 
			}
	}
});
