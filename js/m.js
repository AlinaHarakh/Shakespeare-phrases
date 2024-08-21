document.addEventListener("DOMContentLoaded", function () {
	const buttons = document.querySelectorAll(".category-btn, .tag-btn");
	const infoText = document.querySelector(".info__text");
	const midColumn = document.querySelector(".mid-column");
	const prevButton = document.querySelector(".info__prev");
	const nextButton = document.querySelector(".info__next");
	let currentIndex = 0;
	let items = [];
	let currentFilter = '';
	let currentAudio = null; // Переменная для текущего аудио
	const audioCache = {}; // Кэш для аудиофайлов
	midColumn.style.display = "none";

	buttons.forEach(function (button) {
			button.addEventListener("click", function () {
					stopAndResetAudio(); // Остановка аудио при нажатии на другую кнопку
					infoText.innerHTML = "";
					if (items.length > 0) {
							midColumn.style.display = "flex";
							midColumn.scrollIntoView({ behavior: 'smooth' });
					}
					currentFilter = button.classList.contains('category-btn') ? 'category' : 'tag';
					const clickedButtonId = button.id;
					const dataKey = button.classList.contains('category-btn') ? 'category' : 'tag';
					items = Array.from(document.querySelectorAll(`[data-${dataKey}="${clickedButtonId}"]`));
					infoText.innerHTML = "";
					let buttonsDisplay = items.length > 1 ? 'block' : 'none';
					prevButton.style.display = buttonsDisplay;
					nextButton.style.display = buttonsDisplay;

					// Если нет элементов, скрываем кнопки и выходим
					if (items.length === 0) {
							prevButton.style.display = 'none';
							nextButton.style.display = 'none';
							return;
					}

					if (items.length > 0) {
							currentFilter === 'category' ? currentIndex = Math.floor(Math.random() * items.length) : currentIndex = 0;
							appendItem();
							midColumn.style.display = "flex";
					}
			});
	});

	prevButton.addEventListener("click", function () {
			stopAndResetAudio(); // Остановка аудио при нажатии на кнопку "Предыдущий"
			if (items.length > 0 && currentIndex > 0) {
					currentIndex--;
			} else if (currentFilter === 'tag' && currentIndex == 0) {
					return false;
			} else if (items.length > 0) {
					currentIndex = items.length - 1;
			}
			infoText.innerHTML = "";
			appendItem();
	});

	nextButton.addEventListener("click", function () {
			stopAndResetAudio(); // Остановка аудио при нажатии на кнопку "Следующий"
			if (items.length > 0 && currentIndex < items.length - 1) {
					currentIndex++;
			} else if (currentFilter === 'tag' && currentIndex === items.length - 1) {
					return false;
			} else if (items.length > 0) {
					currentIndex = 0;
			}
			infoText.innerHTML = "";
			appendItem();
	});

	const imagesCache = {};
	
	function appendItem() {
			const selectedItem = items[currentIndex].cloneNode(true);
			const id = selectedItem.getAttribute('id');
			const ps = selectedItem.querySelectorAll('p');
			for (const p of ps) {
					p.style.display = 'none';
			}

			// Создаем кнопку для воспроизведения звука
			const soundButton = document.createElement('button');
			soundButton.className = 'info__sound';
			soundButton.textContent = 'Play';
			selectedItem.appendChild(soundButton);

			soundButton.onclick = function () {
					const soundFile = `sounds/${id}.wav`; // Путь к аудиофайлу

					if (audioCache[soundFile]) {
							// Если аудиофайл уже в кэше
							currentAudio = audioCache[soundFile];
					} else {
							// Если это новый аудиофайл, создаем новый объект Audio и кэшируем его
							currentAudio = new Audio(soundFile);
							audioCache[soundFile] = currentAudio; // Сохраняем в кэше
					}

					if (currentAudio.paused) {
							currentAudio.play();
							soundButton.textContent = 'Pause'; // Меняем текст на "Pause"
					} else {
							currentAudio.pause();
							soundButton.textContent = 'Play'; // Меняем текст на "Play"
					}

					currentAudio.onended = function () {
							soundButton.textContent = 'Play'; // Меняем текст кнопки на "Play" при завершении
					};
			};

			if (!imagesCache[id]) {
					const img = new Image();
					img.src = `images/${id}.png`;
					img.classList.add('img-content');
					img.style.display = 'none';
					img.onload = () => {
							img.style.display = 'block';
							imagesCache[id] = img;
					};
					img.onerror = () => {
							const imgJPG = new Image();
							imgJPG.src = `images/${id}.jpg`;
							imgJPG.classList.add('img-content');
							imgJPG.style.display = 'none';
							imgJPG.onload = () => {
									imgJPG.style.display = 'block';
									imagesCache[id] = imgJPG;
							};
							imgJPG.onerror = () => {
									for (const p of ps) {
											p.style.display = 'block';
									}
							};
							selectedItem.appendChild(imgJPG);
					};
					selectedItem.appendChild(img);
			} else {
					selectedItem.appendChild(imagesCache[id]);
			}

			infoText.appendChild(selectedItem);
	}

	function stopAndResetAudio() {
			if (currentAudio) {
					currentAudio.pause(); // Остановить аудио
					currentAudio.currentTime = 0; // Сбросить аудио
					currentAudio = null; // Сбросить текущий аудио
			}
	}
});

(function () {
	function excelToJson() {
			return new Promise((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open('GET', './texts_fin.xlsx', true);
					xhr.responseType = 'arraybuffer';
					xhr.onload = function (e) {
							const data = new Uint8Array(xhr.response);
							const workbook = XLSX.read(data, { type: 'array' });
							const worksheet = workbook.Sheets[workbook.SheetNames[0]];
							const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
							resolve(json);
					};
					xhr.onerror = function (e) {
							reject(e);
					};
					xhr.send();
			});
	}

	excelToJson().then((jsonData) => {
			const items = document.getElementById('items');
			jsonData.forEach((row) => {
					const li = document.createElement('li');
					li.id = row[0];
					li.setAttribute('data-category', row[1]);
					let content = '';
					for (let i = 2; i < row.length; i++) {
							content += `<p class="text-content">${row[i]}</p>`;
					}
					li.innerHTML = content;
					items.appendChild(li);
			});
			return fetchTags();
	}).then(tags => {
			for (const tag of tags) {
					const ids = tag.content[0].split(', ');
					for (const id of ids) {
							const item = document.querySelector(`[id="${id}"]`);
							if (item) {
									item.setAttribute('data-tag', tag.name);
							}
					}
			}
	});

	function fetchTags() {
			return new Promise((resolve, reject) => {
					fetch('./stich_finale.txt')
							.then(response => response.text())
							.then(text => {
									const lines = text.split('\n');
									const arrayMap = new Map();
									lines.forEach(line => {
											const words = line.trim().split(' ');
											const arrayName = String(words[0]).toLowerCase();
											const arrayContent = words.slice(1).join(' ');
											if (!arrayMap.has(arrayName)) {
													arrayMap.set(arrayName, []);
											}
											arrayMap.get(arrayName).push(arrayContent);
									});
									const resultArray = Array.from(arrayMap, ([name, content]) => ({ name, content }));
									resolve(resultArray);
							})
							.catch(error => {
									reject(error);
							});
			});
	}
})();