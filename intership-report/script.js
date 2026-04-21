// ========================================
// ENHANCED INTERNSHIP REPORT BUILDER
// Grammar Fix + Daily Activity Logger
// ========================================

let currentStep = 1;
let generatedReport = null;

let reportState = {
    student: {},
    organization: {},
    dailyLogs: [],
    achievements: [],
    skills: {},
    challenges: {},
    generated: false
};

// ========================================
// GRAMMAR FIXER & LANGUAGE ENHANCER
// ========================================

function enhanceText(text) {
    if (!text) return text;
    
    let enhanced = text;
    
    // Common grammar issues from student reports
    const fixes = {
        // Capitalization fixes
        /\bi\b/g: 'I',
        /\bmy\s+self\b/gi: 'myself',
        /\buniveristy\b/gi: 'university',
        /\bislmic\b/gi: 'Islamic',
        /\bsuptviser\b/gi: 'supervisor',
        /\bworkmated\b/gi: 'colleagues',
        /\bdrat\b/gi: 'draft',
        /\bwii\b/gi: 'will',
        /\bunaoudteay\b/gi: 'undoubtedly',
        /\bprotessionai\b/gi: 'professional',
        /\btuture\b/gi: 'future',
        /\benaeavors\b/gi: 'endeavors',
        /\baknowledg\b/gi: 'acknowledge',
        /\bappreciat\b/gi: 'appreciate',
        /\bfaive\b/gi: 'five',
        /\bbueural\b/gi: 'bureau',
        /\bdeparts\b/gi: 'departments',
        /\brecieved\b/gi: 'received',
        /\bacieved\b/gi: 'achieved',
        
        // Phrase improvements
        /\bno one else has ever submitted\b/gi: 'and has not been submitted for any other qualification',
        /\bthe bigger picture was achieved\b/gi: 'the overall learning objectives were successfully met',
        /\bthat will not only facilitate during class\b/gi: 'that will benefit both academic studies',
        
        // Professional tone
        /\bthank\b/gi: 'express sincere gratitude to',
        /\bthanks\b/gi: 'sincere thanks',
        
        // Common typos
        /\bteh\b/gi: 'the',
        /\badn\b/gi: 'and',
        /\bwihch\b/gi: 'which',
        /\btehre\b/gi: 'there',
        /\bwhith\b/gi: 'with'
    };
    
    for (const [pattern, replacement] of Object.entries(fixes)) {
        enhanced = enhanced.replace(new RegExp(pattern, 'g'), replacement);
    }
    
    // Capitalize first letter of sentences
    enhanced = enhanced.replace(/([.!?])\s*([a-z])/g, (match, p1, p2) => p1 + ' ' + p2.toUpperCase());
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    return enhanced;
}

function enhanceAllEntries() {
    const titles = document.querySelectorAll('.activity-title');
    const descriptions = document.querySelectorAll('.activity-description');
    const skills = document.querySelectorAll('.activity-skills');
    const challenges = document.querySelectorAll('.activity-challenges');
    
    titles.forEach(t => { if (t.value) t.value = enhanceText(t.value); });
    descriptions.forEach(d => { if (d.value) d.value = enhanceText(d.value); });
    skills.forEach(s => { if (s.value) s.value = enhanceText(s.value); });
    challenges.forEach(c => { if (c.value) c.value = enhanceText(c.value); });
    
    alert('✨ All entries have been enhanced with professional language and corrected grammar!');
}

// ========================================
// NAVIGATION
// ========================================

function nextStep() {
    saveCurrentStepData();
    
    if (currentStep < 10) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`step${currentStep}`).classList.add('active');
        updateProgressBar();
        
        if (currentStep === 8 && reportState.generated) {
            updatePreview();
        } else if (currentStep === 9) {
            runQualityCheck();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`step${currentStep}`).classList.add('active');
        updateProgressBar();
    }
}

function updateProgressBar() {
    const percent = (currentStep / 10) * 100;
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('stepIndicator').innerText = `Step ${currentStep} of 10`;
}

// ========================================
// DYNAMIC FORM FUNCTIONS
// ========================================

