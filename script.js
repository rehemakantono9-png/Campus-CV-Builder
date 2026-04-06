// ========================================
// CAMPUS CV BUILDER - COMPLETE REWRITE
// ========================================

// Global state
let appState = {
    currentStep: 1,
    profile: {
        cv_goal: 'internship',
        profile_stage: 'final_year_student',
        programme: 'Mass Communication',
        target_job_title: '',
        preferred_sector: '',
        target_keywords: [],
        career_interests: []
    },
    personalDetails: {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        photo_enabled: false
    },
    educationList: [],
    selectedExperiences: [],
    experienceEntries: [],
    selectedSkills: {
        Communication: [],
        Digital: [],
        Professional: [],
        Research: [],
        Languages: []
    },
    projects: [],
    selectedSummary: '',
    summaryOptions: [],
    template: 'clean'
};

// Programme data (loaded from JSON)
let programmesData = {};
let experienceMappings = {};
let summaryTemplates = {};
let qualityRules = {};

// Load JSON data
async function loadData() {
    try {
        const [programmes, mappings, templates, rules] = await Promise.all([
            fetch('data/programmes.json').then(r => r.json()),
            fetch('data/experienceMappings.json').then(r => r.json()),
            fetch('data/summaryTemplates.json').then(r => r.json()),
            fetch('data/qualityRules.json').then(r => r.json())
        ]);
        programmesData = programmes;
        experienceMappings = mappings;
        summaryTemplates = templates;
        qualityRules = rules;
        
        // Initialize experience discovery cards
        initExperienceCards();
        // Initialize skills based on programme
        updateSkillsForProgramme();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Initialize experience discovery cards
function initExperienceCards() {
    const experienceTypes = [
        { id: 'internship', label: '📁 Internship', desc: 'Formal work experience' },
        { id: 'volunteering', label: '🤝 Volunteering', desc: 'Community service, charity work' },
        { id: 'student_leadership', label: '👥 Student Leadership', desc: 'Club officer, class rep, committee' },
        { id: 'campus_media', label: '📰 Campus Media', desc: 'Radio, newspaper, social media' },
        { id: 'small_business', label: '🏪 Small Business', desc: 'Family business, freelance, online shop' },
        { id: 'research_project', label: '🔬 Research Project', desc: 'Academic research, thesis work' },
        { id: 'teaching_practice', label: '📖 Teaching Practice', desc: 'Tutoring, classroom assistance' },
        { id: 'event_organizing', label: '🎉 Event Organizing', desc: 'Planning, coordination' },
        { id: 'class_representative', label: '👨‍🎓 Class Representative', desc: 'Student liaison' },
        { id: 'faith_based_service', label: '🕌 Faith-Based Service', desc: 'Church, mosque, religious activities' }
    ];
    
    const container = document.getElementById('experienceCards');
    if (!container) return;
    
    container.innerHTML = experienceTypes.map(type => `
        <div class="card" data-type="${type.id}" onclick="toggleExperienceCard('${type.id}')">
            <div class="card-header">
                <span class="card-icon">${type.label}</span>
                <span class="checkmark"></span>
            </div>
            <p class="card-desc">${type.desc}</p>
        </div>
    `).join('');
}

function toggleExperienceCard(type) {
    const card = document.querySelector(`.card[data-type="${type}"]`);
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== type);
    } else {
        card.classList.add('selected');
        appState.selectedExperiences.push(type);
        // Auto-create experience entry
        createExperienceEntry(type);
    }
}

function createExperienceEntry(type) {
    const typeLabels = {
        internship: 'Internship', volunteering: 'Volunteering', student_leadership: 'Leadership',
        campus_media: 'Campus Media', small_business: 'Small Business', research_project: 'Research',
        teaching_practice: 'Teaching', event_organizing: 'Event Organizing', class_representative: 'Class Representative',
        faith_based_service: 'Faith-Based Service'
    };
    
    const existing = appState.experienceEntries.find(e => e.type === type);
    if (existing) return;
    
    appState.experienceEntries.push({
        id: Date.now() + Math.random(),
        type: type,
        role_title: '',
        organization: '',
        start_date: '',
        end_date: '',
        is_current: false,
        raw_description: '',
        tools_used: [],
        results: [],
        generated_bullets: [],
        selected_bullets: []
    });
    
    renderExperienceBuilder();
}

