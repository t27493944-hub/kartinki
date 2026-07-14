let generatedImages = [];

function getSelectedStyle() {
    const checked = document.querySelector('input[name="style"]:checked');
    return checked ? checked.value : 'realistic';
}

function generateImage() {
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
        alert('Пожалуйста, введите описание изображения');
        return;
    }

    const btn = document.getElementById('generate-btn');
    btn.disabled = true;

    const style = getSelectedStyle();
    const size = document.getElementById('size').value;
    const [w, h] = size.split('x');

    const loadingCard = document.createElement('div');
    loadingCard.className = 'loading-card';
    loadingCard.innerHTML = '<div class="spinner"></div>';
    const grid = document.getElementById('gallery-grid');

    const emptyState = grid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    grid.prepend(loadingCard);

    const seed = Math.floor(Math.random() * 10000);
    const imageUrl = `https://picsum.photos/seed/${seed}/${w}/${h}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        loadingCard.remove();

        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${prompt}">
            <div class="card-info">
                <div class="card-prompt">${escapeHtml(prompt)}</div>
                <div class="card-meta">
                    <span>${style}</span>
                    <span>${size}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openModal(imageUrl, prompt));
        grid.prepend(card);

        generatedImages.unshift({ url: imageUrl, prompt, style, size, date: new Date() });
        updateHistory();

        btn.disabled = false;
    };

    img.onerror = function () {
        loadingCard.remove();
        alert('Не удалось сгенерировать изображение. Попробуйте ещё раз.');
        btn.disabled = false;
    };

    img.src = imageUrl;
}

function openModal(url, prompt) {
    document.getElementById('modal-image').src = url;
    document.getElementById('modal-prompt').textContent = prompt;
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

function downloadImage() {
    const img = document.getElementById('modal-image');
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `imagegen_${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function updateHistory() {
    const historySection = document.getElementById('history');
    const historyList = document.getElementById('history-list');

    if (generatedImages.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    historySection.style.display = 'block';
    historyList.innerHTML = '';

    generatedImages.forEach(function (item) {
        const el = document.createElement('div');
        el.className = 'history-item';
        const dateStr = item.date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        el.innerHTML = `
            <img src="${item.url}" alt="">
            <div class="history-text">
                <div class="history-prompt">${escapeHtml(item.prompt)}</div>
                <div class="history-date">${dateStr} &middot; ${item.style} &middot; ${item.size}</div>
            </div>
        `;
        el.addEventListener('click', () => openModal(item.url, item.prompt));
        historyList.appendChild(el);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('prompt').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateImage();
    }
});
