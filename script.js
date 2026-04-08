// ========================================
// CAMPUS CV BUILDER - COMPLETE REWRITE V2
// All issues fixed: clickable cards, AI suggestions, payment, etc.
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

// Programme data
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
        
        initExperienceCards();
        updateSkillsForProgramme();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// AI Suggest Keywords & Interests
function aiSuggestKeywords() {
    const programme = document.getElementById('programmeSelect')?.value || appState.profile.programme;
    const programmeData = programmesData[programme];
    const targetRole = document.getElementById('targetJobTitle')?.value || '';
    
    if (programmeData && programmeData.target_roles) {
        // Suggest keywords based on programme
        let suggestedKeywords = [];
        let suggestedInterests = [];
        
        if (programme === 'Mass Communication') {
            suggestedKeywords = ['writing', 'interviewing', 'social media', 'media monitoring', 'content creation', 'public relations'];
            suggestedInterests = ['journalism', 'digital media', 'broadcasting', 'corporate communications'];
        } else if (programme === 'Education') {
            suggestedKeywords = ['lesson planning', 'classroom management', 'student assessment', 'curriculum development'];
            suggestedInterests = ['teaching', 'educational technology', 'special needs education', 'curriculum design'];
        } else if (programme === 'Business Administration') {
            suggestedKeywords = ['customer service', 'administration', 'team coordination', 'reporting', 'data entry'];
            suggestedInterests = ['management', 'marketing', 'entrepreneurship', 'operations'];
        } else if (programme === 'Accounting') {
            suggestedKeywords = ['bookkeeping', 'financial recording', 'data entry', 'spreadsheets', 'attention to detail'];
            suggestedInterests = ['auditing', 'taxation', 'financial analysis', 'accounting software'];
        } else if (programme === 'Information Technology') {
            suggestedKeywords = ['troubleshooting', 'web basics', 'database', 'technical support', 'programming basics'];
            suggestedInterests = ['software development', 'cybersecurity', 'data science', 'IT support'];
        } else if (programme === 'Public Administration') {
            suggestedKeywords = ['public communication', 'documentation', 'report writing', 'community engagement'];
            suggestedInterests = ['policy analysis', 'community development', 'government relations', 'public service'];
        } else if (programme === 'Agriculture') {
            suggestedKeywords = ['farm management', 'data collection', 'crop monitoring', 'record keeping'];
            suggestedInterests = ['agribusiness', 'sustainable farming', 'extension services', 'food security'];
        } else if (programme === 'Islamic Studies') {
            suggestedKeywords = ['research', 'public speaking', 'community engagement', 'teaching support'];
            suggestedInterests = ['da\'wah', 'islamic education', 'community service', 'interfaith dialogue'];
        }
        
        // If target role is provided, add role-based suggestions
        if (targetRole.toLowerCase().includes('intern')) {
            suggestedKeywords.push('internship', 'learning agility', 'professional development');
        }
        
        document.getElementById('targetKeywords').value = suggestedKeywords.slice(0, 6).join(', ');
        document.getElementById('careerInterests').value = suggestedInterests.slice(0, 4).join(', ');
        
        // Save to state
        appState.profile.target_keywords = suggestedKeywords;
        appState.profile.career_interests = suggestedInterests;
        
        // Show success message
        alert('✨ AI suggested keywords and interests added! You can edit them.');
    } else {
        alert('Please select your programme first in Step 1.');
    }
}

// Initialize experience discovery cards
function initExperienceCards() {
    const experienceTypes = [
        { id: 'internship', label: '📁 Internship', desc: 'Formal work experience in an organization' },
        { id: 'volunteering', label: '🤝 Volunteering', desc: 'Community service, charity work, NGOs' },
        { id: 'student_leadership', label: '👥 Student Leadership', desc: 'Club officer, class rep, committee member' },
        { id: 'campus_media', label: '📰 Campus Media', desc: 'Radio, newspaper, social media team' },
        { id: 'small_business', label: '🏪 Small Business', desc: 'Family business, freelance, online shop' },
        { id: 'research_project', label: '🔬 Research Project', desc: 'Academic research, thesis work, data collection' },
        { id: 'teaching_practice', label: '📖 Teaching Practice', desc: 'Tutoring, classroom assistance, peer teaching' },
        { id: 'event_organizing', label: '🎉 Event Organizing', desc: 'Planning, coordination, event management' },
        { id: 'class_representative', label: '👨‍🎓 Class Representative', desc: 'Student liaison, class coordination' },
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
    if (!card) return;
    
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== type);
        // Remove experience entry
        const expIndex = appState.experienceEntries.findIndex(e => e.type === type);
        if (expIndex !== -1) {
            appState.experienceEntries.splice(expIndex, 1);
        }
    } else {
        card.classList.add('selected');
        appState.selectedExperiences.push(type);
        createExperienceEntry(type);
    }
    renderExperienceBuilder();
    updatePreview();
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
    
    if (appState.experienceEntries.length === 0) {
        container.innerHTML = '<p class="helper-text">No experiences selected. Go back to Step 5 and select your experiences.</p>';
        return;
    }
    
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
                    <p class="bullet-label">Select bullets to include:</p>
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

