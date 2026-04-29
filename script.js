const TOTAL_STEPS = 12;

const appState = {
  currentStep: 1,
  profile: {
    cv_goal: "internship",
    profile_stage: "final_year_student",
    programme: "",
    custom_programme: "",
    target_job_title: "",
    preferred_sector: "",
    target_keywords: [],
    career_interests: []
  },
  personalDetails: {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    photo_enabled: false
  },
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
  selectedSummary: "",
  summaryOptions: [],
  template: "clean"
};

let programmesData = {};
let experienceMappings = {};
let summaryTemplates = {};
let qualityRules = {};

const DEFAULT_FALLBACK_SKILLS = {
  Communication: ["Communication", "Report writing", "Presentation", "Interpersonal communication"],
  Digital: ["Microsoft Word", "Microsoft Excel", "Email communication", "Online research"],
  Professional: ["Teamwork", "Organization", "Time management", "Problem solving"],
  Research: ["Data collection", "Documentation", "Basic analysis", "Observation"]
};

const SPELLING_MAP = {
  "mathmatics": "Mathematics",
  "chemestry": "Chemistry",
  "chemstry": "Chemistry",
  "eethics": "Ethics",
  "febrary": "February",
  "agregades": "Aggregates",
  "uganad": "Uganda",
  "intervies": "interviews",
  "optmised": "optimized",
  "researcj": "research",
  "jingos": "jingles"
};

const MONTHS = {
  "1": "January", "01": "January",
  "2": "February", "02": "February",
  "3": "March", "03": "March",
  "4": "April", "04": "April",
  "5": "May", "05": "May",
  "6": "June", "06": "June",
  "7": "July", "07": "July",
  "8": "August", "08": "August",
  "9": "September", "09": "September",
  "10": "October",
  "11": "November",
  "12": "December"
};

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadData() {
  try {
    const [programmes, mappings, templates, rules] = await Promise.all([
      fetchJson("data/programmes.json"),
      fetchJson("data/experienceMappings.json"),
      fetchJson("data/summaryTemplates.json"),
      fetchJson("data/qualityRules.json")
    ]);

    programmesData = programmes || {};
    experienceMappings = mappings || {};
    summaryTemplates = templates || {};
    qualityRules = rules || {};

    initProgrammeSelect();
    initExperienceCards();
    updateSkillsForProgramme();
    updateProgressBar();
    updatePreview();
  } catch (error) {
    console.error("Error loading data:", error);
    showMessage("⚠️ Failed to load app data. Check your JSON files and file paths.");
  }
}

function initProgrammeSelect() {
  const select = document.getElementById("programmeSelect");
  if (!select) return;

  const programmeNames = Object.keys(programmesData).sort((a, b) => a.localeCompare(b));

  select.innerHTML = `
    <option value="">Select your programme</option>
    ${programmeNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}
    <option value="__other__">Other / Programme not listed</option>
  `;

  if (programmeNames.length) {
    select.value = programmeNames[0];
    appState.profile.programme = programmeNames[0];
  }

  toggleCustomProgrammeField();
}

function toggleCustomProgrammeField() {
  const select = document.getElementById("programmeSelect");
  const wrap = document.getElementById("customProgrammeWrap");
  if (!select || !wrap) return;
  wrap.style.display = select.value === "__other__" ? "block" : "none";
}

function getResolvedProgramme() {
  const selectValue = document.getElementById("programmeSelect")?.value || "";
  const customValue = document.getElementById("customProgramme")?.value?.trim() || "";
  if (selectValue === "__other__") return customValue;
  return selectValue || appState.profile.programme || "";
}

function getCurrentProgrammeData() {
  const programme = getResolvedProgramme();
  return programmesData[programme] || null;
}

function initExperienceCards() {
  const experienceTypes = [
    { id: "internship", label: "📁 Internship", desc: "Formal work experience in an organization" },
    { id: "volunteering", label: "🤝 Volunteering", desc: "Community service, charity work, NGOs" },
    { id: "student_leadership", label: "👥 Student Leadership", desc: "Club officer, committee member, leader" },
    { id: "campus_media", label: "📰 Campus Media", desc: "Radio, newspaper, media club, social media team" },
    { id: "small_business", label: "🏪 Small Business", desc: "Family business, freelance, online selling" },
    { id: "research_project", label: "🔬 Research Project", desc: "Academic research, thesis, field data collection" },
    { id: "teaching_practice", label: "📖 Teaching Practice", desc: "Tutoring, classroom support, peer teaching" },
    { id: "event_organizing", label: "🎉 Event Organizing", desc: "Planning, coordination, ushering, logistics" },
    { id: "class_representative", label: "👨‍🎓 Class Representative", desc: "Student liaison, coordination, communication" },
    { id: "faith_based_service", label: "🕌 Faith-Based Service", desc: "Mosque, church, religious community service" }
  ];

  const container = document.getElementById("experienceCards");
  if (!container) return;

  container.innerHTML = experienceTypes.map(type => `
    <div class="card ${appState.selectedExperiences.includes(type.id) ? "selected" : ""}"
         data-type="${type.id}"
         onclick="toggleExperienceCard('${type.id}')">
      <div class="card-header">
        <span class="card-icon">${type.label}</span>
        <span class="checkmark"></span>
      </div>
      <p class="card-desc">${type.desc}</p>
    </div>
  `).join("");
}

