const $ = (id) => document.getElementById(id);

let photoDataUrl = "";
let eduCount = 0;
let expCount = 0;
let refCount = 0;

function splitLines(text) {
  return (text || "").split("\n").map(x => x.trim()).filter(Boolean);
}

function splitComma(text) {
  return (text || "").split(",").map(x => x.trim()).filter(Boolean);
}

function handlePhoto() {
  const file = $("photoInput").files?.[0];
  if (!file) {
    photoDataUrl = "";
    renderPhoto();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    photoDataUrl = reader.result;
    renderPhoto();
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function renderPhoto() {
  const img = $("p_photo");
  const hint = $("p_photoHint");

  if (photoDataUrl) {
    img.src = photoDataUrl;
    img.style.display = "block";
    hint.style.display = "none";
  } else {
    img.style.display = "none";
    hint.style.display = "block";
  }
}

function addEducationItem(prefill = {}) {
  eduCount++;
  const el = document.createElement("div");
  el.className = "itemCard";
  el.innerHTML = `
    <label>Qualification</label>
    <input data-k="qualification" value="${prefill.qualification || ""}">
    <label>Institution</label>
    <input data-k="institution" value="${prefill.institution || ""}">
    <label>Year</label>
    <input data-k="year" value="${prefill.year || ""}">
    <label>Result</label>
    <input data-k="result" value="${prefill.result || ""}">
    <button type="button" class="removeBtn">Remove Education</button>
  `;
  el.querySelector(".removeBtn").onclick = () => {
    el.remove();
    updatePreview();
  };
  el.querySelectorAll("input").forEach(i => i.addEventListener("input", updatePreview));
  $("eduList").appendChild(el);
}

function addExperienceItem(prefill = {}) {
  expCount++;
  const el = document.createElement("div");
  el.className = "itemCard";
  el.innerHTML = `
    <label>Job Title</label>
    <input data-k="jobTitle" value="${prefill.jobTitle || ""}">
    <label>Employer</label>
    <input data-k="employer" value="${prefill.employer || ""}">
    <label>Dates</label>
    <input data-k="dates" value="${prefill.dates || ""}">
    <label>Responsibilities (one per line)</label>
    <textarea data-k="responsibilities">${prefill.responsibilities || ""}</textarea>
    <label>Achievements (one per line)</label>
    <textarea data-k="achievements">${prefill.achievements || ""}</textarea>
    <button type="button" class="removeBtn">Remove Experience</button>
  `;
  el.querySelector(".removeBtn").onclick = () => {
    el.remove();
    updatePreview();
  };
  el.querySelectorAll("input, textarea").forEach(i => i.addEventListener("input", updatePreview));
  $("expList").appendChild(el);
}

function addReferenceItem(prefill = {}) {
  refCount++;
  const el = document.createElement("div");
  el.className = "itemCard";
  el.innerHTML = `
    <label>Name</label>
    <input data-k="name" value="${prefill.name || ""}">
    <label>Title</label>
    <input data-k="title" value="${prefill.title || ""}">
    <label>Phone</label>
    <input data-k="phone" value="${prefill.phone || ""}">
    <label>Email</label>
    <input data-k="email" value="${prefill.email || ""}">
    <button type="button" class="removeBtn">Remove Reference</button>
  `;
  el.querySelector(".removeBtn").onclick = () => {
    el.remove();
    updatePreview();
  };
  el.querySelectorAll("input").forEach(i => i.addEventListener("input", updatePreview));
  $("refList").appendChild(el);
}

function getEducation() {
  return [...$("eduList").querySelectorAll(".itemCard")].map(card => ({
    qualification: card.querySelector('[data-k="qualification"]').value.trim(),
    institution: card.querySelector('[data-k="institution"]').value.trim(),
    year: card.querySelector('[data-k="year"]').value.trim(),
    result: card.querySelector('[data-k="result"]').value.trim()
  })).filter(x => x.qualification || x.institution || x.year || x.result);
}

function getExperiences() {
  return [...$("expList").querySelectorAll(".itemCard")].map(card => ({
    jobTitle: card.querySelector('[data-k="jobTitle"]').value.trim(),
    employer: card.querySelector('[data-k="employer"]').value.trim(),
    dates: card.querySelector('[data-k="dates"]').value.trim(),
    responsibilities: splitLines(card.querySelector('[data-k="responsibilities"]').value),
    achievements: splitLines(card.querySelector('[data-k="achievements"]').value)
  })).filter(x => x.jobTitle || x.employer || x.dates || x.responsibilities.length || x.achievements.length);
}

function getReferences() {
  return [...$("refList").querySelectorAll(".itemCard")].map(card => ({
    name: card.querySelector('[data-k="name"]').value.trim(),
    title: card.querySelector('[data-k="title"]').value.trim(),
    phone: card.querySelector('[data-k="phone"]').value.trim(),
    email: card.querySelector('[data-k="email"]').value.trim()
  })).filter(x => x.name || x.title || x.phone || x.email);
}

function updatePreview() {
  $("p_name").textContent = $("fullName").value.trim() || "Your Name";

  const contacts = [
    $("email").value.trim(),
    $("phone").value.trim(),
    $("location").value.trim()
  ].filter(Boolean).join(" • ");
  $("p_contacts").textContent = contacts;

  $("p_summary").textContent = $("summary").value.trim() || "Write a short job-focused summary.";

  const edu = getEducation();
  $("p_education").innerHTML = edu.length
    ? edu.map(x => `<li>${[x.qualification, x.institution, x.year, x.result].filter(Boolean).join(" — ")}</li>`).join("")
    : "<li>Add your education.</li>";

  const exps = getExperiences();
  $("p_experiences").innerHTML = exps.length
    ? exps.map(x => `
      <div>
        <p><strong>${x.jobTitle || "Experience"}</strong>${x.employer ? " — " + x.employer : ""}${x.dates ? " (" + x.dates + ")" : ""}</p>
        ${x.responsibilities.length ? `<h4>Responsibilities</h4><ul>${x.responsibilities.map(r => `<li>${r}</li>`).join("")}</ul>` : ""}
        ${x.achievements.length ? `<h4>Achievements</h4><ul>${x.achievements.map(a => `<li>${a}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("")
    : "<p>Add your work experience.</p>";

  const skills = [...splitComma($("techSkills").value), ...splitComma($("softSkills").value)];
  $("p_skills").innerHTML = skills.length
    ? skills.map(s => `<span class="tag">${s}</span>`).join("")
    : "<span class='tag'>Add skills</span>";

  const langs = splitLines($("languages").value);
  $("p_languages").innerHTML = langs.length
    ? langs.map(x => `<li>${x}</li>`).join("")
    : "<li>Add languages.</li>";

  const refs = getReferences();
  $("p_references").innerHTML = refs.length
    ? refs.map(x => `<li>${[x.name, x.title, x.phone, x.email].filter(Boolean).join(" | ")}</li>`).join("")
    : "<li>References available upon request.</li>";

  renderPhoto();
}

async function downloadPDF() {
  updatePreview();
  const element = $("cvPreview");
  const name = ($("fullName").value.trim() || "CV").replaceAll(" ", "_");

  await html2pdf().set({
    margin: 0.3,
    filename: `${name}_CV.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  }).from(element).save();
}

function saveDraftToLocal() {
  const draft = {
    fullName: $("fullName").value,
    email: $("email").value,
    phone: $("phone").value,
    location: $("location").value,
    summary: $("summary").value,
    techSkills: $("techSkills").value,
    softSkills: $("softSkills").value,
    languages: $("languages").value,
    photoDataUrl,
    education: getEducation(),
    experiences: getExperiences(),
    references: getReferences()
  };
  localStorage.setItem("campuscv_draft", JSON.stringify(draft));
}

function restoreDraftFromLocal() {
  const raw = localStorage.getItem("campuscv_draft");
  if (!raw) return;

  try {
    const d = JSON.parse(raw);
    $("fullName").value = d.fullName || "";
    $("email").value = d.email || "";
    $("phone").value = d.phone || "";
    $("location").value = d.location || "";
    $("summary").value = d.summary || "";
    $("techSkills").value = d.techSkills || "";
    $("softSkills").value = d.softSkills || "";
    $("languages").value = d.languages || "";
    photoDataUrl = d.photoDataUrl || "";

    $("eduList").innerHTML = "";
    $("expList").innerHTML = "";
    $("refList").innerHTML = "";

    (d.education || []).forEach(addEducationItem);
    (d.experiences || []).forEach(x => addExperienceItem({
      ...x,
      responsibilities: (x.responsibilities || []).join("\n"),
      achievements: (x.achievements || []).join("\n")
    }));
    (d.references || []).forEach(addReferenceItem);
  } catch {}
}

async function payAndDownload() {
  updatePreview();

  const amount = Number($("price").value || 3000);
  const email = $("email").value.trim();
  const name = $("fullName").value.trim();

  if (!name || !email) {
    alert("Please enter your full name and email first.");
    return;
  }

  saveDraftToLocal();

  const res = await fetch("/.netlify/functions/pesapal-submit-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      email,
      name,
      description: "CampusCV PDF Download"
    })
  });

  const data = await res.json();

  const redirect =
    data?.data?.redirect_url ||
    data?.data?.data?.redirect_url ||
    data?.redirect_url;

  if (!redirect) {
    alert("Failed to start payment.");
    return;
  }

  window.location.href = redirect;
}