function renderExperienceBuilder() {
    const container = document.getElementById('experienceBuilderList');
    if (!container) return;
    
    container.innerHTML = appState.experienceEntries.map(exp => `
        <div class="experience-builder-card" data-id="${exp.id}">
            <h4>${getExperienceTypeLabel(exp.type)}</h4>
            <input type="text" placeholder="Role Title (e.g., Campus Media Volunteer)" 
                   value="${escapeHtml(exp.role_title)}" 
                   onchange="updateExpField('${exp.id}', 'role_title', this.value)">
            <input type="text" placeholder="Organization" 
                   value="${escapeHtml(exp.organization)}" 
                   onchange="updateExpField('${exp.id}', 'organization', this.value)">
            <div class="date-row">
                <input type="text" placeholder="Start Date (MM/YYYY)" 
                       value="${exp.start_date}" 
                       onchange="updateExpField('${exp.id}', 'start_date', this.value)">
                <input type="text" placeholder="End Date (MM/YYYY)" 
                       value="${exp.end_date}" 
                       onchange="updateExpField('${exp.id}', 'end_date', this.value)">
            </div>
            <textarea placeholder="What did you do? (Write in simple words)" rows="3"
                      onchange="updateExpField('${exp.id}', 'raw_description', this.value)">${escapeHtml(exp.raw_description)}</textarea>
            <input type="text" placeholder="Tools/Platforms used (comma separated)" 
                   onchange="updateExpField('${exp.id}', 'tools_used_str', this.value)">
            <input type="text" placeholder="What results or outcomes?" 
                   onchange="updateExpField('${exp.id}', 'results_str', this.value)">
            <button class="generate-bullets-btn" onclick="generateBullets('${exp.id}')">✨ Generate Professional Bullets</button>
            ${exp.generated_bullets.length ? `
                <div class="bullet-options">
                    ${exp.generated_bullets.map((bullet, idx) => `
                        <label class="bullet-option">
                            <input type="checkbox" value="${idx}" 
                                   ${exp.selected_bullets.includes(bullet) ? 'checked' : ''}
                                   onchange="toggleBullet('${exp.id}', ${idx}, this.checked)">
                            <span>${bullet}</span>
                        </label>
                    `).join('')}
                </div>
            ` : ''}
            <button class="remove-exp-btn" onclick="removeExperience('${exp.id}')">Remove</button>
        </div>
    `).join('');
}

function updateExpField(id, field, value) {
    const exp = appState.experienceEntries.find(e => e.id == id);
    if (exp) {
        if (field === 'tools_used_str') {
            exp.tools_used = value.split(',').map(s => s.trim());
        } else if (field === 'results_str') {
            exp.results = value.split(',').map(s => s.trim());
        } else {
            exp[field] = value;
        }
        updatePreview();
    }
}

async function generateBullets(id) {
    const exp = appState.experienceEntries.find(e => e.id == id);
    if (!exp) return;
    
    // Check if we have a mapping for this experience type
    const mapping = experienceMappings[exp.type] || experienceMappings.class_representative;
    
    // Use mapping or generate based on raw description
    if (mapping && !exp.raw_description) {
        exp.generated_bullets = mapping.slice(0, 3);
    } else if (exp.raw_description) {
        // Simple bullet generation from raw text
        const raw = exp.raw_description.toLowerCase();
        exp.generated_bullets = [
            `${capitalizeFirst(getActionVerb(raw))} ${exp.role_title || 'role'} responsibilities including ${raw.substring(0, 60)}.`,
            `Demonstrated ${exp.tools_used.length ? exp.tools_used.join(', ') : 'relevant'} skills while supporting ${exp.organization || 'organization'} objectives.`,
            `Built practical experience in ${getSkillFromText(raw)} through hands-on contribution.`
        ];
    } else {
        exp.generated_bullets = mapping ? mapping.slice(0, 3) : ['Assisted with daily operations and team coordination.', 'Supported organizational goals through active participation.', 'Developed practical skills in a professional environment.'];
    }
    
    exp.selected_bullets = [...exp.generated_bullets];
    renderExperienceBuilder();
    updatePreview();
}

