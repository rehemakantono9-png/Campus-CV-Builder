// 1. DYNAMIC LISTS
function createEntry(containerId, placeholder) {
    const div = document.createElement('div');
    div.className = 'entry-row';
    div.innerHTML = `
        <input type="text" placeholder="${placeholder}" class="title">
        <input type="text" placeholder="Institution/Company" class="subtitle">
        <textarea placeholder="Achievements/Details"></textarea>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById(containerId).appendChild(div);
}

document.getElementById('addEduBtn').onclick = () => createEntry('eduList', 'Degree/Certificate');
document.getElementById('addExpBtn').onclick = () => createEntry('expList', 'Job Role');

// 2. AUTO-SUGGEST SUMMARY GENERATOR
document.getElementById('suggestSummaryBtn').onclick = () => {
    const tech = document.getElementById('techSkills').value || "technical expertise";
    const loc = document.getElementById('location').value || "Uganda";
    const summary = `Result-oriented professional based in ${loc} with a strong foundation in ${tech}. I am committed to excellence, continuous learning, and contributing effectively to organizational goals through hard work and integrity.`;
    document.getElementById('summary').value = summary;
    autoSave();
};

// 3. AUTO-SAVE & UI SYNC
function autoSave() {
    // Sync Text
    document.getElementById('p_name').innerText = document.getElementById('fullName').value.toUpperCase() || "YOUR NAME";
    document.getElementById('p_contacts').innerText = `${document.getElementById('email').value} | ${document.getElementById('phone').value} | ${document.getElementById('location').value}`;
    document.getElementById('p_summary').innerText = document.getElementById('summary').value;
    
    // Sync Skills
    document.getElementById('p_skills').innerHTML = `<strong>Tech:</strong> ${document.getElementById('techSkills').value}<br><strong>Soft:</strong> ${document.getElementById('softSkills').value}`;

    // Sync Lists
    renderListToPreview('eduList', 'p_education');
    renderListToPreview('expList', 'p_experiences');

    // Save to Browser Memory
    const cvData = { html: document.getElementById('cvPreview').innerHTML };
    localStorage.setItem('campusCV_Data', JSON.stringify(cvData));
}

function renderListToPreview(sourceId, targetId) {
    const items = document.getElementById(sourceId).querySelectorAll('.entry-row');
    let html = '';
    items.forEach(item => {
        const inputs = item.querySelectorAll('input, textarea');
        if(inputs[0].value) {
            html += `<li><strong>${inputs[0].value}</strong> - ${inputs[1].value}<br><small>${inputs[2].value}</small></li>`;
        }
    });
    document.getElementById(targetId).innerHTML = html;
}

document.getElementById('updatePreviewBtn').onclick = () => {
    autoSave();
    alert("Preview Updated!");
};

// 4. PESAPAL REDIRECT
document.getElementById('payDownloadBtn').onclick = async function() {
    autoSave(); // Save data one last time
    const email = document.getElementById('email').value;
    const name = document.getElementById('fullName').value;

    if (!email || !name) return alert("Enter Name and Email first!");

    this.disabled = true;
    this.innerText = "Redirecting to Payment...";

    try {
        const response = await fetch('/.netlify/functions/pesapal-submit-order', {
            method: 'POST',
            body: JSON.stringify({
                amount: document.getElementById('price').value,
                email: email,
                name: name
            })
        });
        const res = await response.json();
        if (res.ok && res.redirect_url) {
            window.location.href = res.redirect_url;
        } else {
            alert("Payment error. Try again.");
            this.disabled = false;
        }
    } catch (e) {
        alert("Network Error");
        this.disabled = false;
    }
};