function aiSuggestKeywords() {
  saveCurrentStepData();

  const programme = getResolvedProgramme();
  if (!programme) {
    showMessage("⚠️ Please select or type your programme first.");
    return;
  }

  const programmeData = getCurrentProgrammeData();
  const targetRole = document.getElementById("targetJobTitle")?.value?.trim() || "";

  const keywords = [];
  const interests = [];

  if (programmeData?.skills) {
    Object.values(programmeData.skills).forEach(list => {
      if (Array.isArray(list)) list.slice(0, 2).forEach(item => keywords.push(item));
    });
  } else {
    Object.values(DEFAULT_FALLBACK_SKILLS).forEach(list => {
      list.slice(0, 2).forEach(item => keywords.push(item));
    });
  }

  if (programmeData?.target_roles) {
    programmeData.target_roles.slice(0, 4).forEach(role => interests.push(role));
  } else {
    interests.push(programme, "entry-level work", "professional growth", "hands-on learning");
  }

  if (programmeData?.summary_keywords) {
    programmeData.summary_keywords.forEach(item => interests.push(item));
  }

  if (targetRole) {
    keywords.push(targetRole);
    interests.unshift(targetRole);
  }

  const finalKeywords = uniqueCleanList(keywords.map(normalizeSkillLabel)).slice(0, 6);
  const finalInterests = uniqueCleanList(interests.map(normalizeTitleCase)).slice(0, 4);

  const targetKeywordsInput = document.getElementById("targetKeywords");
  const careerInterestsInput = document.getElementById("careerInterests");

  if (targetKeywordsInput) targetKeywordsInput.value = finalKeywords.join(", ");
  if (careerInterestsInput) careerInterestsInput.value = finalInterests.join(", ");

  appState.profile.target_keywords = finalKeywords;
  appState.profile.career_interests = finalInterests;

  showMessage("✨ Suggested keywords and interests added. You can edit them.");
}

function toggleExperienceCard(type) {
  const card = document.querySelector(`.card[data-type="${type}"]`);
  if (!card) return;

  const selected = card.classList.contains("selected");

  if (selected) {
    card.classList.remove("selected");
    appState.selectedExperiences = appState.selectedExperiences.filter(item => item !== type);
    appState.experienceEntries = appState.experienceEntries.filter(item => item.type !== type);
  } else {
    card.classList.add("selected");
    if (!appState.selectedExperiences.includes(type)) {
      appState.selectedExperiences.push(type);
    }
    createExperienceEntry(type);
  }

  renderExperienceBuilder();
  updatePreview();
}

function createExperienceEntry(type) {
  const existing = appState.experienceEntries.find(item => item.type === type);
  if (existing) return;

  appState.experienceEntries.push({
    id: String(Date.now() + Math.random()),
    type,
    role_title: "",
    organization: "",
    start_date: "",
    end_date: "",
    raw_description: "",
    tools_used: [],
    results: [],
    generated_bullets: [],
    selected_bullets: []
  });
}