function toggleBullet(id, idx, isChecked) {
    const exp = appState.experienceEntries.find(e => e.id == id);
    if (exp) {
        const bullet = exp.generated_bullets[idx];
        if (isChecked && !exp.selected_bullets.includes(bullet)) {
            exp.selected_bullets.push(bullet);
        } else if (!isChecked) {
            exp.selected_bullets = exp.selected_bullets.filter(b => b !== bullet);
        }
        updatePreview();
    }
}

function removeExperience(id) {
    appState.experienceEntries = appState.experienceEntries.filter(e => e.id != id);
    appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== appState.experienceEntries.find(e => e.id == id)?.type);
    renderExperienceBuilder();
    updatePreview();
}

function getExperienceTypeLabel(type) {
    const labels = {
        internship: 'Internship', volunteering: 'Volunteering', student_leadership: 'Student Leadership',
        campus_media: 'Campus Media', small_business: 'Small Business', research_project: 'Research Project',
        teaching_practice: 'Teaching Practice', event_organizing: 'Event Organizing', class_representative: 'Class Representative',
        faith_based_service: 'Faith-Based Service'
    };
    return labels[type] || type;
}

function updateSkillsForProgramme() {
    const programme = document.getElementById('programmeSelect')?.value || appState.profile.programme;
    const programmeData = programmesData[programme];
    if (!programmeData) return;
    
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    const allSkills = programmeData.skills;
    let html = '';
    
    for (const [category, skills] of Object.entries(allSkills)) {
        html += `<div class="skill-category"><h4>${category}</h4><div class="skill-checkboxes">`;
        skills.forEach(skill => {
            const isSelected = appState.selectedSkills[category]?.includes(skill);
            html += `
                <label class="skill-checkbox">
                    <input type="checkbox" data-category="${category}" data-skill="${skill}" 
                           ${isSelected ? 'checked' : ''} onchange="toggleSkill(this)">
                    ${skill}
                </label>
            `;
        });
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
}

function toggleSkill(checkbox) {
    const category = checkbox.dataset.category;
    const skill = checkbox.dataset.skill;
    
    if (!appState.selectedSkills[category]) {
        appState.selectedSkills[category] = [];
    }
    
    if (checkbox.checked) {
        appState.selectedSkills[category].push(skill);
    } else {
        appState.selectedSkills[category] = appState.selectedSkills[category].filter(s => s !== skill);
    }
    
    updatePreview();
}

function addEducation() {
    const container = document.getElementById('educationList');
    const newEntry = document.createElement('div');
    newEntry.className = 'education-entry entry-card';
    newEntry.innerHTML = `
        <input type="text" placeholder="Institution" class="edu-institution">
        <input type="text" placeholder="Programme/Degree" class="edu-programme">
        <div class="date-row">
            <input type="text" placeholder="Start Date (MM/YYYY)" class="edu-start">
            <input type="text" placeholder="End Date (MM/YYYY)" class="edu-end">
        </div>
        <input type="text" placeholder="GPA/Classification (Optional)" class="edu-gpa">
        <textarea placeholder="Relevant Courses (one per line)" class="edu-courses" rows="2"></textarea>
        <textarea placeholder="Final Project/Thesis (Optional)" class="edu-project" rows="2"></textarea>
        <button class="remove-btn" onclick="this.closest('.education-entry').remove()">Remove</button>
    `;
    container.appendChild(newEntry);
}

function addProject() {
    const container = document.getElementById('projectsList');
    const projectId = Date.now();
    appState.projects.push({
        id: projectId,
        title: '',
        organization: '',
        role: '',
        start_date: '',
        end_date: '',
        description: ''
    });
    
    const newEntry = document.createElement('div');
    newEntry.className = 'project-entry entry-card';
    newEntry.innerHTML = `
        <input type="text" placeholder="Project/Leadership Title" onchange="updateProject(${projectId}, 'title', this.value)">
        <input type="text" placeholder="Organization/Group" onchange="updateProject(${projectId}, 'organization', this.value)">
        <input type="text" placeholder="Your Role" onchange="updateProject(${projectId}, 'role', this.value)">
        <div class="date-row">
            <input type="text" placeholder="Start Date" onchange="updateProject(${projectId}, 'start_date', this.value)">
            <input type="text" placeholder="End Date" onchange="updateProject(${projectId}, 'end_date', this.value)">
        </div>
        <textarea placeholder="Description / Achievements" rows="2" onchange="updateProject(${projectId}, 'description', this.value)"></textarea>
        <button class="remove-btn" onclick="this.closest('.project-entry').remove(); removeProject(${projectId})">Remove</button>
    `;
    container.appendChild(newEntry);
}

function updateProject(id, field, value) {
    const project = appState.projects.find(p => p.id === id);
    if (project) {
        project[field] = value;
        updatePreview();
    }
}

function removeProject(id) {
    appState.projects = appState.projects.filter(p => p.id !== id);
    updatePreview();
}

async function generateSummaries() {
    const programme = appState.profile.programme;
    const targetRole = appState.profile.target_job_title || 'relevant position';
    const sector = appState.profile.preferred_sector || 'professional';
    const profileStageLabel = appState.profile.profile_stage === 'final_year_student' ? 'Final year student' : 
                              appState.profile.profile_stage === 'fresh_graduate' ? 'Fresh graduate' : 'Student';
    
    // Get skills from selected skills
    const allSkills = Object.values(appState.selectedSkills).flat();
    const skill1 = allSkills[0] || 'communication';
    const skill2 = allSkills[1] || 'organization';
    const skill3 = allSkills[2] || 'teamwork';
    
    // Get exposure from experiences
    const exposures = appState.experienceEntries.map(e => e.role_title).filter(Boolean);
    const exposure1 = exposures[0] || 'academic projects';
    const exposure2 = exposures[1] || 'student activities';
    
    const templates = summaryTemplates.internship_focused || [];
    
    appState.summaryOptions = templates.map(template => {
        return template
            .replace('{programme}', programme)
            .replace('{target_role}', targetRole)
            .replace('{sector}', sector)
            .replace('{profile_stage_label}', profileStageLabel)
            .replace('{skill_1}', skill1)
            .replace('{skill_2}', skill2)
            .replace('{skill_3}', skill3)
            .replace('{exposure_1}', exposure1)
            .replace('{exposure_2}', exposure2)
            .replace('{interest_area_1}', appState.profile.career_interests[0] || 'professional growth')
            .replace('{interest_area_2}', appState.profile.career_interests[1] || 'skill development');
    });
    
    const container = document.getElementById('summaryOptions');
    if (container) {
        container.innerHTML = appState.summaryOptions.map((summary, idx) => `
            <div class="summary-option" onclick="selectSummary(${idx})">
                <p>${summary}</p>
                <span class="select-radio">${appState.selectedSummary === summary ? '✓ Selected' : 'Select'}</span>
            </div>
        `).join('');
    }
    
    if (appState.summaryOptions.length && !appState.selectedSummary) {
        appState.selectedSummary = appState.summaryOptions[0];
    }
}

function selectSummary(idx) {
    appState.selectedSummary = appState.summaryOptions[idx];
    document.querySelectorAll('.summary-option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === idx);
    });
    updatePreview();
}