function resetAll() {
  if (!confirm("Clear all fields?")) return;

  ["fullName","email","phone","location","summary","techSkills","softSkills","languages"].forEach(id => {
    $(id).value = "";
  });

  $("eduList").innerHTML = "";
  $("expList").innerHTML = "";
  $("refList").innerHTML = "";

  photoDataUrl = "";
  $("photoInput").value = "";

  addEducationItem();
  addExperienceItem();
  addReferenceItem({ name: "References available upon request" });

  localStorage.removeItem("campuscv_draft");
  updatePreview();
}

document.addEventListener("DOMContentLoaded", () => {
  restoreDraftFromLocal();

  if ($("eduList").children.length === 0) addEducationItem();
  if ($("expList").children.length === 0) addExperienceItem();
  if ($("refList").children.length === 0) addReferenceItem({ name: "References available upon request" });

  $("photoInput").addEventListener("change", handlePhoto);
  $("addEduBtn").addEventListener("click", () => addEducationItem());
  $("addExpBtn").addEventListener("click", () => addExperienceItem());
  $("addRefBtn").addEventListener("click", () => addReferenceItem());

  $("updatePreviewBtn").addEventListener("click", updatePreview);
  $("payDownloadBtn").addEventListener("click", payAndDownload);
  $("resetBtn").addEventListener("click", resetAll);

  ["fullName","email","phone","location","summary","techSkills","softSkills","languages","price"].forEach(id => {
    $(id).addEventListener("input", updatePreview);
  });

  updatePreview();
});