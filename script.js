// ========================================
// CAMPUS CV BUILDER - CLEAN REWRITE V3
// Diploma + Bachelor's launch version
// ========================================

// -----------------------------
// GLOBAL STATE
// -----------------------------
const TOTAL_STEPS = 12;

const appState = {
  currentStep: 1,
  profile: {
    cv_goal: "internship",
    profile_stage: "final_year_student",
    programme: "",
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
  selectedSummary: "",
  summaryOptions: [],
  template: "clean"
};

let programmesData = {};
let experienceMappings = {};
let summaryTemplates = {};
let qualityRules = {};

// -----------------------------
// DATA LOADING
// -----------------------------
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
    showMessage("⚠️ Failed to load app data. Please check your JSON files and file paths.");
  }
}

// -----------------------------
// INITIALIZATION
// -----------------------------
function initProgrammeSelect() {
  const select = document.getElementById("programmeSelect");
  if (!select) return;

  const programmeNames = Object.keys(programmesData);
  if (!programmeNames.length) return;

  const currentValue = select.value;
  select.innerHTML = `
    <option value="">Select your programme</option>
    ${programmeNames
      .sort((a, b) => a.localeCompare(b))
      .map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
      .join("")}
  `;

  if (currentValue && programmesData[currentValue]) {
    select.value = currentValue;
    appState.profile.programme = currentValue;
  } else {
    select.value = programmeNames[0];
    appState.profile.programme = programmeNames[0];
  }
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

  container.innerHTML = experienceTypes
    .map(
      type => `
      <div class="card ${appState.selectedExperiences.includes(type.id) ? "selected" : ""}" 
           data-type="${type.id}" 
           onclick="toggleExperienceCard('${type.id}')">
        <div class="card-header">
          <span class="card-icon">${type.label}</span>
          <span class="checkmark"></span>
        </div>
        <p class="card-desc">${type.desc}</p>
      </div>
    `
    )
    .join("");
}

// -----------------------------
// PROGRAMME-BASED SUGGESTIONS
// -----------------------------
function getCurrentProgrammeData() {
  const programme =
    document.getElementById("programmeSelect")?.value || appState.profile.programme;
  return programmesData[programme] || null;
}

function aiSuggestKeywords() {
  saveCurrentStepData();

  const programmeData = getCurrentProgrammeData();
  if (!programmeData) {
    showMessage("⚠️ Please select your programme first.");
    return;
  }

  const targetRole =
    document.getElementById("targetJobTitle")?.value || appState.profile.target_job_title || "";

  const keywords = [];
  const interests = [];

  // skills → keyword pool
  if (programmeData.skills) {
    Object.values(programmeData.skills).forEach(list => {
      if (Array.isArray(list)) {
        list.slice(0, 2).forEach(item => keywords.push(item));
      }
    });
  }

  // target roles → interests
  if (Array.isArray(programmeData.target_roles)) {
    programmeData.target_roles.slice(0, 4).forEach(role => interests.push(role));
  }

  // summary keywords
  if (Array.isArray(programmeData.summary_keywords)) {
    programmeData.summary_keywords.forEach(k => interests.push(k));
  }

  // boost for target role
  if (targetRole) {
    keywords.push(targetRole);
    interests.unshift(targetRole);
  }

  const uniqueKeywords = uniqueCleanList(keywords).slice(0, 6);
  const uniqueInterests = uniqueCleanList(interests).slice(0, 4);

  const targetKeywordsInput = document.getElementById("targetKeywords");
  const careerInterestsInput = document.getElementById("careerInterests");

  if (targetKeywordsInput) targetKeywordsInput.value = uniqueKeywords.join(", ");
  if (careerInterestsInput) careerInterestsInput.value = uniqueInterests.join(", ");

  appState.profile.target_keywords = uniqueKeywords;
  appState.profile.career_interests = uniqueInterests;

  showMessage("✨ Suggested keywords and interests added. You can edit them.");
}