function runQualityCheck() {
    const report = {
        overall_score: 0,
        suggestions: []
    };
    
    let score = 0;
    let maxScore = 0;
    
    // Check summary
    if (appState.selectedSummary) {
        if (appState.selectedSummary.includes(appState.profile.programme)) score += 1;
        if (appState.selectedSummary.length < 400) score += 1;
        maxScore += 2;
    }
    
    // Check skills
    const totalSkills = Object.values(appState.selectedSkills).flat().length;
    if (totalSkills >= 5 && totalSkills <= 12) score += 1;
    if (totalSkills > 0) score += 1;
    maxScore += 2;
    
    // Check experience
    const hasBullets = appState.experienceEntries.some(e => e.selected_bullets.length > 0);
    if (hasBullets) score += 1;
    if (appState.experienceEntries.length > 0) score += 1;
    maxScore += 2;
    
    // Check education
    if (appState.educationList.length > 0 || document.querySelectorAll('.education-entry').length > 0) score += 1;
    maxScore += 1;
    
    report.overall_score = Math.round((score / maxScore) * 100);
    
    // Generate suggestions
    if (!appState.selectedSummary) report.suggestions.push('Generate and select a professional summary');
    if (totalSkills < 5) report.suggestions.push('Add more skills relevant to your target role');
    if (totalSkills > 12) report.suggestions.push('Limit skills to 8-12 strongest ones');
    if (!hasBullets) report.suggestions.push('Generate professional bullets for your experience');
    if (appState.experienceEntries.length === 0) report.suggestions.push('Add at least one experience (internship, volunteering, or leadership)');
    
    const container = document.getElementById('qualityReport');
    if (container) {
        container.innerHTML = `
            <div class="score-circle">${report.overall_score}%</div>
            <div class="score-label">CV Quality Score</div>
            <ul class="suggestions-list">
                ${report.suggestions.map(s => `<li>🔧 ${s}</li>`).join('')}
            </ul>
            ${report.overall_score >= 70 ? '<p class="success-msg">✓ Your CV looks strong! Ready for export.</p>' : 
              '<p class="warning-msg">⚠️ Review the suggestions above to improve your CV.</p>'}
        `;
    }
    
    return report;
}