function generateBullets(id) {
    const exp = appState.experienceEntries.find(e => e.id == id);
    if (!exp) return;
    
    // Get mapping or use default
    const mapping = experienceMappings[exp.type] || experienceMappings.class_representative;
    
    if (mapping && !exp.raw_description) {
        exp.generated_bullets = mapping.slice(0, 3);
    } else if (exp.raw_description) {
        const raw = exp.raw_description.toLowerCase();
        exp.generated_bullets = [
            `${capitalizeFirst(getActionVerb(raw))} ${exp.role_title || 'role'} responsibilities including ${raw.substring(0, 60)}.`,
            `Demonstrated ${exp.tools_used.length ? exp.tools_used.join(', ') : 'relevant'} skills while supporting ${exp.organization || 'organization'} objectives.`,
            `Built practical experience in ${getSkillFromText(raw)} through hands-on contribution.`
        ];
    } else {
        exp.generated_bullets = mapping ? mapping.slice(0, 3) : [
            'Assisted with daily operations and team coordination.',
            'Supported organizational goals through active participation.',
            'Developed practical skills in a professional environment.'
        ];
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
    // Also remove from selectedExperiences
    const removedExp = appState.experienceEntries.find(e => e.id == id);
    if (removedExp) {
        appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== removedExp.type);
        // Remove card selection
        const card = document.querySelector(`.card[data-type="${removedExp.type}"]`);
        if (card) card.classList.remove('selected');
    }
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
        <input type="text" placeholder="Programme/Degree/Certificate" class="edu-programme">
        <div class="date-row">
            <input type="text" placeholder="Start Date (MM/YYYY)" class="edu-start">
            <input type="text" placeholder="End Date (MM/YYYY)" class="edu-end">
        </div>
        <input type="text" placeholder="GPA/Classification (Optional)" class="edu-gpa">
        <textarea placeholder="Relevant Courses (comma separated)" class="edu-courses" rows="2"></textarea>
        <textarea placeholder="Final Project/Thesis (Optional)" class="edu-project" rows="2"></textarea>
        <button class="remove-btn" onclick="this.closest('.education-entry').remove(); updatePreview();">Remove</button>
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
        description: '',
        achievements: ''
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
        <textarea placeholder="Description / Key Achievements" rows="3" onchange="updateProject(${projectId}, 'description', this.value)"></textarea>
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

function generateSummaries() {
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
    
    const templates = summaryTemplates.internship_focused || [
        "Motivated {programme} student with practical interest in {interest_area_1} and {interest_area_2}. Skilled in {skill_1}, {skill_2}, and {skill_3} through academic work, student activities, and hands-on experience. Seeking an opportunity to apply these skills in a professional {sector} environment.",
        "{profile_stage_label} in {programme} with strengths in {skill_1}, {skill_2}, and {skill_3}. Experienced in {exposure_1} and {exposure_2}, with a strong interest in {target_role}. Eager to contribute, learn, and grow in a practical work setting."
    ];
    
    appState.summaryOptions = templates.map(template => {
        return template
            .replace(/{programme}/g, programme)
            .replace(/{target_role}/g, targetRole)
            .replace(/{sector}/g, sector)
            .replace(/{profile_stage_label}/g, profileStageLabel)
            .replace(/{skill_1}/g, skill1)
            .replace(/{skill_2}/g, skill2)
            .replace(/{skill_3}/g, skill3)
            .replace(/{exposure_1}/g, exposure1)
            .replace(/{exposure_2}/g, exposure2)
            .replace(/{interest_area_1}/g, appState.profile.career_interests[0] || 'professional growth')
            .replace(/{interest_area_2}/g, appState.profile.career_interests[1] || 'skill development')
            .replace(/{sector_or_role}/g, sector);
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
        updatePreview();
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
    let score = 0;
    let maxScore = 7;
    const suggestions = [];
    
    // Check summary
    if (appState.selectedSummary && appState.selectedSummary !== 'Complete the steps to generate your professional summary.') {
        score += 1;
    } else {
        suggestions.push('Generate and select a professional summary');
    }
    
    // Check skills
    const totalSkills = Object.values(appState.selectedSkills).flat().length;
    if (totalSkills >= 5 && totalSkills <= 12) score += 1;
    if (totalSkills >= 3) score += 1;
    if (totalSkills === 0) suggestions.push('Add more skills relevant to your target role');
    if (totalSkills > 12) suggestions.push('Limit skills to 8-12 strongest ones');
    
    // Check experience
    const hasBullets = appState.experienceEntries.some(e => e.selected_bullets.length > 0);
    if (hasBullets) score += 1;
    if (appState.experienceEntries.length === 0) suggestions.push('Add at least one experience (internship, volunteering, or leadership)');
    if (!hasBullets && appState.experienceEntries.length > 0) suggestions.push('Generate professional bullets for your experience');
    
    // Check education
    const eduEntries = document.querySelectorAll('.education-entry');
    if (eduEntries.length > 0) score += 1;
    
    // Check projects
    if (appState.projects.length > 0) score += 1;
    
    // Check career target
    if (appState.profile.target_job_title) score += 1;
    
    const overallScore = Math.round((score / maxScore) * 100);
    
    const container = document.getElementById('qualityReport');
    if (container) {
        let suggestionsHtml = suggestions.length ? 
            `<ul class="suggestions-list">${suggestions.map(s => `<li>🔧 ${s}</li>`).join('')}</ul>` : 
            '<p class="success-msg">✓ All quality checks passed! Your CV looks great!</p>';
        
        container.innerHTML = `
            <div class="score-circle ${overallScore >= 70 ? 'high-score' : 'low-score'}">${overallScore}%</div>
            <div class="score-label">CV Quality Score</div>
            ${suggestionsHtml}
            ${overallScore >= 70 ? '<p class="success-msg">✓ Your CV is ready for export!</p>' : '<p class="warning-msg">⚠️ Review the suggestions above to improve your CV.</p>'}
        `;
    }
}

function updatePreview() {
    // Personal details
    document.getElementById('p_name').innerText = appState.personalDetails.full_name.toUpperCase() || 'YOUR NAME';
    document.getElementById('p_contacts').innerHTML = `${appState.personalDetails.email || 'email@example.com'} | ${appState.personalDetails.phone || '+123456789'} | ${appState.personalDetails.location || 'Location'}`;
    
    // Summary
    if (appState.selectedSummary && appState.selectedSummary !== 'Complete the steps to generate your professional summary.') {
        document.getElementById('p_summary').innerText = appState.selectedSummary;
    }
    
    // Education - Table format for better display
    const eduElements = document.querySelectorAll('.education-entry');
    let eduHtml = '';
    eduElements.forEach(edu => {
        const institution = edu.querySelector('.edu-institution')?.value || '';
        const programme = edu.querySelector('.edu-programme')?.value || '';
        const start = edu.querySelector('.edu-start')?.value || '';
        const end = edu.querySelector('.edu-end')?.value || '';
        const gpa = edu.querySelector('.edu-gpa')?.value || '';
        const courses = edu.querySelector('.edu-courses')?.value || '';
        const project = edu.querySelector('.edu-project')?.value || '';
        
        if (programme || institution) {
            eduHtml += `
                <div class="education-item">
                    <div class="edu-header">
                        <strong>${escapeHtml(programme)}</strong>
                        <span class="edu-date">${escapeHtml(start)} - ${escapeHtml(end)}</span>
                    </div>
                    <div class="edu-institution">${escapeHtml(institution)}</div>
                    ${gpa ? `<div class="edu-gpa-display">GPA/Classification: ${escapeHtml(gpa)}</div>` : ''}
                    ${courses ? `<div class="edu-courses-display"><em>Relevant Courses:</em> ${escapeHtml(courses)}</div>` : ''}
                    ${project ? `<div class="edu-project-display"><em>Project/Thesis:</em> ${escapeHtml(project)}</div>` : ''}
                </div>
            `;
        }
    });
    document.getElementById('p_education').innerHTML = eduHtml || '<p>No education added yet</p>';
    
    // Skills
    const skillsHtml = Object.entries(appState.selectedSkills)
        .filter(([_, skills]) => skills.length > 0)
        .map(([category, skills]) => `<div class="skill-group"><strong>${category}:</strong> ${skills.join(', ')}</div>`)
        .join('');
    document.getElementById('p_skills').innerHTML = skillsHtml || '<p>Select skills in Step 7</p>';
    
    // Experience
    let expHtml = '';
    appState.experienceEntries.forEach(exp => {
        if (exp.selected_bullets.length > 0) {
            const bullets = exp.selected_bullets.map(b => `<li>${b}</li>`).join('');
            expHtml += `
                <div class="experience-item">
                    <div class="exp-header">
                        <strong>${escapeHtml(exp.role_title || getExperienceTypeLabel(exp.type))}</strong>
                        <span class="exp-date">${escapeHtml(exp.start_date || '')} - ${escapeHtml(exp.end_date || 'Present')}</span>
                    </div>
                    <div class="exp-organization">${escapeHtml(exp.organization || '')}</div>
                    <ul class="exp-bullets">${bullets}</ul>
                </div>
            `;
        }
    });
    document.getElementById('p_experiences').innerHTML = expHtml || '<p>No experience added yet. Go to Step 5 to add experience.</p>';
    
    // Projects
    let projectsHtml = '';
    appState.projects.forEach(proj => {
        if (proj.title) {
            projectsHtml += `
                <div class="project-item">
                    <div class="project-header">
                        <strong>${escapeHtml(proj.title)}</strong>
                        <span class="project-date">${escapeHtml(proj.start_date || '')} - ${escapeHtml(proj.end_date || '')}</span>
                    </div>
                    <div class="project-role">Role: ${escapeHtml(proj.role || '')} | ${escapeHtml(proj.organization || '')}</div>
                    <div class="project-description">${escapeHtml(proj.description || '')}</div>
                </div>
            `;
        }
    });
    document.getElementById('p_projects').innerHTML = projectsHtml || '<p>No projects added yet. Go to Step 8 to add projects or leadership roles.</p>';
    
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
    saveCurrentStepData();
    
    if (appState.currentStep < 12) {
        document.getElementById(`step${appState.currentStep}`).classList.remove('active');
        appState.currentStep++;
        document.getElementById(`step${appState.currentStep}`).classList.add('active');
        updateProgressBar();
        
        if (appState.currentStep === 7) {
            updateSkillsForProgramme();
        } else if (appState.currentStep === 9) {
            // Auto-generate summaries when entering step 9 if not already generated
            if (!appState.summaryOptions.length) {
                generateSummaries();
            }
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
    const cvGoal = document.getElementById('cvGoal')?.value;
    const profileStage = document.getElementById('profileStage')?.value;
    const programme = document.getElementById('programmeSelect')?.value;
    if (cvGoal) appState.profile.cv_goal = cvGoal;
    if (profileStage) appState.profile.profile_stage = profileStage;
    if (programme) appState.profile.programme = programme;
    
    appState.personalDetails = {
        full_name: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        location: document.getElementById('location')?.value || '',
        linkedin: document.getElementById('linkedin')?.value || '',
        photo_enabled: document.getElementById('photoEnabled')?.checked || false
    };
    
    appState.profile.target_job_title = document.getElementById('targetJobTitle')?.value || '';
    appState.profile.preferred_sector = document.getElementById('preferredSector')?.value || '';
    const keywords = document.getElementById('targetKeywords')?.value || '';
    appState.profile.target_keywords = keywords.split(',').map(k => k.trim());
    const interests = document.getElementById('careerInterests')?.value || '';
    appState.profile.career_interests = interests.split(',').map(i => i.trim());
    
    appState.template = document.getElementById('templateSelect')?.value || 'clean';
}

function updateProgressBar() {
    const percent = (appState.currentStep / 12) * 100;
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('stepIndicator').innerText = `Step ${appState.currentStep} of 12`;
}

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
window.aiSuggestKeywords = aiSuggestKeywords;
window.generateSummaries = generateSummaries;

// Payment integration
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
                alert("⚠️ Please enter your name and email in Step 2 first!");
                return;
            }
            
            if (!appState.selectedSummary || appState.selectedSummary === 'Complete the steps to generate your professional summary.') {
                alert("⚠️ Please generate and select a professional summary in Step 9 first!");
                return;
            }
            
            this.disabled = true;
            this.innerText = "Processing...";
            
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
                    alert("Payment error: " + (res.error || "Unknown error"));
                    this.disabled = false;
                    this.innerText = "💳 Pay & Download PDF";
                }
            } catch (e) {
                console.error("Payment error:", e);
                alert("Network error. Please check your connection and try again.");
                this.disabled = false;
                this.innerText = "💳 Pay & Download PDF";
            }
        };
    }
});