function addDailyLog() {
    const container = document.getElementById('dailyLogs');
    const newLog = document.createElement('div');
    newLog.className = 'daily-log entry-card';
    newLog.innerHTML = `
        <div class="date-row">
            <input type="date" class="activity-date">
        </div>
        <textarea placeholder="What activity did you engage in? (e.g., Editorial meeting, story writing)" rows="2" class="activity-title"></textarea>
        <textarea placeholder="Describe what you did in detail..." rows="3" class="activity-description"></textarea>
        <textarea placeholder="What skills did you develop? (e.g., listening, writing, critical thinking)" rows="2" class="activity-skills"></textarea>
        <textarea placeholder="What challenges did you face? How did you overcome them?" rows="2" class="activity-challenges"></textarea>
        <button class="remove-btn" onclick="this.closest('.daily-log').remove()">Remove Day</button>
    `;
    container.appendChild(newLog);
}

function addAchievement() {
    const container = document.getElementById('achievementsList');
    const newAchievement = document.createElement('div');
    newAchievement.className = 'achievement-entry entry-card';
    newAchievement.innerHTML = `
        <input type="text" placeholder="Achievement title" class="achievement-title">
        <textarea placeholder="Describe this achievement..." rows="2" class="achievement-desc"></textarea>
        <button class="remove-btn" onclick="this.closest('.achievement-entry').remove()">Remove</button>
    `;
    container.appendChild(newAchievement);
}

// ========================================
// SAVE DATA
// ========================================

function saveCurrentStepData() {
    // Student details
    reportState.student = {
        name: document.getElementById('studentName')?.value || '',
        id: document.getElementById('studentId')?.value || '',
        university: document.getElementById('university')?.value || '',
        faculty: document.getElementById('faculty')?.value || '',
        programme: document.getElementById('programme')?.value || '',
        year: document.getElementById('yearOfStudy')?.value || '',
        supervisor: document.getElementById('academicSupervisor')?.value || ''
    };
    
    // Organization details
    reportState.organization = {
        name: document.getElementById('orgName')?.value || '',
        department: document.getElementById('department')?.value || '',
        address: document.getElementById('orgAddress')?.value || '',
        startDate: document.getElementById('startDate')?.value || '',
        endDate: document.getElementById('endDate')?.value || '',
        workSupervisor: document.getElementById('workSupervisor')?.value || '',
        supervisorPosition: document.getElementById('supervisorPosition')?.value || ''
    };
    
    // Daily logs
    const logElements = document.querySelectorAll('.daily-log');
    reportState.dailyLogs = Array.from(logElements).map(log => ({
        date: log.querySelector('.activity-date')?.value || '',
        title: log.querySelector('.activity-title')?.value || '',
        description: log.querySelector('.activity-description')?.value || '',
        skills: log.querySelector('.activity-skills')?.value || '',
        challenges: log.querySelector('.activity-challenges')?.value || ''
    }));
    
    // Achievements
    const achievementElements = document.querySelectorAll('.achievement-entry');
    reportState.achievements = Array.from(achievementElements).map(ach => ({
        title: ach.querySelector('.achievement-title')?.value || '',
        description: ach.querySelector('.achievement-desc')?.value || ''
    }));
    
    // Skills
    reportState.skills = {
        technical: document.getElementById('techSkills')?.value || '',
        soft: document.getElementById('softSkills')?.value || '',
        outcomes: document.getElementById('learningOutcomes')?.value || ''
    };
    
    // Challenges
    reportState.challenges = {
        challenges: document.getElementById('challenges')?.value || '',
        solutions: document.getElementById('solutions')?.value || '',
        recommendations: document.getElementById('recommendations')?.value || ''
    };
}

// ========================================
// REPORT GENERATION
// ========================================

function generateFullReport() {
    saveCurrentStepData();
    
    const statusDiv = document.getElementById('generationStatus');
    statusDiv.innerHTML = '<div class="loading">🤖 Generating your professional internship report...</div>';
    
    setTimeout(() => {
        const report = buildEnhancedReportHTML();
        generatedReport = report;
        reportState.generated = true;
        
        statusDiv.innerHTML = '<div class="success">✅ Report generated successfully! Go to Step 8 to preview.</div>';
        updatePreview();
        
        setTimeout(() => {
            if (currentStep === 7) {
                nextStep();
            }
        }, 1500);
    }, 1500);
}