// -----------------------------
// EXPERIENCE DISCOVERY + BUILDER
// -----------------------------
function toggleExperienceCard(type) {
  const card = document.querySelector(`.card[data-type="${type}"]`);
  if (!card) return;

  const isSelected = card.classList.contains("selected");

  if (isSelected) {
    card.classList.remove("selected");
    appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== type);

    const removedExp = appState.experienceEntries.find(e => e.type === type);
    if (removedExp) {
      appState.experienceEntries = appState.experienceEntries.filter(e => e.type !== type);
    }
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
  const existing = appState.experienceEntries.find(e => e.type === type);
  if (existing) return;

  appState.experienceEntries.push({
    id: String(Date.now() + Math.random()),
    type,
    role_title: "",
    organization: "",
    start_date: "",
    end_date: "",
    is_current: false,
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
    container.innerHTML =
      '<p class="helper-text">No experiences selected yet. Go to Step 5 and choose what you have done.</p>';
    return;
  }

  container.innerHTML = appState.experienceEntries
    .map(exp => {
      const toolsValue = Array.isArray(exp.tools_used) ? exp.tools_used.join(", ") : "";
      const resultsValue = Array.isArray(exp.results) ? exp.results.join(", ") : "";

      return `
        <div class="experience-builder-card" data-id="${exp.id}">
          <h4>${escapeHtml(getExperienceTypeLabel(exp.type))}</h4>

          <input type="text"
                 placeholder="Role Title (e.g., Campus Media Volunteer)"
                 value="${escapeHtml(exp.role_title)}"
                 onchange="updateExpField('${exp.id}', 'role_title', this.value)">

          <input type="text"
                 placeholder="Organization"
                 value="${escapeHtml(exp.organization)}"
                 onchange="updateExpField('${exp.id}', 'organization', this.value)">

          <div class="date-row">
            <input type="text"
                   placeholder="Start Date (MM/YYYY)"
                   value="${escapeHtml(exp.start_date)}"
                   onchange="updateExpField('${exp.id}', 'start_date', this.value)">
            <input type="text"
                   placeholder="End Date (MM/YYYY or Present)"
                   value="${escapeHtml(exp.end_date)}"
                   onchange="updateExpField('${exp.id}', 'end_date', this.value)">
          </div>

          <textarea placeholder="What did you do? Write in simple words."
                    rows="3"
                    onchange="updateExpField('${exp.id}', 'raw_description', this.value)">${escapeHtml(exp.raw_description)}</textarea>

          <input type="text"
                 placeholder="Tools or platforms used (comma separated)"
                 value="${escapeHtml(toolsValue)}"
                 onchange="updateExpField('${exp.id}', 'tools_used_str', this.value)">

          <input type="text"
                 placeholder="Results or outcomes (comma separated)"
                 value="${escapeHtml(resultsValue)}"
                 onchange="updateExpField('${exp.id}', 'results_str', this.value)">

          <button class="generate-bullets-btn" onclick="generateBullets('${exp.id}')">
            ✨ Generate Professional Bullets
          </button>

          ${
            exp.generated_bullets.length
              ? `
            <div class="bullet-options">
              <p class="bullet-label">Select bullets to include:</p>
              ${exp.generated_bullets
                .map((bullet, idx) => {
                  const checked = exp.selected_bullets.includes(bullet) ? "checked" : "";
                  return `
                    <label class="bullet-option">
                      <input type="checkbox"
                             value="${idx}"
                             ${checked}
                             onchange="toggleBullet('${exp.id}', ${idx}, this.checked)">
                      <span>${escapeHtml(bullet)}</span>
                    </label>
                  `;
                })
                .join("")}
            </div>
          `
              : ""
          }

          <button class="remove-exp-btn" onclick="removeExperience('${exp.id}')">Remove</button>
        </div>
      `;
    })
    .join("");
}

function updateExpField(id, field, value) {
  const exp = appState.experienceEntries.find(e => e.id === id);
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

function generateBullets(id) {
  const exp = appState.experienceEntries.find(e => e.id === id);
  if (!exp) return;

  const mapped = experienceMappings[exp.type] || [];
  const programmeData = getCurrentProgrammeData();

  let generated = [];

  // 1. mapped bullets
  if (mapped.length) {
    generated.push(...mapped.slice(0, 2));
  }

  // 2. programme experience suggestions
  if (programmeData?.experience_suggestions) {
    Object.values(programmeData.experience_suggestions).forEach(list => {
      if (Array.isArray(list)) generated.push(...list.slice(0, 1));
    });
  }

  // 3. dynamic bullets from user input
  if (exp.raw_description) {
    generated.push(buildDynamicBullet(exp));
  }

  if (exp.tools_used.length) {
    generated.push(
      `Used ${exp.tools_used.join(", ")} to complete tasks and strengthen practical professional skills.`
    );
  }

  if (exp.results.length) {
    generated.push(
      `Contributed to ${exp.results.join(", ")} through active participation, coordination, and follow-up.`
    );
  }

  // Clean + unique
  generated = uniqueCleanList(generated)
    .filter(Boolean)
    .slice(0, 4);

  if (!generated.length) {
    generated = [
      "Supported day-to-day tasks in an organized working or learning environment.",
      "Built practical experience through active participation and teamwork.",
      "Demonstrated willingness to learn and contribute effectively."
    ];
  }

  exp.generated_bullets = generated;
  exp.selected_bullets = [...generated];

  renderExperienceBuilder();
  updatePreview();
}

function buildDynamicBullet(exp) {
  const role = exp.role_title || getExperienceTypeLabel(exp.type).toLowerCase();
  const description = cleanSentence(exp.raw_description);

  if (!description) {
    return `Supported ${role.toLowerCase()} responsibilities through organized participation and communication.`;
  }

  return `${capitalizeFirst(
    getActionVerb(description.toLowerCase())
  )} ${role.toLowerCase()} responsibilities including ${description.toLowerCase()}.`;
}

function toggleBullet(id, idx, isChecked) {
  const exp = appState.experienceEntries.find(e => e.id === id);
  if (!exp) return;

  const bullet = exp.generated_bullets[idx];
  if (!bullet) return;

  if (isChecked) {
    if (!exp.selected_bullets.includes(bullet)) {
      exp.selected_bullets.push(bullet);
    }
  } else {
    exp.selected_bullets = exp.selected_bullets.filter(b => b !== bullet);
  }

  updatePreview();
}

function removeExperience(id) {
  const exp = appState.experienceEntries.find(e => e.id === id);
  if (!exp) return;

  appState.experienceEntries = appState.experienceEntries.filter(e => e.id !== id);
  appState.selectedExperiences = appState.selectedExperiences.filter(t => t !== exp.type);

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

// -----------------------------
// SKILLS
// -----------------------------
function updateSkillsForProgramme() {
  const programme =
    document.getElementById("programmeSelect")?.value || appState.profile.programme;
  const programmeData = programmesData[programme];
  const container = document.getElementById("skillsContainer");

  if (!programmeData || !container) return;

  const allSkills = programmeData.skills || {};
  let html = "";

  for (const [category, skills] of Object.entries(allSkills)) {
    html += `<div class="skill-category"><h4>${escapeHtml(category)}</h4><div class="skill-checkboxes">`;

    skills.forEach(skill => {
      const isSelected = (appState.selectedSkills[category] || []).includes(skill);
      html += `
        <label class="skill-checkbox">
          <input type="checkbox"
                 data-category="${escapeHtml(category)}"
                 data-skill="${escapeHtml(skill)}"
                 ${isSelected ? "checked" : ""}
                 onchange="toggleSkill(this)">
          ${escapeHtml(skill)}
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
    appState.selectedSkills[category] = appState.selectedSkills[category].filter(s => s !== skill);
  }

  updatePreview();
}

// -----------------------------
// EDUCATION
// -----------------------------
function addEducation() {
  const container = document.getElementById("educationList");
  if (!container) return;

  const newEntry = document.createElement("div");
  newEntry.className = "education-entry entry-card";
  newEntry.innerHTML = `
    <input type="text" placeholder="Institution" class="edu-institution">
    <input type="text" placeholder="Programme / Degree / Diploma" class="edu-programme">
    <div class="date-row">
      <input type="text" placeholder="Start Date (MM/YYYY)" class="edu-start">
      <input type="text" placeholder="End Date (MM/YYYY)" class="edu-end">
    </div>
    <input type="text" placeholder="GPA / Classification (Optional)" class="edu-gpa">
    <textarea placeholder="Relevant Courses (comma separated)" class="edu-courses" rows="2"></textarea>
    <textarea placeholder="Final Project / Thesis (Optional)" class="edu-project" rows="2"></textarea>
    <button class="remove-btn" onclick="this.closest('.education-entry').remove(); updatePreview();">Remove</button>
  `;
  container.appendChild(newEntry);
}

// -----------------------------
// PROJECTS / LEADERSHIP
// -----------------------------
function addProject() {
  const container = document.getElementById("projectsList");
  if (!container) return;

  const projectId = Date.now();

  appState.projects.push({
    id: projectId,
    title: "",
    organization: "",
    role: "",
    start_date: "",
    end_date: "",
    description: ""
  });

  const newEntry = document.createElement("div");
  newEntry.className = "project-entry entry-card";
  newEntry.innerHTML = `
    <input type="text" placeholder="Project / Leadership Title" onchange="updateProject(${projectId}, 'title', this.value)">
    <input type="text" placeholder="Organization / Group" onchange="updateProject(${projectId}, 'organization', this.value)">
    <input type="text" placeholder="Your Role" onchange="updateProject(${projectId}, 'role', this.value)">
    <div class="date-row">
      <input type="text" placeholder="Start Date" onchange="updateProject(${projectId}, 'start_date', this.value)">
      <input type="text" placeholder="End Date" onchange="updateProject(${projectId}, 'end_date', this.value)">
    </div>
    <textarea placeholder="Description / Key achievements" rows="3" onchange="updateProject(${projectId}, 'description', this.value)"></textarea>
    <button class="remove-btn" onclick="this.closest('.project-entry').remove(); removeProject(${projectId})">Remove</button>
  `;
  container.appendChild(newEntry);
}

function updateProject(id, field, value) {
  const project = appState.projects.find(p => p.id === id);
  if (!project) return;
  project[field] = value;
  updatePreview();
}

function removeProject(id) {
  appState.projects = appState.projects.filter(p => p.id !== id);
  updatePreview();
}

// -----------------------------
// SUMMARIES
// -----------------------------
function generateSummaries() {
  saveCurrentStepData();

  const programme = appState.profile.programme || "student";
  const targetRole = appState.profile.target_job_title || "entry-level position";
  const sector = appState.profile.preferred_sector || "professional";
  const profileStageLabel = getProfileStageLabel(appState.profile.profile_stage);

  const allSkills = uniqueCleanList(Object.values(appState.selectedSkills).flat());
  const skill1 = allSkills[0] || "communication";
  const skill2 = allSkills[1] || "organization";
  const skill3 = allSkills[2] || "teamwork";

  const exposures = appState.experienceEntries
    .map(e => e.role_title || getExperienceTypeLabel(e.type))
    .filter(Boolean);

  const exposure1 = exposures[0] || "academic projects";
  const exposure2 = exposures[1] || "student activities";

  const interests = appState.profile.career_interests || [];
  const interest1 = interests[0] || "professional growth";
  const interest2 = interests[1] || "practical learning";

  const activityOrProject =
    appState.projects[0]?.title || appState.educationList?.[0]?.project || "academic work";

  const templates =
    summaryTemplates.internship_focused && Array.isArray(summaryTemplates.internship_focused)
      ? summaryTemplates.internship_focused
      : [
          "Motivated {programme} student with practical interest in {interest_area_1} and {interest_area_2}. Skilled in {skill_1}, {skill_2}, and {skill_3} through academic work, student activities, and hands-on experience. Seeking an opportunity to apply these skills in a professional {sector} environment.",
          "{profile_stage_label} in {programme} with strengths in {skill_1}, {skill_2}, and {skill_3}. Experienced in {exposure_1} and {exposure_2}, with a strong interest in {target_role}. Eager to contribute, learn, and grow in a practical work setting."
        ];

  appState.summaryOptions = templates.map(template =>
    template
      .replaceAll("{programme}", programme)
      .replaceAll("{target_role}", targetRole)
      .replaceAll("{sector}", sector)
      .replaceAll("{profile_stage_label}", profileStageLabel)
      .replaceAll("{skill_1}", skill1)
      .replaceAll("{skill_2}", skill2)
      .replaceAll("{skill_3}", skill3)
      .replaceAll("{exposure_1}", exposure1)
      .replaceAll("{exposure_2}", exposure2)
      .replaceAll("{interest_area_1}", interest1)
      .replaceAll("{interest_area_2}", interest2)
      .replaceAll("{sector_or_role}", sector || targetRole)
      .replaceAll("{activity_or_project}", activityOrProject)
      .replaceAll("{achievement_1}", "apply practical skills")
  );

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

  container.innerHTML = appState.summaryOptions
    .map((summary, idx) => {
      const selected = appState.selectedSummary === summary ? "selected" : "";
      return `
        <div class="summary-option ${selected}" onclick="selectSummary(${idx})">
          <p>${escapeHtml(summary)}</p>
          <span class="select-radio">${selected ? "✓ Selected" : "Select"}</span>
        </div>
      `;
    })
    .join("");
}

function selectSummary(idx) {
  appState.selectedSummary = appState.summaryOptions[idx] || "";
  renderSummaryOptions();
  updatePreview();
}

function getProfileStageLabel(stage) {
  if (stage === "final_year_student") return "Final year student";
  if (stage === "fresh_graduate") return "Fresh graduate";
  return "Student";
}

// -----------------------------
// QUALITY CHECK
// -----------------------------
function runQualityCheck() {
  saveCurrentStepData();

  let score = 0;
  let maxScore = 0;
  const suggestions = [];

  // Summary strength
  const summaryText = appState.selectedSummary || "";
  const summaryWords = summaryText.trim() ? summaryText.trim().split(/\s+/).length : 0;
  maxScore += 5;

  if (summaryText.toLowerCase().includes((appState.profile.programme || "").toLowerCase())) score += 1;
  else suggestions.push("Your summary should mention your programme.");

  if (
    appState.profile.target_job_title &&
    summaryText.toLowerCase().includes(appState.profile.target_job_title.toLowerCase())
  ) score += 1;
  else suggestions.push("Add your target role to the summary.");

  if (Object.values(appState.selectedSkills).flat().length >= 2) score += 1;
  else suggestions.push("Select at least 2–3 relevant skills.");

  if (summaryWords > 0 && summaryWords <= 80) score += 1;
  else suggestions.push("Keep the summary under 80 words.");

  if (!hasCliche(summaryText)) score += 1;
  else suggestions.push("Remove clichés from the summary.");

  // Skills relevance
  maxScore += 4;
  const totalSkills = Object.values(appState.selectedSkills).flat().length;

  if (totalSkills > 0) score += 1;
  else suggestions.push("Add relevant skills.");

  if (totalSkills <= 12) score += 1;
  else suggestions.push("Keep skills focused. Too many skills reduce quality.");

  if ((appState.selectedSkills.Digital || []).length > 0) score += 1;
  else suggestions.push("Add at least one digital or technical skill.");

  if (Object.keys(appState.selectedSkills).some(cat => (appState.selectedSkills[cat] || []).length > 0)) score += 1;

  // Experience strength
  maxScore += 4;
  const majorExperiences = appState.experienceEntries.filter(e => e.selected_bullets.length > 0);

  if (majorExperiences.some(e => e.selected_bullets.length >= 2)) score += 1;
  else suggestions.push("Add at least two strong bullets for a major experience.");

  if (majorExperiences.some(e => e.selected_bullets.some(b => startsWithActionVerb(b)))) score += 1;
  else suggestions.push("Use stronger action verbs in your bullets.");

  if (majorExperiences.some(e => e.results.length > 0 || e.selected_bullets.some(b => /improved|supported|contributed|managed|organized/i.test(b)))) score += 1;
  else suggestions.push("Add one bullet showing a result, contribution, or outcome.");

  if (!hasRepeatedVagueBullets(majorExperiences)) score += 1;
  else suggestions.push("Remove repeated or vague bullets.");

  // Readability
  maxScore += 4;
  if (majorExperiences.every(e => e.selected_bullets.every(b => b.length <= 160))) score += 1;
  else suggestions.push("Shorten long bullets for better readability.");

  if (document.querySelectorAll(".education-entry").length > 0) score += 1;
  else suggestions.push("Add your education details.");

  if (appState.projects.length <= 4) score += 1;
  else suggestions.push("Too many project entries may overcrowd the CV.");

  if (appState.personalDetails.full_name && appState.personalDetails.email) score += 1;

  // ATS readiness
  maxScore += 4;
  score += 4; // current builder is plain HTML content, so this is mostly okay

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
        ? `<ul class="suggestions-list">${finalSuggestions.map(s => `<li>🔧 ${escapeHtml(s)}</li>`).join("")}</ul>`
        : '<p class="success-msg">✓ All quality checks passed. Your CV looks strong.</p>'
    }
    ${
      overallScore >= 70
        ? '<p class="success-msg">✓ Your CV is ready for export.</p>'
        : '<p class="warning-msg">⚠️ Review the suggestions above to improve your CV.</p>'
    }
  `;
}

// -----------------------------
// PREVIEW
// -----------------------------
function updatePreview() {
  setText("p_name", (appState.personalDetails.full_name || "YOUR NAME").toUpperCase());
  setHTML(
    "p_contacts",
    `${escapeHtml(appState.personalDetails.email || "email@example.com")} | ${escapeHtml(
      appState.personalDetails.phone || "+123456789"
    )} | ${escapeHtml(appState.personalDetails.location || "Location")}`
  );

  setText(
    "p_summary",
    appState.selectedSummary || "Complete the steps to generate your professional summary."
  );

  updateEducationPreview();
  updateSkillsPreview();
  updateExperiencePreview();
  updateProjectsPreview();
  applyTemplate();
}

function updateEducationPreview() {
  const eduElements = document.querySelectorAll(".education-entry");
  let eduHtml = "";

  eduElements.forEach(edu => {
    const institution = edu.querySelector(".edu-institution")?.value || "";
    const programme = edu.querySelector(".edu-programme")?.value || "";
    const start = edu.querySelector(".edu-start")?.value || "";
    const end = edu.querySelector(".edu-end")?.value || "";
    const gpa = edu.querySelector(".edu-gpa")?.value || "";
    const courses = edu.querySelector(".edu-courses")?.value || "";
    const project = edu.querySelector(".edu-project")?.value || "";

    if (programme || institution) {
      eduHtml += `
        <div class="education-item">
          <div class="edu-header">
            <strong>${escapeHtml(programme)}</strong>
            <span class="edu-date">${escapeHtml(start)} - ${escapeHtml(end)}</span>
          </div>
          <div class="edu-institution">${escapeHtml(institution)}</div>
          ${gpa ? `<div class="edu-gpa-display">GPA/Classification: ${escapeHtml(gpa)}</div>` : ""}
          ${courses ? `<div class="edu-courses-display"><em>Relevant Courses:</em> ${escapeHtml(courses)}</div>` : ""}
          ${project ? `<div class="edu-project-display"><em>Project/Thesis:</em> ${escapeHtml(project)}</div>` : ""}
        </div>
      `;
    }
  });

  setHTML("p_education", eduHtml || "<p>No education added yet.</p>");
}

function updateSkillsPreview() {
  const skillsHtml = Object.entries(appState.selectedSkills)
    .filter(([_, skills]) => skills.length > 0)
    .map(
      ([category, skills]) =>
        `<div class="skill-group"><strong>${escapeHtml(category)}:</strong> ${escapeHtml(
          skills.join(", ")
        )}</div>`
    )
    .join("");

  setHTML("p_skills", skillsHtml || "<p>Select skills in Step 7.</p>");
}

function updateExperiencePreview() {
  let expHtml = "";

  appState.experienceEntries.forEach(exp => {
    if (exp.selected_bullets.length > 0) {
      const bullets = exp.selected_bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("");
      expHtml += `
        <div class="experience-item">
          <div class="exp-header">
            <strong>${escapeHtml(exp.role_title || getExperienceTypeLabel(exp.type))}</strong>
            <span class="exp-date">${escapeHtml(exp.start_date || "")} - ${escapeHtml(exp.end_date || "Present")}</span>
          </div>
          <div class="exp-organization">${escapeHtml(exp.organization || "")}</div>
          <ul class="exp-bullets">${bullets}</ul>
        </div>
      `;
    }
  });

  setHTML("p_experiences", expHtml || "<p>No experience added yet.</p>");
}

function updateProjectsPreview() {
  let projectsHtml = "";

  appState.projects.forEach(proj => {
    if (proj.title) {
      projectsHtml += `
        <div class="project-item">
          <div class="project-header">
            <strong>${escapeHtml(proj.title)}</strong>
            <span class="project-date">${escapeHtml(proj.start_date || "")} - ${escapeHtml(proj.end_date || "")}</span>
          </div>
          <div class="project-role">${escapeHtml(proj.role || "")}${proj.organization ? " | " + escapeHtml(proj.organization) : ""}</div>
          <div class="project-description">${escapeHtml(proj.description || "")}</div>
        </div>
      `;
    }
  });

  setHTML("p_projects", projectsHtml || "<p>No projects added yet.</p>");
}

function applyTemplate() {
  const cvElement = document.getElementById("cvPreview");
  if (!cvElement) return;
  cvElement.className = `cv ${appState.template || "clean"}-template`;
}

// -----------------------------
// NAVIGATION
// -----------------------------
function nextStep() {
  saveCurrentStepData();

  if (appState.currentStep >= TOTAL_STEPS) return;

  hideStep(appState.currentStep);
  appState.currentStep += 1;
  showStep(appState.currentStep);
  updateProgressBar();

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

function hideStep(stepNum) {
  document.getElementById(`step${stepNum}`)?.classList.remove("active");
}

function showStep(stepNum) {
  document.getElementById(`step${stepNum}`)?.classList.add("active");
}

function updateProgressBar() {
  const bar = document.getElementById("progressBar");
  const label = document.getElementById("stepIndicator");
  const percent = (appState.currentStep / TOTAL_STEPS) * 100;

  if (bar) bar.style.width = `${percent}%`;
  if (label) label.innerText = `Step ${appState.currentStep} of ${TOTAL_STEPS}`;
}

// -----------------------------
// SAVE FORM DATA
// -----------------------------
function saveCurrentStepData() {
  const cvGoal = document.getElementById("cvGoal")?.value;
  const profileStage = document.getElementById("profileStage")?.value;
  const programme = document.getElementById("programmeSelect")?.value;

  if (cvGoal) appState.profile.cv_goal = cvGoal;
  if (profileStage) appState.profile.profile_stage = profileStage;
  if (programme) appState.profile.programme = programme;

  appState.personalDetails = {
    full_name: document.getElementById("fullName")?.value || "",
    email: document.getElementById("email")?.value || "",
    phone: document.getElementById("phone")?.value || "",
    location: document.getElementById("location")?.value || "",
    linkedin: document.getElementById("linkedin")?.value || "",
    photo_enabled: document.getElementById("photoEnabled")?.checked || false
  };

  appState.profile.target_job_title =
    document.getElementById("targetJobTitle")?.value || "";
  appState.profile.preferred_sector =
    document.getElementById("preferredSector")?.value || "";

  appState.profile.target_keywords = splitCSV(
    document.getElementById("targetKeywords")?.value || ""
  );

  appState.profile.career_interests = splitCSV(
    document.getElementById("careerInterests")?.value || ""
  );

  appState.template = document.getElementById("templateSelect")?.value || "clean";
}

// -----------------------------
// PAYMENT
// -----------------------------
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

// -----------------------------
// HELPERS
// -----------------------------
function splitCSV(value) {
  return uniqueCleanList(
    String(value || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  );
}

function uniqueCleanList(list) {
  return [...new Set((list || []).map(item => String(item).trim()).filter(Boolean))];
}

function cleanSentence(input) {
  return String(input || "").trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
}

function capitalizeFirst(str) {
  if (!str) return "Supported";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getActionVerb(text) {
  const verbs = [
    "assisted",
    "supported",
    "coordinated",
    "prepared",
    "organized",
    "developed",
    "created",
    "conducted",
    "facilitated",
    "managed",
    "handled",
    "helped"
  ];

  const lower = String(text || "").toLowerCase();
  for (const verb of verbs) {
    if (lower.includes(verb)) return verb;
  }
  return "supported";
}

function startsWithActionVerb(text) {
  const verbs = [
    "assisted",
    "supported",
    "coordinated",
    "prepared",
    "organized",
    "developed",
    "created",
    "conducted",
    "facilitated",
    "managed",
    "handled",
    "provided",
    "represented",
    "maintained",
    "helped"
  ];
  const lower = String(text || "").trim().toLowerCase();
  return verbs.some(v => lower.startsWith(v));
}

function hasCliche(text) {
  const cliches = [
    "hardworking",
    "team player",
    "go-getter",
    "dynamic individual",
    "self-starter"
  ];
  const lower = String(text || "").toLowerCase();
  return cliches.some(c => lower.includes(c));
}

function hasRepeatedVagueBullets(experiences) {
  const allBullets = experiences.flatMap(e => e.selected_bullets || []);
  const normalized = allBullets.map(b => b.trim().toLowerCase());
  return new Set(normalized).size !== normalized.length;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"]/g, m => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === '"') return "&quot;";
    return m;
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function showMessage(message) {
  alert(message);
}

// -----------------------------
// GLOBAL EXPORTS
// -----------------------------
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

// -----------------------------
// STARTUP
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const programmeSelect = document.getElementById("programmeSelect");
  if (programmeSelect) {
    programmeSelect.addEventListener("change", () => {
      saveCurrentStepData();
      updateSkillsForProgramme();
      updatePreview();
    });
  }

  const payBtn = document.getElementById("payDownloadBtn");
  if (payBtn) {
    payBtn.addEventListener("click", handlePayment);
  }
});// ========================================
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
                        amount: 5000,
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
