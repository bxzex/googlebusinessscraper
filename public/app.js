const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const resultsGrid = document.getElementById('resultsGrid');
const statusSection = document.getElementById('status');
const statusMsg = document.getElementById('statusMsg');

let currentData = [];

searchBtn.addEventListener('click', async () => {
    const niche = document.getElementById('niche').value;
    const location = document.getElementById('location').value;
    const limit = document.getElementById('limit').value;

    if (!niche || !location) {
        alert('Please enter both niche and location');
        return;
    }

    resultsGrid.innerHTML = '';
    statusSection.style.display = 'block';
    searchBtn.disabled = true;
    exportBtn.style.display = 'none';

    try {
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ niche, location, limit })
        });

        const result = await response.json();

        if (result.success) {
            currentData = result.data;
            displayResults(currentData);
            if (currentData.length > 0) {
                exportBtn.style.display = 'flex';
            }
        } else {
            console.error(result.error);
            alert('Scraping failed: ' + result.error);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('An error occurred while connecting to the server');
    } finally {
        statusSection.style.display = 'none';
        searchBtn.disabled = false;
    }
});

async function downloadLogo(url, name) {
    if (!url) return;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${name.replace(/\s+/g, '_')}_logo.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        // Redundant fallback if CORS prevents direct download
        window.open(url, '_blank');
    }
}

function displayResults(data) {
    if (data.length === 0) {
        resultsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No results found.</p>';
        return;
    }

    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'business-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const hasWebsite = item.website && item.website !== '';

        let socialHtml = '';
        if (item.socials) {
            socialHtml = `
                <div class="social-links" style="display: flex; gap: 0.75rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--glass-border);">
                    ${item.socials.facebook ? `<a href="${item.socials.facebook}" target="_blank" style="color: #1877F2;"><i class="fab fa-facebook"></i></a>` : ''}
                    ${item.socials.instagram ? `<a href="${item.socials.instagram}" target="_blank" style="color: #E4405F;"><i class="fab fa-instagram"></i></a>` : ''}
                    ${item.socials.linkedin ? `<a href="${item.socials.linkedin}" target="_blank" style="color: #0A66C2;"><i class="fab fa-linkedin"></i></a>` : ''}
                    ${item.socials.twitter ? `<a href="${item.socials.twitter}" target="_blank" style="color: #1DA1F2;"><i class="fab fa-x-twitter"></i></a>` : ''}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="logo-container" style="position: relative; width: 44px; height: 44px;">
                        ${item.logo ? `
                            <img src="${item.logo}" style="width: 100%; height: 100%; border-radius: 10px; object-fit: cover; border: 1px solid var(--glass-border);">
                            <button onclick="downloadLogo('${item.logo}', '${item.name}')" title="Download Logo" style="position: absolute; bottom: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; padding: 0; font-size: 10px; background: var(--accent); color: #000; border: 2px solid var(--bg-dark);">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : '<div style="width: 100%; height: 100%; border-radius: 10px; background: var(--glass-border); display: flex; align-items: center; justify-content: center;"><i class="fas fa-building"></i></div>'}
                    </div>
                    <div>
                        <h3 style="margin: 0; line-height: 1.2;">${item.name}</h3>
                        <span style="font-size: 0.75rem; color: var(--text-dim);">${item.category || ''}</span>
                    </div>
                </div>
                ${item.rating ? `<span class="rating"><i class="fas fa-star"></i> ${item.rating}</span>` : ''}
            </div>
            <div class="details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${item.address || 'No address found'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${item.phone || 'No phone found'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <span style="word-break: break-all;">${item.email || 'No email found'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-globe"></i>
                    ${hasWebsite ? `<a href="${item.website}" target="_blank" style="color: var(--accent); text-decoration: none; word-break: break-all;">${item.website}</a>` : '<span class="tag-no-website">No Website</span>'}
                </div>
                ${socialHtml}
                ${item.description ? `
                <div class="detail-item" style="margin-top: 0.5rem; font-style: italic; font-size: 0.85rem; border-left: 2px solid var(--primary); padding-left: 0.75rem;">
                    <span>"${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}"</span>
                </div>` : ''}
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

// Make downloadLogo available to window for the onclick handler
window.downloadLogo = downloadLogo;

exportBtn.addEventListener('click', () => {
    if (currentData.length === 0) return;

    const headers = ['Name', 'Email', 'Logo', 'Rating', 'Reviews', 'Category', 'Address', 'Website', 'Phone', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Description'];
    const csvContent = [
        headers.join(','),
        ...currentData.map(row => [
            `"${row.name || ''}"`,
            `"${row.email || ''}"`,
            `"${row.logo || ''}"`,
            `"${row.rating || ''}"`,
            `"${row.reviews || ''}"`,
            `"${row.category || ''}"`,
            `"${row.address || ''}"`,
            `"${row.website || ''}"`,
            `"${row.phone || ''}"`,
            `"${row.socials?.facebook || ''}"`,
            `"${row.socials?.instagram || ''}"`,
            `"${row.socials?.linkedin || ''}"`,
            `"${row.socials?.twitter || ''}"`,
            `"${row.description ? row.description.replace(/"/g, '""') : ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `business_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