function renderExperienceBuilder() {
  const container = document.getElementById("experienceBuilderList");
  if (!container) return;

  if (!appState.experienceEntries.length) {
    container.innerHTML = '<p class="helper-text">No experiences selected yet. Go to Step 5 and choose what you have done.</p>';
    return;
  }

  container.innerHTML = appState.experienceEntries.map(exp => {
    const toolsValue = exp.tools_used.join(", ");
    const resultsValue = exp.results.join(", ");

    return `
      <div class="experience-builder-card" data-id="${exp.id}">
        <h4>${escapeHtml(normalizeTitleCase(exp.role_title || getExperienceTypeLabel(exp.type)))}</h4>

        <label>Role Title</label>
        <input type="text"
               placeholder="e.g., News Reporter"
               value="${escapeHtml(exp.role_title)}"
               onchange="updateExpField('${exp.id}', 'role_title', this.value)">

        <label>Organization</label>
        <input type="text"
               placeholder="e.g., IUIU FM"
               value="${escapeHtml(exp.organization)}"
               onchange="updateExpField('${exp.id}', 'organization', this.value)">

        <div class="date-row">
          <div>
            <label>Start Date</label>
            <input type="text"
                   placeholder="MM/YYYY or year"
                   value="${escapeHtml(exp.start_date)}"
                   onchange="updateExpField('${exp.id}', 'start_date', this.value)">
          </div>
          <div>
            <label>End Date</label>
            <input type="text"
                   placeholder="MM/YYYY, year, or Present"
                   value="${escapeHtml(exp.end_date)}"
                   onchange="updateExpField('${exp.id}', 'end_date', this.value)">
          </div>
        </div>

        <label>What did you do?</label>
        <textarea rows="4"
                  placeholder="Write rough notes in simple language."
                  onchange="updateExpField('${exp.id}', 'raw_description', this.value)">${escapeHtml(exp.raw_description)}</textarea>

        <label>Tools or platforms used (comma separated)</label>
        <input type="text"
               placeholder="e.g., recorder, computer, camera, Canva"
               value="${escapeHtml(toolsValue)}"
               onchange="updateExpField('${exp.id}', 'tools_used_str', this.value)">

        <label>Results or outcomes (comma separated)</label>
        <input type="text"
               placeholder="e.g., stories aired, improved engagement"
               value="${escapeHtml(resultsValue)}"
               onchange="updateExpField('${exp.id}', 'results_str', this.value)">

        <div class="button-group">
          <button class="generate-bullets-btn" type="button" onclick="rewriteExperienceWithAI('${exp.id}')">
            ✨ Rewrite into Premium CV Bullets
          </button>
          <button class="remove-exp-btn" type="button" onclick="removeExperience('${exp.id}')">
            Remove
          </button>
        </div>

        <div id="exp_status_${exp.id}" class="helper-text"></div>

        ${
          exp.generated_bullets.length
            ? `
              <div class="bullet-options">
                <p class="bullet-label">Select bullets to include:</p>
                ${exp.generated_bullets.map((bullet, idx) => `
                  <label class="bullet-option">
                    <input type="checkbox"
                           value="${idx}"
                           ${exp.selected_bullets.includes(bullet) ? "checked" : ""}
                           onchange="toggleBullet('${exp.id}', ${idx}, this.checked)">
                    <span>${escapeHtml(bullet)}</span>
                  </label>
                `).join("")}
              </div>
            `
            : `<p class="helper-text">No bullets generated yet for this experience.</p>`
        }
      </div>
    `;
  }).join("");
}

function updateExpField(id, field, value) {
  const exp = appState.experienceEntries.find(item => item.id === id);
  if (!exp) return;

  if (field === "tools_used_str") {
    exp.tools_used = splitCSV(value);
  } else if (field === "results_str") {
    exp.results = splitCSV(value);
  } else {
    exp[field] = value;
  }

  updatePreview();
}

async function rewriteExperienceWithAI(id) {
  const exp = appState.experienceEntries.find(item => item.id === id);
  if (!exp) return;

  saveCurrentStepData();

  const programme = getResolvedProgramme();
  const experienceType = getExperienceTypeLabel(exp.type);
  const role = String(exp.role_title || "").trim();
  const organization = String(exp.organization || "").trim();
  const notes = String(exp.raw_description || "").trim();
  const tools = exp.tools_used.join(", ");
  const results = exp.results.join(", ");

  const statusEl = document.getElementById(`exp_status_${id}`);

  if (!programme) {
    if (statusEl) statusEl.textContent = "Please select or type the student's programme first.";
    return;
  }

  if (!role || !organization || !notes) {
    if (statusEl) statusEl.textContent = "Please fill in role title, organization, and rough notes first.";
    return;
  }

  if (statusEl) statusEl.textContent = "Rewriting experience into premium CV bullets...";

  try {
    const response = await fetch("/.netlify/functions/generate-experience", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        programme,
        experienceType,
        role,
        organization,
        notes,
        tools,
        results
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to rewrite experience.");
    }

    const bullets = Array.isArray(data.experience_bullets)
      ? data.experience_bullets.filter(item => typeof item === "string" && item.trim())
      : [];

    if (!bullets.length) {
      throw new Error("No bullets were generated.");
    }

    exp.generated_bullets = bullets.map(normalizeSentence);
    exp.selected_bullets = [...exp.generated_bullets];

    renderExperienceBuilder();
    updatePreview();

    const freshStatusEl = document.getElementById(`exp_status_${id}`);
    if (freshStatusEl) freshStatusEl.textContent = "Premium CV bullets generated successfully.";
  } catch (error) {
    console.error("rewriteExperienceWithAI error:", error);
    const freshStatusEl = document.getElementById(`exp_status_${id}`);
    if (freshStatusEl) {
      freshStatusEl.textContent = `AI rewrite failed: ${error.message || "Unknown error."}`;
    }
  }
}