function buildEnhancedReportHTML() {
    const s = reportState.student;
    const o = reportState.organization;
    const logs = reportState.dailyLogs;
    const achievements = reportState.achievements;
    const skills = reportState.skills;
    const challenges = reportState.challenges;
    
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    // Build activities table
    let activitiesHtml = '';
    logs.forEach(log => {
        if (log.date && log.title) {
            activitiesHtml += `
                <div class="activity-entry">
                    <div class="activity-date-header"><strong>${log.date}</strong></div>
                    <div class="activity-title">${enhanceText(log.title)}</div>
                    <div class="activity-description">${enhanceText(log.description || '')}</div>
                    ${log.skills ? `<div class="activity-skills"><em>Skills developed:</em> ${enhanceText(log.skills)}</div>` : ''}
                    ${log.challenges ? `<div class="activity-challenges"><em>Challenges & solutions:</em> ${enhanceText(log.challenges)}</div>` : ''}
                </div>
            `;
        }
    });
    
    // Collect all unique skills from daily logs
    const allSkills = [];
    logs.forEach(log => {
        if (log.skills) {
            log.skills.split(/[,，、]/).forEach(s => {
                const skill = s.trim();
                if (skill && !allSkills.includes(skill)) allSkills.push(skill);
            });
        }
    });
    
    // Build achievements
    let achievementsHtml = '';
    achievements.forEach(ach => {
        if (ach.title) {
            achievementsHtml += `<li><strong>${enhanceText(ach.title)}:</strong> ${enhanceText(ach.description || '')}</li>`;
        }
    });
    
    return `
        <div class="report-document">
            <!-- Title Page -->
            <div class="title-page">
                <div class="uni-logo">
                    <h2>${s.university || 'University Name'}</h2>
                    <p>${s.faculty || 'Faculty Name'}</p>
                </div>
                <h1>INTERNSHIP REPORT</h1>
                <h3>An analysis of the experiences learned during the internship placement at ${o.name || 'the host organization'}</h3>
                
                <div class="student-info">
                    <p><strong>Name:</strong> ${s.name || '_________________'}</p>
                    <p><strong>Registration Number:</strong> ${s.id || '_________________'}</p>
                    <p><strong>Programme:</strong> ${s.programme || '_________________'}</p>
                    <p><strong>Year of Study:</strong> ${s.year || '_________________'}</p>
                    <p><strong>Host Organization:</strong> ${o.name || '_________________'}</p>
                </div>
                
                <div class="org-info">
                    <p><strong>Internship Period:</strong> ${o.startDate || '________'} - ${o.endDate || '________'}</p>
                    <p><strong>Location:</strong> ${o.address || '_________________'}</p>
                </div>
                
                <div class="supervisors">
                    <p><strong>University Supervisor:</strong> ${s.supervisor || '_________________'}</p>
                    <p><strong>Workplace Supervisor:</strong> ${o.workSupervisor || '_________________'} (${o.supervisorPosition || ''})</p>
                </div>
                
                <p class="submission-date">Submission Date: ${currentDate}</p>
            </div>
            
            <!-- Declaration -->
            <div class="declaration">
                <h2>DECLARATION</h2>
                <p>I, ${s.name || '_________________'}, hereby declare that this internship report is my original work and has not been submitted for any other qualification at this or any other university.</p>
                <p class="signature">Signed: _________________  Date: ${currentDate}</p>
            </div>
            
            <!-- Acknowledgement -->
            <div class="acknowledgement">
                <h2>ACKNOWLEDGEMENT</h2>
                <p>I wish to express my sincere gratitude to my parents for their financial and emotional support throughout my academic journey. I greatly appreciate the assistance rendered to me during this internship by my workplace supervisor, ${o.workSupervisor || 'the organization'}, and my university supervisor, ${s.supervisor || 'the university'}. I also extend my thanks to my friends, colleagues, and all who contributed to the successful completion of this internship.</p>
            </div>
            
            <!-- Abstract -->
            <div class="abstract">
                <h2>ABSTRACT</h2>
                <p>This internship report documents the experiences, activities, and learning outcomes from the internship undertaken at ${o.name || 'the host organization'}. Throughout the placement period, valuable skills were acquired that will benefit both academic studies and future professional endeavors. Although various challenges were encountered, the overall learning objectives were successfully met, bridging the gap between theoretical knowledge and practical application.</p>
            </div>
            
            <!-- Chapter 1: Introduction -->
            <div class="chapter">
                <h2>CHAPTER ONE: INTRODUCTION</h2>
                <h3>1.1 Background of Internship</h3>
                <p>This report presents a comprehensive account of the internship experience undertaken at ${o.name || 'the host organization'}. The placement was conducted as a partial requirement for the award of ${s.programme || 'Bachelor\'s degree'} at ${s.university || 'the university'}.</p>
                
                <h3>1.2 Objectives of Internship</h3>
                <p>The internship was conducted between ${o.startDate || '________'} and ${o.endDate || '________'} at ${o.name || 'the host organization'}. The primary purposes of the internship were to apply theoretical knowledge, gain practical skills, and develop professional competencies in the field.</p>
                
                <h3>1.3 Report Organization</h3>
                <p>This report is organized into seven chapters. Chapter One provides the introduction and background. Chapter Two presents the profile of the host organization. Chapter Three details the activities performed. Chapter Four discusses the skills and learning outcomes. Chapter Five highlights the challenges encountered. Chapter Six offers recommendations. Chapter Seven concludes the report.</p>
            </div>
            
            <!-- Chapter 2: Organization Profile -->
            <div class="chapter">
                <h2>CHAPTER TWO: ORGANIZATION PROFILE</h2>
                <h3>2.1 About ${o.name || 'the Organization'}</h3>
                <p>${o.name || 'The organization'} is located at ${o.address || 'various locations'}. The organization is committed to delivering quality services and contributing to professional development in its sector.</p>
                
                <h3>2.2 Organizational Structure</h3>
                <p>${o.name || 'The organization'} operates under a structured hierarchy with multiple departments working collaboratively. The ${o.department || 'relevant'} department is supervised by ${o.workSupervisor || 'professional staff'} (${o.supervisorPosition || ''}).</p>
            </div>
            
            <!-- Chapter 3: Activities -->
            <div class="chapter">
                <h2>CHAPTER THREE: INTERNSHIP ACTIVITIES</h2>
                ${activitiesHtml || '<p>Daily activities will appear here based on your log entries.</p>'}
            </div>
            
            <!-- Chapter 4: Skills -->
            <div class="chapter">
                <h2>CHAPTER FOUR: SKILLS AND LEARNING OUTCOMES</h2>
                <h3>4.1 Professional Competencies Developed</h3>
                ${allSkills.length > 0 ? `<p>During the internship, the following professional competencies were developed and strengthened: ${allSkills.join(', ')}.</p>` : `<p>${skills.technical || 'Various professional skills were developed during the internship period.'}</p>`}
                
                <h3>4.2 Soft Skills Developed</h3>
                <p>${skills.soft || 'Professional soft skills including communication, teamwork, and time management were enhanced.'}</p>
                
                <h3>4.3 Key Achievements</h3>
                ${achievementsHtml ? `<ul>${achievementsHtml}</ul>` : '<p>Significant achievements were accomplished during the internship period.</p>'}
                
                <h3>4.4 Overall Learning Outcomes</h3>
                <p>${skills.outcomes || 'The practical exposure gained through this placement significantly improved professional confidence and competence. Theoretical knowledge was successfully applied to real-world work situations.'}</p>
            </div>
            
            <!-- Chapter 5: Challenges -->
            <div class="chapter">
                <h2>CHAPTER FIVE: CHALLENGES AND SOLUTIONS</h2>
                <h3>5.1 Challenges Faced</h3>
                <p>${challenges.challenges || 'Various challenges were encountered during the internship period, including adapting to workplace culture, mastering new technologies, and managing multiple tasks simultaneously.'}</p>
                
                <h3>5.2 Solutions and Coping Strategies</h3>
                <p>${challenges.solutions || 'These challenges were addressed through proactive problem-solving, seeking guidance from supervisors, continuous learning, and maintaining a positive attitude.'}</p>
            </div>
            
            <!-- Chapter 6: Recommendations -->
            <div class="chapter">
                <h2>CHAPTER SIX: RECOMMENDATIONS</h2>
                <h3>6.1 For Future Students</h3>
                <ul>
                    <li>Conduct thorough research about the organization before commencing the internship.</li>
                    <li>Maintain consistent and detailed logbook documentation throughout the placement period.</li>
                    <li>Be proactive in seeking learning opportunities and asking questions.</li>
                    <li>${challenges.recommendations || 'Develop professional relationships and network effectively.'}</li>
                </ul>
                
                <h3>6.2 For the University</h3>
                <ul>
                    <li>Strengthen pre-internship orientation programs to better prepare students.</li>
                    <li>Establish regular progress review meetings between all stakeholders.</li>
                    <li>Provide more structured guidance for report writing and documentation.</li>
                </ul>
                
                <h3>6.3 For the Host Organization</h3>
                <ul>
                    <li>Provide structured mentorship programs with regular feedback sessions.</li>
                    <li>Offer more hands-on task assignments for practical learning.</li>
                    <li>Design a comprehensive orientation program for new interns.</li>
                </ul>
            </div>
            
            <!-- Chapter 7: Conclusion -->
            <div class="chapter">
                <h2>CHAPTER SEVEN: CONCLUSION</h2>
                <p>In conclusion, the internship at ${o.name || 'the host organization'} was a transformative learning experience that significantly contributed to professional and personal development. Throughout the placement period, exposure to real-world work environments challenged the application of theoretical knowledge. The experience successfully bridged the gap between classroom learning and professional practice, providing valuable insights into workplace dynamics. The lessons learned and skills acquired will undoubtedly guide future professional endeavors.</p>
            </div>
            
            <!-- References -->
            <div class="references">
                <h2>REFERENCES</h2>
                <p>${s.university || 'The University'}, Internship Guidelines Handbook (${new Date().getFullYear()})</p>
                <p>${o.name || 'The Organization'}, Organization Policies and Procedures Manual</p>
                <p>Library research, interviews, and organizational documents</p>
            </div>
            
            <!-- Appendices -->
            <div class="appendices">
                <h2>APPENDICES</h2>
                <h3>Appendix A: Detailed Activity Log</h3>
                <p>Complete daily activity log available in the attached documentation.</p>
                <h3>Appendix B: Supervisor Evaluation</h3>
                <p>Supervisor evaluation form attached separately.</p>
                <h3>Appendix C: Certificate of Completion</h3>
                <p>Certificate of internship completion attached.</p>
            </div>
        </div>
    `;
}

