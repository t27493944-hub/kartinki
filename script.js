let generatedImages = [];
let currentImageUrl = '';

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
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Генерация...';

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

    const seed = Math.floor(Math.random() * 100000);
    const fullPrompt = `${prompt}, ${style} style`;
    const encoded = encodeURIComponent(fullPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

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
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Сгенерировать`;
    };

    img.onerror = function () {
        loadingCard.remove();
        alert('Не удалось сгенерировать изображение. Попробуйте ещё раз.');
        btn.disabled = false;
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Сгенерировать`;
    };

    img.src = imageUrl;
}

function openModal(url, prompt) {
    currentImageUrl = url;
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
    fetch(currentImageUrl)
        .then(res => res.blob())
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `imagegen_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        })
        .catch(() => {
            window.open(currentImageUrl, '_blank');
        });
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