function updatePreview() {
    // Personal details
    document.getElementById('p_name').innerText = appState.personalDetails.full_name.toUpperCase() || 'YOUR NAME';
    document.getElementById('p_contacts').innerHTML = `${appState.personalDetails.email || 'email@example.com'} | ${appState.personalDetails.phone || '+123456789'} | ${appState.personalDetails.location || 'Location'}`;
    
    // Summary
    if (appState.selectedSummary) {
        document.getElementById('p_summary').innerText = appState.selectedSummary;
    }
    
    // Education
    const eduElements = document.querySelectorAll('.education-entry');
    const eduHtml = Array.from(eduElements).map(edu => {
        const institution = edu.querySelector('.edu-institution')?.value || '';
        const programme = edu.querySelector('.edu-programme')?.value || '';
        const start = edu.querySelector('.edu-start')?.value || '';
        const end = edu.querySelector('.edu-end')?.value || '';
        const courses = edu.querySelector('.edu-courses')?.value || '';
        
        return `<li><strong>${programme}</strong> - ${institution} (${start} - ${end})${courses ? `<br><small>Relevant: ${courses.substring(0, 100)}</small>` : ''}</li>`;
    }).join('');
    document.getElementById('p_education').innerHTML = eduHtml || '<li>No education added yet</li>';
    
    // Skills
    const skillsHtml = Object.entries(appState.selectedSkills)
        .filter(([_, skills]) => skills.length > 0)
        .map(([category, skills]) => `<div><strong>${category}:</strong> ${skills.join(', ')}</div>`)
        .join('');
    document.getElementById('p_skills').innerHTML = skillsHtml || '<p>Select skills in Step 7</p>';
    
    // Experience
    const expHtml = appState.experienceEntries.map(exp => {
        const bullets = exp.selected_bullets.map(b => `<li>${b}</li>`).join('');
        return `<li><strong>${exp.role_title || exp.type}</strong> - ${exp.organization || ''} (${exp.start_date || ''} - ${exp.end_date || 'Present'})<ul>${bullets}</ul></li>`;
    }).join('');
    document.getElementById('p_experiences').innerHTML = expHtml || '<li>No experience added yet</li>';
    
    // Projects
    const projectsHtml = appState.projects.map(proj => {
        return `<li><strong>${proj.title || 'Project'}</strong> - ${proj.organization || ''} (${proj.role || ''})<br><small>${proj.description || ''}</small></li>`;
    }).join('');
    document.getElementById('p_projects').innerHTML = projectsHtml || '<li>No projects added yet</li>';
    
    // Apply template styling
    applyTemplate();
}

function applyTemplate() {
    const template = appState.template;
    const cvElement = document.getElementById('cvPreview');
    cvElement.className = `cv ${template}-template`;
}