function toggleBullet(id, idx, checked) {
  const exp = appState.experienceEntries.find(item => item.id === id);
  if (!exp) return;

  const bullet = exp.generated_bullets[idx];
  if (!bullet) return;

  if (checked) {
    if (!exp.selected_bullets.includes(bullet)) exp.selected_bullets.push(bullet);
  } else {
    exp.selected_bullets = exp.selected_bullets.filter(item => item !== bullet);
  }

  updatePreview();
}

function removeExperience(id) {
  const exp = appState.experienceEntries.find(item => item.id === id);
  if (!exp) return;

  appState.experienceEntries = appState.experienceEntries.filter(item => item.id !== id);
  appState.selectedExperiences = appState.selectedExperiences.filter(item => item !== exp.type);

  const card = document.querySelector(`.card[data-type="${exp.type}"]`);
  if (card) card.classList.remove("selected");

  renderExperienceBuilder();
  updatePreview();
}

function getExperienceTypeLabel(type) {
  const labels = {
    internship: "Internship",
    volunteering: "Volunteering",
    student_leadership: "Student Leadership",
    campus_media: "Campus Media",
    small_business: "Small Business",
    research_project: "Research Project",
    teaching_practice: "Teaching Practice",
    event_organizing: "Event Organizing",
    class_representative: "Class Representative",
    faith_based_service: "Faith-Based Service"
  };
  return labels[type] || type;
}

