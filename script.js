const frontMatterInput = document.getElementById('front-matter');
const markdownInput = document.getElementById('markdown-input');
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copy-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const loadBtn = document.getElementById('load-btn');
const saveBtn = document.getElementById('save-btn');
const displaySelect = document.getElementById('display-select');

function renderMarkdown() {
    console.log("renderMarkdown chiamata");
    let frontMatter = '';
    let ctaButtons = '';
    try {
        const yamlData = jsyaml.load(frontMatterInput.value);
        if (yamlData && yamlData.it) {
            ctaButtons = generateCTAButtons(yamlData.it);
        }
    } catch (e) {
        console.error('Errore nel parsing del front-matter YAML:', e);
    }
    
    const htmlContent = marked(markdownInput.value);
    document.getElementById('preview-content').innerHTML = htmlContent;
    document.getElementById('preview-buttons').innerHTML = ctaButtons;
}

function generateCTAButtons(data) {
    let buttons = '';
    if (data.cta_1) {
        buttons += `<a href="${data.cta_1.action}" class="io-button">${data.cta_1.text}</a>`;
    }
    if (data.cta_2) {
        buttons += `<a href="${data.cta_2.action}" class="io-button">${data.cta_2.text}</a>`;
    }
    return buttons;
}

frontMatterInput.addEventListener('input', () => {
    console.log("Front-matter input rilevato");
    renderMarkdown();
});

markdownInput.addEventListener('input', () => {
    console.log("Markdown input rilevato");
    renderMarkdown();
});

copyBtn.addEventListener('click', () => {
    console.log("Copia Markdown cliccato");
    const fullContent = `${frontMatterInput.value}\n---\n${markdownInput.value}`;
    navigator.clipboard.writeText(fullContent).then(() => {
        alert('Contenuto copiato nella clipboard!');
    });
});

saveImageBtn.addEventListener('click', () => {
    console.log("Salva Immagine cliccato");
    html2canvas(preview).then(canvas => {
        const link = document.createElement('a');
        link.download = 'preview.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

loadBtn.addEventListener('click', () => {
    console.log("Carica File cliccato");
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const content = event.target.result;
            const [, frontMatter, markdown] = content.match(/^(---\n[\s\S]*?\n---\n)?([\s\S]*)$/);
            frontMatterInput.value = frontMatter ? frontMatter.replace(/^---\n|---\n$/g, '') : '';
            markdownInput.value = markdown.trim();
            renderMarkdown();
        };
        reader.readAsText(file);
    };
    input.click();
});

saveBtn.addEventListener('click', () => {
    console.log("Salva File cliccato");
    const content = `---\n${frontMatterInput.value}\n---\n\n${markdownInput.value}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.download = 'document.md';
    link.href = URL.createObjectURL(blob);
    link.click();
});

displaySelect.addEventListener('change', () => {
    console.log("Display cambiato");
    const selectedDisplay = displaySelect.value;
    const previewFrame = document.getElementById('preview-frame');
    const scaleFactor = 0.5; // Modifica questo valore per adattare la scala

    switch (selectedDisplay) {
        case 'mobile':
            previewFrame.style.width = `${2340 * scaleFactor}px`;
            previewFrame.style.height = `${1080 * scaleFactor}px`;
            break;
        case 'tablet':
            previewFrame.style.width = `${1080 * scaleFactor}px`;
            previewFrame.style.height = `${2340 * scaleFactor}px`;
            break;
    }
});

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    breaks: true,
    highlight: function(code) {
        return `<pre><code>${code}</code></pre>`;
    }
});

const renderer = new marked.Renderer();

renderer.link = (href, title, text) => {
    if (href.startsWith('iohandledlink://')) {
        return `<a href="${href}" class="io-link">${text}</a>`;
    }
    return `<a href="${href}" target="_blank">${text}</a>`;
};

renderer.list = (body, ordered, start) => {
    const type = ordered ? 'ol' : 'ul';
    return `<${type} style="padding-left: 20px;">${body}</${type}>`;
};

renderer.listitem = (text) => {
    return `<li style="margin-bottom: 5px;">${text}</li>`;
};

renderer.heading = (text, level) => {
    const fontSize = 24 - (level * 2);
    return `<h${level} style="font-size: ${fontSize}px; margin-top: 20px; margin-bottom: 10px;">${text}</h${level}>`;
};

marked.use({ renderer });

function validateMarkdown(markdown) {
    const warnings = [];
    
    if (!/^#\s.+/m.test(markdown)) {
        warnings.push("Il documento dovrebbe iniziare con un titolo di primo livello (#).");
    }

    const lines = markdown.split('\n');
    lines.forEach((line, index) => {
        if (line.length > 100) {
            warnings.push(`La riga ${index + 1} supera i 100 caratteri.`);
        }
    });

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
        const [, text, url] = match;
        if (!url.startsWith('https://') && !url.startsWith('iohandledlink://')) {
            warnings.push(`Il link "${text}" non inizia con https:// o iohandledlink://.`);
        }
    }

    return warnings;
}

// Inizializza la visualizzazione mobile come default
displaySelect.value = 'mobile';
displaySelect.dispatchEvent(new Event('change'));

renderMarkdown();

console.log("Script caricato completamente");