function updatePreview() {
    const previewDiv = document.getElementById('reportContent');
    if (generatedReport) {
        previewDiv.innerHTML = generatedReport;
    }
}

function runQualityCheck() {
    let score = 0;
    let maxScore = 7;
    const suggestions = [];
    
    if (reportState.generated) score += 1;
    else suggestions.push('Generate your report in Step 7');
    
    if (reportState.student.name && reportState.student.id) score += 1;
    else suggestions.push('Complete all student details');
    
    if (reportState.organization.name) score += 1;
    else suggestions.push('Enter organization information');
    
    const hasLogs = reportState.dailyLogs.some(log => log.title);
    if (hasLogs) score += 1;
    else suggestions.push('Add daily activity logs');
    
    if (reportState.achievements.length > 0) score += 1;
    else suggestions.push('List your key achievements');
    
    if (reportState.skills.technical || reportState.skills.soft) score += 1;
    else suggestions.push('Describe skills you developed');
    
    const overallScore = Math.round((score / maxScore) * 100);
    
    const container = document.getElementById('qualityReport');
    container.innerHTML = `
        <div class="score-circle ${overallScore >= 70 ? 'high-score' : 'low-score'}">${overallScore}%</div>
        <div class="score-label">Report Quality Score</div>
        <ul class="suggestions-list">
            ${suggestions.map(s => `<li>🔧 ${s}</li>`).join('')}
        </ul>
        ${overallScore >= 70 ? '<p class="success-msg">✓ Your report is ready for download!</p>' : '<p class="warning-msg">⚠️ Complete the suggestions above for a better report.</p>'}
    `;
}

// ========================================
// PAYMENT & EXPORT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const payBtn = document.getElementById('payDownloadBtn');
    if (payBtn) {
        payBtn.onclick = async function() {
            if (!reportState.generated) {
                alert('⚠️ Please generate your report in Step 7 first!');
                return;
            }
            
            this.disabled = true;
            this.innerText = "Processing...";
            
            try {
                const element = document.getElementById('reportPreview');
                const studentName = reportState.student.name || 'Student';
                
                const opt = {
                    margin: [0.5, 0.5, 0.5, 0.5],
                    filename: `Internship_Report_${studentName}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, letterRendering: true },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };
                
                await html2pdf().set(opt).from(element).save();
                
                alert('✅ Report downloaded successfully!');
                this.disabled = false;
                this.innerText = "💳 Pay & Download Report";
            } catch (e) {
                console.error("Error:", e);
                alert("Error generating report. Please try again.");
                this.disabled = false;
                this.innerText = "💳 Pay & Download Report";
            }
        };
    }
});

// Make functions global
window.nextStep = nextStep;
window.prevStep = prevStep;
window.addDailyLog = addDailyLog;
window.addAchievement = addAchievement;
window.enhanceAllEntries = enhanceAllEntries;
window.generateFullReport = generateFullReport;