function updateSkillsForProgramme() {
  const programmeData = getCurrentProgrammeData();
  const container = document.getElementById("skillsContainer");
  if (!container) return;

  const skillsSource = programmeData?.skills || DEFAULT_FALLBACK_SKILLS;
  let html = "";

  for (const [category, skills] of Object.entries(skillsSource)) {
    html += `<div class="skill-category"><h4>${escapeHtml(category)}</h4><div class="skill-checkboxes">`;
    skills.forEach(skill => {
      const checked = (appState.selectedSkills[category] || []).includes(skill) ? "checked" : "";
      html += `
        <label class="skill-checkbox">
          <input type="checkbox"
                 data-category="${escapeHtml(category)}"
                 data-skill="${escapeHtml(skill)}"
                 ${checked}
                 onchange="toggleSkill(this)">
          ${escapeHtml(normalizeSkillLabel(skill))}
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
  if (!category || !skill) return;

  if (!appState.selectedSkills[category]) {
    appState.selectedSkills[category] = [];
  }

  if (checkbox.checked) {
    if (!appState.selectedSkills[category].includes(skill)) {
      appState.selectedSkills[category].push(skill);
    }
  } else {
    appState.selectedSkills[category] = appState.selectedSkills[category].filter(item => item !== skill);
  }

  updatePreview();
}

function addEducation() {
  const container = document.getElementById("educationList");
  if (!container) return;

  const entry = document.createElement("div");
  entry.className = "education-entry entry-card";
  entry.innerHTML = `
    <input type="text" placeholder="Institution" class="edu-institution">
    <input type="text" placeholder="Programme / Degree / Diploma" class="edu-programme">
    <div class="date-row">
      <input type="text" placeholder="Start Date (MM/YYYY or year)" class="edu-start">
      <input type="text" placeholder="End Date (MM/YYYY, year, or Present)" class="edu-end">
    </div>
    <input type="text" placeholder="GPA / Classification (Optional)" class="edu-gpa">
    <textarea placeholder="Relevant Courses (comma separated)" class="edu-courses" rows="2"></textarea>
    <textarea placeholder="Final Project / Thesis (Optional)" class="edu-project" rows="2"></textarea>
    <button class="remove-btn" onclick="this.closest('.education-entry').remove(); updatePreview();">Remove</button>
  `;
  container.appendChild(entry);
}

function addProject() {
  const container = document.getElementById("projectsList");
  if (!container) return;

  const id = Date.now();

  appState.projects.push({
    id,
    title: "",
    organization: "",
    role: "",
    start_date: "",
    end_date: "",
    description: ""
  });

  const entry = document.createElement("div");
  entry.className = "project-entry entry-card";
  entry.innerHTML = `
    <input type="text" placeholder="Project / Leadership Title" onchange="updateProject(${id}, 'title', this.value)">
    <input type="text" placeholder="Organization / Group" onchange="updateProject(${id}, 'organization', this.value)">
    <input type="text" placeholder="Your Role" onchange="updateProject(${id}, 'role', this.value)">
    <div class="date-row">
      <input type="text" placeholder="Start Date" onchange="updateProject(${id}, 'start_date', this.value)">
      <input type="text" placeholder="End Date" onchange="updateProject(${id}, 'end_date', this.value)">
    </div>
    <textarea placeholder="Description / Key achievements" rows="3" onchange="updateProject(${id}, 'description', this.value)"></textarea>
    <button class="remove-btn" onclick="this.closest('.project-entry').remove(); removeProject(${id})">Remove</button>
  `;
  container.appendChild(entry);
}

function updateProject(id, field, value) {
  const project = appState.projects.find(item => item.id === id);
  if (!project) return;
  project[field] = value;
  updatePreview();
}

function removeProject(id) {
  appState.projects = appState.projects.filter(item => item.id !== id);
  updatePreview();
}

function generateSummaries() {
  saveCurrentStepData();

  const programme = getResolvedProgramme() || "student";
  const targetRoleRaw = appState.profile.target_job_title || "entry-level position";
  const targetRole = normalizeTargetRolePhrase(targetRoleRaw);
  const sector = normalizeSectorPhrase(appState.profile.preferred_sector || "professional");
  const profileStageLabel = getProfileStageLabel(appState.profile.profile_stage);

  const allSkills = uniqueCleanList(Object.values(appState.selectedSkills).flat()).map(normalizeSkillLabel);
  const skill1 = allSkills[0] || "communication";
  const skill2 = allSkills[1] || "organization";
  const skill3 = allSkills[2] || "teamwork";

  const exposures = appState.experienceEntries
    .map(item => normalizeTitleCase(item.role_title || getExperienceTypeLabel(item.type)))
    .filter(Boolean);

  const exposure1 = exposures[0] || "academic projects";
  const exposure2 = exposures[1] || "student activities";

  const interest1 = normalizeTargetRolePhrase(appState.profile.career_interests?.[0] || "professional growth");
  const interest2 = normalizeTargetRolePhrase(appState.profile.career_interests?.[1] || "practical learning");

  const templates = [
    "Motivated {programme} student with practical interest in {interest_area_1} and {interest_area_2}. Skilled in {skill_1}, {skill_2}, and {skill_3} through academic work, student activities, and hands-on experience. Seeking an opportunity to apply these skills in a professional {sector} environment.",
    "{profile_stage_label} in {programme} with strengths in {skill_1}, {skill_2}, and {skill_3}. Experienced in {exposure_1} and {exposure_2}, with strong interest in {target_role}. Ready to contribute and grow in a practical work setting."
  ];

  appState.summaryOptions = templates.map(template => {
    let text = template
      .replaceAll("{programme}", normalizeProgrammeName(programme))
      .replaceAll("{target_role}", targetRole)
      .replaceAll("{sector}", sector)
      .replaceAll("{profile_stage_label}", profileStageLabel)
      .replaceAll("{skill_1}", skill1)
      .replaceAll("{skill_2}", skill2)
      .replaceAll("{skill_3}", skill3)
      .replaceAll("{exposure_1}", exposure1)
      .replaceAll("{exposure_2}", exposure2)
      .replaceAll("{interest_area_1}", interest1)
      .replaceAll("{interest_area_2}", interest2);

    text = text.replace(/\bprofessional professional\b/gi, "professional");
    return normalizeSummaryText(text);
  });

  if (!appState.selectedSummary && appState.summaryOptions.length) {
    appState.selectedSummary = appState.summaryOptions[0];
  }

  renderSummaryOptions();
  updatePreview();
}

function renderSummaryOptions() {
  const container = document.getElementById("summaryOptions");
  if (!container) return;

  if (!appState.summaryOptions.length) {
    container.innerHTML = "<p class='helper-text'>No summaries generated yet.</p>";
    return;
  }

  container.innerHTML = appState.summaryOptions.map((summary, idx) => {
    const selected = appState.selectedSummary === summary ? "selected" : "";
    return `
      <div class="summary-option ${selected}" onclick="selectSummary(${idx})">
        <p>${escapeHtml(summary)}</p>
        <span class="select-radio">${selected ? "✓ Selected" : "Select"}</span>
      </div>
    `;
  }).join("");
}

function selectSummary(idx) {
  appState.selectedSummary = appState.summaryOptions[idx] || "";
  renderSummaryOptions();
  updatePreview();
}

function runQualityCheck() {
  saveCurrentStepData();

  let score = 0;
  let maxScore = 0;
  const suggestions = [];

  const summaryText = appState.selectedSummary || "";
  const summaryWords = summaryText.trim() ? summaryText.trim().split(/\s+/).length : 0;

  maxScore += 5;
  if (summaryText.toLowerCase().includes((getResolvedProgramme() || "").toLowerCase())) score += 1;
  else suggestions.push("Your summary should mention your programme.");

  if (appState.profile.target_job_title && summaryText.toLowerCase().includes(appState.profile.target_job_title.toLowerCase())) score += 1;
  else suggestions.push("Add your target role to the summary.");

  if (Object.values(appState.selectedSkills).flat().length >= 2) score += 1;
  else suggestions.push("Select at least 2–3 relevant skills.");

  if (summaryWords > 0 && summaryWords <= 80) score += 1;
  else suggestions.push("Keep the summary under 80 words.");

  if (!hasCliche(summaryText)) score += 1;
  else suggestions.push("Remove clichés from the summary.");

  maxScore += 4;
  const totalSkills = Object.values(appState.selectedSkills).flat().length;

  if (totalSkills > 0) score += 1;
  else suggestions.push("Add relevant skills.");

  if (totalSkills <= 12) score += 1;
  else suggestions.push("Keep skills focused. Too many skills reduce quality.");

  if ((appState.selectedSkills.Digital || []).length > 0) score += 1;
  else suggestions.push("Add at least one digital or technical skill.");

  if (Object.keys(appState.selectedSkills).some(key => (appState.selectedSkills[key] || []).length > 0)) score += 1;

  maxScore += 4;
  const majorExperiences = appState.experienceEntries.filter(item => item.selected_bullets.length > 0);

  if (majorExperiences.some(item => item.selected_bullets.length >= 2)) score += 1;
  else suggestions.push("Add at least two strong bullets for a major experience.");

  if (majorExperiences.some(item => item.selected_bullets.some(startsWithActionVerb))) score += 1;
  else suggestions.push("Use stronger action verbs in your bullets.");

  if (majorExperiences.some(item => item.results.length > 0)) score += 1;
  else suggestions.push("Add one bullet showing a result, contribution, or outcome.");

  if (!hasRepeatedVagueBullets(majorExperiences)) score += 1;
  else suggestions.push("Remove repeated or vague bullets.");

  maxScore += 4;
  if (majorExperiences.every(item => item.selected_bullets.every(b => b.length <= 180))) score += 1;
  else suggestions.push("Shorten long bullets for better readability.");

  if (document.querySelectorAll(".education-entry").length > 0) score += 1;
  else suggestions.push("Add your education details.");

  if (appState.projects.length <= 4) score += 1;
  else suggestions.push("Too many project entries may overcrowd the CV.");

  if (appState.personalDetails.full_name && appState.personalDetails.email) score += 1;

  maxScore += 4;
  score += 4;

  const overallScore = maxScore ? Math.round((score / maxScore) * 100) : 0;

  const container = document.getElementById("qualityReport");
  if (!container) return;

  const finalSuggestions = uniqueCleanList(
    suggestions.length ? suggestions : qualityRules?.suggestions?.slice(0, 2) || []
  );

  container.innerHTML = `
    <div class="score-circle ${overallScore >= 70 ? "high-score" : "low-score"}">${overallScore}%</div>
    <div class="score-label">CV Quality Score</div>
    ${
      finalSuggestions.length
        ? `<ul class="suggestions-list">${finalSuggestions.map(item => `<li>🔧 ${escapeHtml(item)}</li>`).join("")}</ul>`
        : '<p class="success-msg">✓ All quality checks passed. Your CV looks strong.</p>'
    }
    ${
      overallScore >= 70
        ? '<p class="success-msg">✓ Your CV is ready for export.</p>'
        : '<p class="warning-msg">⚠️ Review the suggestions above to improve your CV.</p>'
    }
  `;
}

function saveCurrentStepData() {
  appState.profile.cv_goal = document.getElementById("cvGoal")?.value || appState.profile.cv_goal;
  appState.profile.profile_stage = document.getElementById("profileStage")?.value || appState.profile.profile_stage;

  const selectProgramme = document.getElementById("programmeSelect")?.value || "";
  const customProgramme = document.getElementById("customProgramme")?.value?.trim() || "";

  if (selectProgramme === "__other__") {
    appState.profile.programme = "__other__";
    appState.profile.custom_programme = customProgramme;
  } else {
    appState.profile.programme = selectProgramme || appState.profile.programme;
    appState.profile.custom_programme = "";
  }

  appState.personalDetails = {
    full_name: document.getElementById("fullName")?.value || "",
    email: document.getElementById("email")?.value || "",
    phone: document.getElementById("phone")?.value || "",
    location: document.getElementById("location")?.value || "",
    linkedin: document.getElementById("linkedin")?.value || "",
    photo_enabled: document.getElementById("photoEnabled")?.checked || false
  };

  appState.profile.target_job_title = document.getElementById("targetJobTitle")?.value || "";
  appState.profile.preferred_sector = document.getElementById("preferredSector")?.value || "";
  appState.profile.target_keywords = splitCSV(document.getElementById("targetKeywords")?.value || "");
  appState.profile.career_interests = splitCSV(document.getElementById("careerInterests")?.value || "");
  appState.template = document.getElementById("templateSelect")?.value || "clean";
}

async function handlePayment() {
  saveCurrentStepData();
  updatePreview();

  const email = appState.personalDetails.email;
  const name = appState.personalDetails.full_name;

  if (!email || !name) {
    showMessage("⚠️ Please enter your name and email in Step 2 first.");
    return;
  }

  if (!appState.selectedSummary) {
    showMessage("⚠️ Please generate and select a professional summary in Step 9 first.");
    return;
  }

  const payBtn = document.getElementById("payDownloadBtn");
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.innerText = "Processing...";
  }

  try {
    const cvHtml = document.getElementById("cvPreview")?.innerHTML || "";
    localStorage.setItem("campusCV_Data", JSON.stringify({ html: cvHtml }));

    const response = await fetch("/.netlify/functions/pesapal-submit-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 5000,
        email,
        name
      })
    });

    const res = await response.json();

    if (res.ok && res.redirect_url) {
      window.location.href = res.redirect_url;
      return;
    }

    throw new Error(res.error || "Payment initialization failed");
  } catch (error) {
    console.error("Payment error:", error);
    showMessage(`⚠️ ${error.message || "Payment error. Please try again."}`);
  } finally {
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerText = "💳 Pay & Download PDF";
    }
  }
}

function normalizeTargetRolePhrase(text) {
  let value = cleanSentence(text);
  if (!value) return "";
  value = value.replace(/\bintern\b/gi, "");
  value = value.replace(/\bassistant\b/gi, "");
  value = value.replace(/\s+/g, " ").trim();
  if (!value) return cleanSentence(text);
  return normalizeTitleCase(value);
}

function normalizeSectorPhrase(text) {
  let value = cleanSentence(text);
  if (!value) return "";
  value = value.replace(/\bprofessional\b/gi, "").trim();
  return normalizeTitleCase(value || text);
}

function splitCSV(value) {
  return uniqueCleanList(
    String(value || "")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
  );
}

function uniqueCleanList(list) {
  return [...new Set((list || []).map(item => String(item).trim()).filter(Boolean))];
}

function cleanSentence(input) {
  return String(input || "").trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
}

function replaceKnownMisspellings(text) {
  let value = String(text || "");
  Object.entries(SPELLING_MAP).forEach(([wrong, correct]) => {
    const re = new RegExp(`\\b${wrong}\\b`, "gi");
    value = value.replace(re, correct);
  });
  return value;
}

function normalizeSentence(text) {
  let value = cleanSentence(replaceKnownMisspellings(text));
  if (!value) return "";
  value = value.replace(/\bprofessional professional\b/gi, "professional");
  value = value.replace(/^i\s+/i, "");
  value = value.replace(/\s*,\s*/g, ", ");
  value = value.charAt(0).toUpperCase() + value.slice(1);
  if (!/[.!?]$/.test(value)) value += ".";
  return value;
}

function normalizeSummaryText(text) {
  let value = cleanSentence(replaceKnownMisspellings(text));
  if (!value) return "";
  value = value.replace(/\bTeaching Assistant\b/gi, "teaching");
  value = value.replace(/\bCommunication Officer\b/gi, "communication");
  value = value.replace(/\bJournalism Intern\b/gi, "journalism");
  value = value.replace(/\bCommunications Intern\b/gi, "communications");
  value = value.replace(/\bprofessional professional\b/gi, "professional");
  value = value.replace(/\s+/g, " ");
  value = value.charAt(0).toUpperCase() + value.slice(1);
  return value.replace(/[.]+$/, "");
}

function normalizeProgrammeName(text) {
  let value = cleanSentence(replaceKnownMisspellings(text));
  if (!value) return "";
  value = value.replace(/\bbsc\.\.?/gi, "BSc.");
  value = value.replace(/\bba\.\b/gi, "BA.");
  value = value.replace(/\bo[- ]level\b/gi, "O-Level");
  value = value.replace(/\ba[- ]level\b/gi, "A-Level");
  value = value.replace(/\bcontinuing\b/gi, "Continuing");
  return normalizeTitleCase(value);
}

function normalizeSkillLabel(text) {
  let value = cleanSentence(replaceKnownMisspellings(text));
  if (!value) return "";
  return normalizeTitleCase(value);
}

function normalizeCourseList(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const cleaned = replaceKnownMisspellings(raw).replace(/\s*,\s*/g, ", ").trim();

  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map(item => normalizeTitleCase(item))
      .filter(Boolean)
      .join(", ");
  }

  return normalizeTitleCase(cleaned);
}

function normalizeTitleCase(text) {
  const value = replaceKnownMisspellings(String(text || "").trim());
  if (!value) return "";

  return value
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase();
      if (["and", "of", "in", "the", "for", "to"].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\biuiu\b/g, "IUIU")
    .replace(/\bugx\b/g, "UGX")
    .replace(/\bfm\b/g, "FM")
    .replace(/^./, char => char.toUpperCase());
}

function normalizeDateDisplay(text) {
  const value = String(text || "").trim();
  if (!value) return "";

  const cleaned = replaceKnownMisspellings(value);

  if (/^\d{4}$/.test(cleaned)) return cleaned;

  if (/^\d{1,2}\/\d{4}$/.test(cleaned)) {
    const [month, year] = cleaned.split("/");
    return `${MONTHS[month] || month} ${year}`;
  }

  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleaned)) {
    const parts = cleaned.split(/[-/]/);
    const month = parts[1];
    const year = parts[2];
    return `${MONTHS[month] || month} ${year}`;
  }

  if (/^present$/i.test(cleaned)) return "Present";
  if (/^continuing$/i.test(cleaned)) return "Continuing";

  return normalizeTitleCase(cleaned);
}

function hasCliche(text) {
  const cliches = ["hardworking", "team player", "go-getter", "dynamic individual", "self-starter"];
  const lower = String(text || "").toLowerCase();
  return cliches.some(item => lower.includes(item));
}

function startsWithActionVerb(text) {
  const verbs = [
    "assisted", "supported", "coordinated", "prepared", "organized", "developed",
    "created", "conducted", "facilitated", "managed", "handled", "provided",
    "represented", "maintained", "helped", "reported", "wrote", "interviewed",
    "covered", "edited", "produced", "recorded", "researched", "planned",
    "mobilized", "chaired", "allocated"
  ];
  const lower = String(text || "").trim().toLowerCase();
  return verbs.some(item => lower.startsWith(item));
}

function hasRepeatedVagueBullets(experiences) {
  const allBullets = experiences.flatMap(item => item.selected_bullets || []);
  const normalized = allBullets.map(item => item.trim().toLowerCase());
  return new Set(normalized).size !== normalized.length;
}

function getProfileStageLabel(stage) {
  if (stage === "final_year_student") return "Final year student";
  if (stage === "fresh_graduate") return "Fresh graduate";
  return "Student";
}

function updateProgressBar() {
  const bar = document.getElementById("progressBar");
  const label = document.getElementById("stepIndicator");
  const percent = (appState.currentStep / TOTAL_STEPS) * 100;
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.innerText = `Step ${appState.currentStep} of ${TOTAL_STEPS}`;
}

function hideStep(stepNum) {
  document.getElementById(`step${stepNum}`)?.classList.remove("active");
}

function showStep(stepNum) {
  document.getElementById(`step${stepNum}`)?.classList.add("active");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"]/g, char => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return char;
  });
}

function showMessage(message) {
  alert(message);
}
function nextStep() {
  saveCurrentStepData();

  if (appState.currentStep >= TOTAL_STEPS) return;

  hideStep(appState.currentStep);
  appState.currentStep += 1;
  showStep(appState.currentStep);
  updateProgressBar();

  if (appState.currentStep === 6) {
    renderExperienceBuilder();
  }

  if (appState.currentStep === 7) {
    updateSkillsForProgramme();
  }

  if (appState.currentStep === 9 && !appState.summaryOptions.length) {
    generateSummaries();
  }

  if (appState.currentStep === 11) {
    runQualityCheck();
  }

  updatePreview();
}

function prevStep() {
  if (appState.currentStep <= 1) return;

  hideStep(appState.currentStep);
  appState.currentStep -= 1;
  showStep(appState.currentStep);
  updateProgressBar();
}
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleExperienceCard = toggleExperienceCard;
window.updateExpField = updateExpField;
window.rewriteExperienceWithAI = rewriteExperienceWithAI;
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
window.updatePreview = updatePreview;

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const programmeSelect = document.getElementById("programmeSelect");
  if (programmeSelect) {
    programmeSelect.addEventListener("change", () => {
      toggleCustomProgrammeField();
      saveCurrentStepData();
      updateSkillsForProgramme();
      updatePreview();
    });
  }

  const customProgramme = document.getElementById("customProgramme");
  if (customProgramme) {
    customProgramme.addEventListener("input", () => {
      saveCurrentStepData();
      updateSkillsForProgramme();
    });
  }

  const payBtn = document.getElementById("payDownloadBtn");
  if (payBtn) {
    payBtn.addEventListener("click", handlePayment);
  }
});