// Navigation
function nextStep() {
    // Save current step data before moving
    saveCurrentStepData();
    
    if (appState.currentStep < 12) {
        document.getElementById(`step${appState.currentStep}`).classList.remove('active');
        appState.currentStep++;
        document.getElementById(`step${appState.currentStep}`).classList.add('active');
        updateProgressBar();
        
        // Special actions when entering certain steps
        if (appState.currentStep === 7) {
            updateSkillsForProgramme();
        } else if (appState.currentStep === 9) {
            generateSummaries();
        } else if (appState.currentStep === 11) {
            runQualityCheck();
        } else if (appState.currentStep === 10 || appState.currentStep === 12) {
            updatePreview();
        }
    }
}

function prevStep() {
    if (appState.currentStep > 1) {
        document.getElementById(`step${appState.currentStep}`).classList.remove('active');
        appState.currentStep--;
        document.getElementById(`step${appState.currentStep}`).classList.add('active');
        updateProgressBar();
    }
}

function saveCurrentStepData() {
    // Save profile data
    const cvGoal = document.getElementById('cvGoal')?.value;
    const profileStage = document.getElementById('profileStage')?.value;
    const programme = document.getElementById('programmeSelect')?.value;
    if (cvGoal) appState.profile.cv_goal = cvGoal;
    if (profileStage) appState.profile.profile_stage = profileStage;
    if (programme) appState.profile.programme = programme;
    
    // Save personal details
    appState.personalDetails = {
        full_name: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        location: document.getElementById('location')?.value || '',
        linkedin: document.getElementById('linkedin')?.value || '',
        photo_enabled: document.getElementById('photoEnabled')?.checked || false
    };
    
    // Save career target
    appState.profile.target_job_title = document.getElementById('targetJobTitle')?.value || '';
    appState.profile.preferred_sector = document.getElementById('preferredSector')?.value || '';
    const keywords = document.getElementById('targetKeywords')?.value || '';
    appState.profile.target_keywords = keywords.split(',').map(k => k.trim());
    const interests = document.getElementById('careerInterests')?.value || '';
    appState.profile.career_interests = interests.split(',').map(i => i.trim());
    
    // Save template
    appState.template = document.getElementById('templateSelect')?.value || 'clean';
}

function updateProgressBar() {
    const percent = (appState.currentStep / 12) * 100;
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('stepIndicator').innerText = `Step ${appState.currentStep} of 12`;
}

// Helper functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function capitalizeFirst(str) {
    if (!str) return 'Assisted';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getActionVerb(text) {
    const verbs = ['assisted', 'supported', 'coordinated', 'prepared', 'organized', 'developed', 'created', 'conducted', 'facilitated', 'managed'];
    for (const verb of verbs) {
        if (text.includes(verb)) return verb;
    }
    return 'supported';
}

function getSkillFromText(text) {
    const skills = ['communication', 'organization', 'teamwork', 'leadership', 'problem solving', 'time management'];
    for (const skill of skills) {
        if (text.includes(skill)) return skill;
    }
    return 'relevant professional skills';
}

// Payment integration (kept from original)
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    const payBtn = document.getElementById('payDownloadBtn');
    if (payBtn) {
        payBtn.onclick = async function() {
            saveCurrentStepData();
            updatePreview();
            
            const email = appState.personalDetails.email;
            const name = appState.personalDetails.full_name;
            
            if (!email || !name) {
                alert("Please enter your name and email in Step 2 first!");
                return;
            }
            
            this.disabled = true;
            this.innerText = "Redirecting to Payment...";
            
            try {
                const cvHtml = document.getElementById('cvPreview').innerHTML;
                localStorage.setItem('campusCV_Data', JSON.stringify({ html: cvHtml }));
                
                const response = await fetch('/.netlify/functions/pesapal-submit-order', {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: 3000,
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
    }
});

// Make functions global
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleExperienceCard = toggleExperienceCard;
window.updateExpField = updateExpField;
window.generateBullets = generateBullets;
window.toggleBullet = toggleBullet;
window.removeExperience = removeExperience;
window.addEducation = addEducation;
window.addProject = addProject;
window.updateProject = updateProject;
window.removeProject = removeProject;
window.toggleSkill = toggleSkill;
window.selectSummary = selectSummary;
