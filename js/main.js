document.addEventListener("DOMContentLoaded", async function () {
	const buttons = document.querySelectorAll(".category-btn, .tag-btn");
	const infoText = document.querySelector(".info__text");
	const midColumn = document.querySelector(".mid-column");
	const prevButton = document.querySelector(".info__prev");
	const nextButton = document.querySelector(".info__next");
	let currentIndex = 0;
	let items = [];
	let currentFilter = '';
	let currentAudio = null;
	const audioCache = {};
	let resultArray = [];
	let orderArrays = {};

	midColumn.style.display = "none";

	buttons.forEach(button => button.addEventListener("click", () => handleButtonClick(button)));

	prevButton.addEventListener("click", handlePrevButtonClick);
	nextButton.addEventListener("click", handleNextButtonClick);

	function handleButtonClick(button) {
			stopAndResetAudio();
			infoText.innerHTML = "";
			appearSmoothly();
			items = filterItems(button);
			updateButtonsDisplay();
			if (items.length > 0) {
					currentIndex = 0;
					appendItem();
					midColumn.style.display = "flex";
			}
	}

	function handlePrevButtonClick() {
			stopAndResetAudio();
			if (items.length > 0) {
					if (currentIndex > 0) {
							currentIndex--;
					} else if (currentFilter === 'tag') {
							return false;
					} else {
							currentIndex = items.length - 1;
					}
					infoText.innerHTML = "";
					appendItem();
			}
	}

	function handleNextButtonClick() {
			stopAndResetAudio();
			if (items.length > 0) {
					if (currentIndex < items.length - 1) {
							currentIndex++;
					} else if (currentFilter === 'tag') {
							return false;
					} else {
							currentIndex = 0;
					}
					infoText.innerHTML = "";
					appendItem();
			}
	}

	function filterItems(button) {
			currentFilter = button.classList.contains('category-btn') ? 'category' : 'tag';
			const clickedButtonId = button.id;
			const dataKey = currentFilter;
			let filteredItems = Array.from(document.querySelectorAll(`[data-${dataKey}]`)).filter(item => {
					const tags = item.getAttribute(`data-${dataKey}`).split(' ');
					return tags.includes(clickedButtonId);
			});
			if (currentFilter === 'tag') {
					filteredItems = orderTags(clickedButtonId, filteredItems);
			}
			return filteredItems;
	}

	function orderTags(clickedButtonId, items) {
			const orderArray = orderArrays[clickedButtonId];
			if (orderArray) {
					const wordsArray = orderArray.join(' ').split(', ').map(word => word.trim());
					items = wordsArray.map(value => {
							const item = items.find(item => item.getAttribute('data-tag-id') === value);
							return item;
					}).filter(item => item !== undefined);
			}
			console.log(orderArray);
			return items;
	}

	function appendItem() {
			const selectedItem = items[currentIndex].cloneNode(true);
			const id = selectedItem.getAttribute('id');
			selectedItem.querySelectorAll('p').forEach(p => p.style.display = 'block');
			if (items.length > 0) {
					const soundButton = createSoundButton(id);
					selectedItem.appendChild(soundButton);
			}
			infoText.appendChild(selectedItem);
	}

	function createSoundButton(id) {
			const soundButton = document.createElement('button');
			soundButton.className = 'info__sound';
			soundButton.textContent = 'Play';
			soundButton.onclick = () => handleSoundButtonClick(id, soundButton);
			return soundButton;
	}

	function handleSoundButtonClick(id, soundButton) {
			const soundFile = `sounds/${id}.mp3`;
			if (audioCache[soundFile]) {
					currentAudio = audioCache[soundFile];
			} else {
					currentAudio = new Audio(soundFile);
					audioCache[soundFile] = currentAudio;
			}
			currentAudio.onerror = () => console.log("No corresponding file");
			if (currentAudio.paused) {
					currentAudio.play().then(() => soundButton.textContent = 'Pause').catch(error => console.error("Error playing sound:", error));
			} else {
					currentAudio.pause();
					soundButton.textContent = 'Play';
			}
			currentAudio.onended = () => soundButton.textContent = 'Play';
	}

	function stopAndResetAudio() {
			if (currentAudio) {
					currentAudio.pause();
					currentAudio.currentTime = 0;
					currentAudio = null;
			}
	}

	function appearSmoothly() {
			if (items.length > 0) {
					midColumn.style.display = "flex";
					midColumn.scrollIntoView({ behavior: 'smooth' });
			}
	}

	function updateButtonsDisplay() {
			const buttonsDisplay = items.length > 1 ? 'block' : 'none';
			prevButton.style.display = buttonsDisplay;
			nextButton.style.display = buttonsDisplay;
			if (items.length === 0) {
					prevButton.style.display = 'none';
					nextButton.style.display = 'none';
			}
	}


	async function excelToJson() {
		try {
				const response = await fetch('./texts_fin.xlsx');
				const arrayBuffer = await response.arrayBuffer();
				const data = new Uint8Array(arrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
		} catch (error) {
				console.error("Error loading Excel file:", error);
		}
	}

	async function fetchTags() {
		try {
				const response = await fetch('./stich_finale.txt');
				const text = await response.text();
				const lines = text.split('\n');
				const arrayMap = new Map();
				lines.forEach(line => {
						const words = line.trim().split(' ');
						let arrayName;
						let arrayContent;
						if (words.length === 2) {
								arrayName = words[0].toLowerCase();
								arrayContent = words[1];
						} else if (words.length > 2 && !words[0].includes(',') && !words[1].includes(',')) {
								arrayName = `${words[0].toLowerCase()}-${words[1].toLowerCase()}`;
								arrayContent = words.slice(2).join(' ');
						} else {
								arrayName = words[0].toLowerCase();
								arrayContent = words.slice(1).join(' ');
						}
						if (!arrayMap.has(arrayName)) {
								arrayMap.set(arrayName, []);
						}
						arrayMap.get(arrayName).push(arrayContent);
				});
				resultArray = Array.from(arrayMap, ([name, content]) => ({ name, content }));
				resultArray.forEach(item => {
						orderArrays[item.name] = item.content;
				});
		} catch (error) {
				console.error("Error fetching tags:", error);
		}
	}

	async function initialize() {
		const jsonData = await excelToJson();
		const itemsContainer = document.getElementById('items');
		jsonData.forEach(row => {
				const li = document.createElement('li');
				li.id = row[2];
				li.setAttribute('data-category', row[1]);
				li.setAttribute('data-tag-id', row[2]);
				let content = '';
				for (let i = 3; i < row.length; i++) {
						content += row[i] !== undefined ? `<p class="text-content">${row[i]}</p>` : '<p class="undefined"></p>';
				}
				li.innerHTML = content;
				itemsContainer.appendChild(li);
		});
		await fetchTags();
		resultArray.forEach(tag => {
				const ids = tag.content[0].split(', ');
				ids.forEach(id => {
						const item = document.querySelector(`[data-tag-id="${id}"]`);
						if (item) {
								let existingTags = item.getAttribute('data-tag') || '';
								existingTags += existingTags ? ` ${tag.name}` : tag.name;
								item.setAttribute('data-tag', existingTags);
						}
				});
		});
	}

await initialize();
});