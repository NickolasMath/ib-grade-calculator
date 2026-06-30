const allBoundaries = window.IB_GRADE_BOUNDARIES || [];
const subjectBoundaries = allBoundaries.filter(
  (entry) => !["TK", "EE"].includes(entry.level),
);
const tokBoundary = allBoundaries.find((entry) => entry.level === "TK");
const eeBoundary = allBoundaries.find((entry) => entry.level === "EE");

const subjectGroups = [
  { id: "studies", label: "Studies in language and literature" },
  { id: "acquisition", label: "Language acquisition" },
  { id: "societies", label: "Individuals and societies" },
  { id: "sciences", label: "Sciences" },
  { id: "math", label: "Mathematics" },
  { id: "arts", label: "Arts" },
];

const coreMatrix = {
  A: { A: 3, B: 3, C: 2, D: 2, E: 0 },
  B: { A: 3, B: 2, C: 2, D: 1, E: 0 },
  C: { A: 2, B: 2, C: 1, D: 0, E: 0 },
  D: { A: 2, B: 1, C: 0, D: 0, E: 0 },
  E: { A: 0, B: 0, C: 0, D: 0, E: 0 },
};

const defaultByGroup = {
  studies: { option: "ENGLISH A: Lang and Literature", level: "HL", timezone: "2" },
  acquisition: { option: "CHINESE B - MANDARIN", level: "SL", timezone: "2" },
  societies: { option: "ECONOMICS", level: "HL", timezone: "2" },
  sciences: { option: "BIOLOGY", level: "HL", timezone: "2" },
  math: { option: "MATHEMATICS ANALYSIS AND APPROACHES", level: "SL", timezone: "2" },
  arts: { option: "VISUAL ARTS", level: "SL", timezone: "0" },
};

const subjectsList = document.querySelector("#subjects-list");
const totalScore = document.querySelector("#total-score");
const heroScore = document.querySelector("#hero-score");
const subjectPoints = document.querySelector("#subject-points");
const corePoints = document.querySelector("#core-points");
const diplomaStatus = document.querySelector("#diploma-status");
const resultNote = document.querySelector("#result-note");
const tokEssayPoints = document.querySelector("#tok-essay-points");
const tokExhibitionPoints = document.querySelector("#tok-exhibition-points");
const eePoints = document.querySelector("#ee-points");
const tokEssayOutput = document.querySelector("#tok-essay-output");
const tokExhibitionOutput = document.querySelector("#tok-exhibition-output");
const tokOutput = document.querySelector("#tok-output");
const eeOutput = document.querySelector("#ee-output");
const tokEssayPercent = document.querySelector("#tok-essay-percent");
const tokExhibitionPercent = document.querySelector("#tok-exhibition-percent");
const tokPercent = document.querySelector("#tok-percent");
const eePercent = document.querySelector("#ee-percent");
const tokEssayLetter = document.querySelector("#tok-essay-letter");
const tokExhibitionLetter = document.querySelector("#tok-exhibition-letter");
const tokLetter = document.querySelector("#tok-letter");
const eeLetter = document.querySelector("#ee-letter");
const timezoneInputs = [...document.querySelectorAll("input[name='global-timezone']")];
const advisorForm = document.querySelector("#advisor-form");
const advisorOutput = document.querySelector("#advisor-output");
const aiAdvisorEndpoint =
  window.AI_ADVISOR_ENDPOINT ||
  localStorage.getItem("aiAdvisorEndpoint") ||
  (location.hostname.endsWith("github.io")
    ? "https://ib-grade-calculator-rouge.vercel.app/api/advisor"
    : "/api/advisor");
const tokEssayBoundary = tokBoundary.components.find(
  (component) => component.name === "THEORY OF KNOWLEDGE",
);
const tokExhibitionBoundary = tokBoundary.components.find(
  (component) => component.name === "TOK EXHIBITION",
);
const pendingValue = "";
const tokEssayWeight = 2 / 3;
const tokExhibitionWeight = 1 / 3;
const tokEssayWeightLabel = "66.6%";
const tokExhibitionWeightLabel = "33.3%";
const languageSubjectTypes = {
  studies: [
    { value: "language-a-lal", label: "Language A: LAL" },
    { value: "language-a-literature", label: "Language A: Literature" },
    { value: "literature-and-performance", label: "Literature and Performance" },
  ],
  acquisition: [
    { value: "language-b", label: "Language B" },
    { value: "language-ab-initio", label: "Language ab initio" },
    { value: "language-and-culture", label: "Language and Culture" },
    { value: "classical-latin", label: "Classical Languages: Latin" },
  ],
};
const groupSixSources = [
  { value: "arts", label: "Arts" },
  { value: "studies", label: "Group 1: Studies in language and literature" },
  { value: "acquisition", label: "Group 2: Language acquisition" },
  { value: "societies", label: "Group 3: Individuals and societies" },
  { value: "sciences", label: "Group 4: Sciences" },
  { value: "math", label: "Group 5: Mathematics" },
];

function normalizeCourseOption(option) {
  return option
    .replace(/\s+self taught$/i, "")
    .replace(/\s+P11$/i, "")
    .replace(/\s+P22$/i, "");
}

function inferSubjectGroup(option) {
  const name = normalizeCourseOption(option).toUpperCase();

  if (name === "ENV. AND SOC.") {
    return "sciences";
  }

  if (name === "LITERATURE AND PERFORMANCE") {
    return "arts";
  }

  if (["SOC.CUL.ANTH.", "WORLD RELIG.", "DIGITAL SOC."].includes(name)) {
    return "societies";
  }

  if (name === "LATIN") {
    return "acquisition";
  }

  if (
    /\b(FILM|DANCE|MUSIC|THEATRE|VISUAL ARTS)\b/.test(name) ||
    name.includes("LITERATURE AND PERFORMANCE")
  ) {
    return "arts";
  }

  if (name.includes("MATH")) {
    return "math";
  }

  if (
    /\b(BIOLOGY|CHEMISTRY|PHYSICS|COMPUTER SC|DESIGN TECH|MARINE SCIENCE|SPORTS EX SCI|ENV\. AND SOC\.)\b/.test(
      name,
    )
  ) {
    return "sciences";
  }

  if (
    /\b(BUSINESS MANAGEMENT|ECONOMICS|GEOGRAPHY|GLOBAL POLITICS|HISTORY|PHILOSOPHY|PSYCHOLOGY|SOC\.CUL\.ANTH\.|WORLD RELIG\.|TURKEY IN THE 20TH CENTURY|DIGITAL SOC\.|ART HISTORY|BRAZ\.SOC\.STUD)\b/.test(
      name,
    )
  ) {
    return "societies";
  }

  if (
    name.includes(" AB.") ||
    name.includes(" AB") ||
    /\b[A-Z]+ B\b/.test(name) ||
    name.includes("LANGUAGE AND CULTURE")
  ) {
    return "acquisition";
  }

  if (name.includes(" A:") || name.includes("LITERATURE")) {
    return "studies";
  }

  return "societies";
}

function groupsForCourse(course) {
  if (course === "ENV. AND SOC.") {
    return ["societies", "sciences"];
  }
  if (course === "LITERATURE AND PERFORMANCE") {
    return ["studies", "arts"];
  }
  return [inferSubjectGroup(course)];
}

function isLanguageGroup(groupId) {
  return Boolean(languageSubjectTypes[groupId]);
}

function courseTypeForCourse(course, groupId) {
  if (groupId === "studies") {
    if (course === "LITERATURE AND PERFORMANCE") {
      return "literature-and-performance";
    }
    if (course.includes(" A: Lang and Literature")) {
      return "language-a-lal";
    }
    if (course.includes(" A: Literature")) {
      return "language-a-literature";
    }
  }

  if (groupId === "acquisition") {
    if (course === "LANGUAGE AND CULTURE") {
      return "language-and-culture";
    }
    if (course === "LATIN") {
      return "classical-latin";
    }
    if (course.includes(" AB.")) {
      return "language-ab-initio";
    }
    if (/\b[A-Z]+ B\b/.test(course)) {
      return "language-b";
    }
  }

  return null;
}

function displayCase(value) {
  return value
    .toLowerCase()
    .split(/([\s.-]+)/)
    .map((part) =>
      /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join("");
}

function languageLabelForCourse(course, groupId) {
  const type = courseTypeForCourse(course, groupId);
  if (type === "language-a-lal") {
    return displayCase(course.replace(" A: Lang and Literature", ""));
  }
  if (type === "language-a-literature") {
    return displayCase(course.replace(" A: Literature", ""));
  }
  if (type === "language-b") {
    return displayCase(course.replace(/\s+B(\s+-\s+)?/, "$1"));
  }
  if (type === "language-ab-initio") {
    return displayCase(course.replace(" AB.", ""));
  }
  if (type === "language-and-culture") {
    return "Language and Culture";
  }
  if (type === "classical-latin") {
    return "Latin";
  }
  if (type === "literature-and-performance") {
    return "Literature and Performance";
  }
  return displayCase(course);
}

const enrichedBoundaries = subjectBoundaries.map((entry) => ({
  ...entry,
  course: normalizeCourseOption(entry.option),
  group: inferSubjectGroup(entry.option),
}));

const optionsByGroup = Object.fromEntries(
  subjectGroups.map((group) => [
    group.id,
    [
      ...new Set(
        enrichedBoundaries
          .filter((entry) => groupsForCourse(entry.course).includes(group.id))
          .map((entry) => entry.course),
      ),
    ].sort((a, b) => a.localeCompare(b)),
  ]),
);

function getSelectedTimezone() {
  return timezoneInputs.find((input) => input.checked)?.value || "2";
}

function getEntriesForOption(course) {
  return enrichedBoundaries.filter((entry) => entry.course === course);
}

function getLevels(course) {
  return [...new Set(getEntriesForOption(course).map((entry) => entry.level))];
}

function getTimezones(course, level) {
  return [
    ...new Set(
      getEntriesForOption(course)
        .filter((entry) => entry.level === level)
        .map((entry) => entry.timezone),
    ),
  ].sort((a, b) => Number(a) - Number(b));
}

function getBoundaryByParts(course, level, timezone) {
  const candidates = enrichedBoundaries.filter(
    (entry) =>
      entry.course === course &&
      entry.level === level &&
      entry.timezone === timezone,
  );
  return candidates.find((entry) => entry.option === course) || candidates[0] || null;
}

function getBoundaryForGlobalTimezone(course, level) {
  const selectedTimezone = getSelectedTimezone();
  return (
    getBoundaryByParts(course, level, selectedTimezone) ||
    getBoundaryByParts(course, level, "0")
  );
}

function isAvailableForGlobalTimezone(course, level) {
  const entries = getEntriesForOption(course).filter((entry) => entry.level === level);
  const selectedTimezone = getSelectedTimezone();
  return entries.some(
    (entry) => entry.timezone === selectedTimezone || entry.timezone === "0",
  );
}

function availableCoursesForGroup(groupId) {
  return optionsByGroup[groupId].filter((course) =>
    getLevels(course).some((level) => isAvailableForGlobalTimezone(course, level)),
  );
}

function availableLanguageCoursesForType(groupId, type) {
  return availableCoursesForGroup(groupId).filter(
    (course) => courseTypeForCourse(course, groupId) === type,
  );
}

function effectiveGroupForRow(row) {
  if (row.dataset.group !== "arts") {
    return row.dataset.group;
  }
  return row.querySelector(".source-group-select")?.value || pendingValue;
}

function selectedCourseForRow(row) {
  const effectiveGroupId = effectiveGroupForRow(row);
  if (isLanguageGroup(effectiveGroupId)) {
    return row.querySelector(".language-select")?.value || pendingValue;
  }
  return row.querySelector(".subject-select")?.value || pendingValue;
}

function getSelectedCoursesByGroup() {
  return Object.fromEntries(
    [...document.querySelectorAll(".subject-row")].map((row) => [
      row.dataset.group,
      selectedCourseForRow(row),
    ]),
  );
}

function shouldDisableCourse(course, groupId) {
  if (!["ENV. AND SOC.", "LITERATURE AND PERFORMANCE"].includes(course)) {
    return false;
  }
  return Object.entries(getSelectedCoursesByGroup()).some(
    ([otherGroupId, selectedCourse]) =>
      otherGroupId !== groupId && selectedCourse === course,
  );
}

function isLanguageTypeDisabled(type, groupId, ownerGroupId = groupId) {
  if (!availableLanguageCoursesForType(groupId, type).length) {
    return true;
  }
  if (type !== "literature-and-performance") {
    return false;
  }
  return shouldDisableCourse("LITERATURE AND PERFORMANCE", ownerGroupId);
}

function findDefaultSubject(groupId) {
  const preferred = defaultByGroup[groupId];
  const fallbackOption = availableCoursesForGroup(groupId)[0];
  const fallbackLevel = getLevels(fallbackOption).find((level) =>
    isAvailableForGlobalTimezone(fallbackOption, level),
  );
  if (!preferred) {
    return getBoundaryForGlobalTimezone(fallbackOption, fallbackLevel);
  }

  return (
    getBoundaryForGlobalTimezone(preferred.option, preferred.level) ||
    getBoundaryForGlobalTimezone(fallbackOption, fallbackLevel)
  );
}

function optionsMarkup(values, selectedValue, formatter = (value) => value, disabled = () => false) {
  return values
    .map(
      (value) =>
        `<option value="${value}"${value === selectedValue ? " selected" : ""}${disabled(value) ? " disabled" : ""}>${formatter(value)}</option>`,
    )
    .join("");
}

function placeholderOption(label, selectedValue) {
  return `<option value="${pendingValue}"${selectedValue === pendingValue ? " selected" : ""}>${label}</option>`;
}

function subjectOptionsMarkup(groupId, selectedValue, ownerGroupId = groupId) {
  if (isLanguageGroup(groupId)) {
    return (
      placeholderOption("Pending", selectedValue) +
      languageSubjectTypes[groupId]
        .map(
          (type) =>
            `<option value="${type.value}"${type.value === selectedValue ? " selected" : ""}${isLanguageTypeDisabled(type.value, groupId, ownerGroupId) ? " disabled" : ""}>${type.label}</option>`,
        )
        .join("")
    );
  }

  const courses = availableCoursesForGroup(groupId);
  return (
    placeholderOption("Pending", selectedValue) +
    optionsMarkup(
      courses,
      selectedValue,
      (value) => value,
      (value) => shouldDisableCourse(value, ownerGroupId),
    )
  );
}

function languageOptionsMarkup(groupId, type, selectedValue, ownerGroupId = groupId) {
  const courses = availableLanguageCoursesForType(groupId, type);
  return (
    placeholderOption("Select language", selectedValue) +
    optionsMarkup(
      courses,
      selectedValue,
      (value) => languageLabelForCourse(value, groupId),
      (value) => shouldDisableCourse(value, ownerGroupId),
    )
  );
}

function sourceGroupOptionsMarkup(selectedValue) {
  return (
    placeholderOption("Subject source", selectedValue) +
    groupSixSources
      .map(
        (source) =>
          `<option value="${source.value}"${source.value === selectedValue ? " selected" : ""}>${source.label}</option>`,
      )
      .join("")
  );
}

function componentWeightFor(boundary, component) {
  const course = boundary.course;
  const level = boundary.level;
  const option = boundary.option;
  const name = component.name;

  const byName = (weights) => weights[name] ?? null;

  if (["BIOLOGY", "CHEMISTRY", "PHYSICS"].includes(option)) {
    return byName({
      "PAPER 1 (MCQ)": 0.2,
      "PAPER 1 B": 0.16,
      "PAPER TWO": 0.44,
      "PRACTICAL WORK": 0.2,
    });
  }

  if (course.includes(" A:")) {
    return level === "HL"
      ? byName({
          ESSAY: 0.2,
          "INTERNAL ASSESSMENT (ORAL)": 0.2,
          "PAPER ONE": 0.35,
          "PAPER TWO": 0.25,
        })
      : byName({
          "INTERNAL ASSESSMENT (ORAL)": 0.3,
          "PAPER ONE": 0.35,
          "PAPER TWO": 0.35,
        });
  }

  if (/\b[A-Z]+ B\b/.test(option.toUpperCase()) || option.toUpperCase().includes(" AB.")) {
    return byName({
      "INTERNAL ASSESSMENT (ORAL)": 0.25,
      "PAPER ONE": 0.25,
      "PAPER TWO LISTENING": 0.25,
      "PAPER TWO READING": 0.25,
    });
  }

  if (option.startsWith("MATHEMATICS")) {
    return level === "HL"
      ? byName({ EXPLORATION: 0.2, "PAPER ONE": 0.3, "PAPER TWO": 0.3, "PAPER THREE": 0.2 })
      : byName({ EXPLORATION: 0.2, "PAPER ONE": 0.4, "PAPER TWO": 0.4 });
  }

  if (course === "ECONOMICS") {
    return level === "HL"
      ? byName({ "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.2, "PAPER TWO": 0.3, "PAPER THREE": 0.3 })
      : byName({ "INTERNAL ASSESSMENT": 0.3, "PAPER ONE": 0.3, "PAPER TWO": 0.4 });
  }

  if (option === "BUSINESS MANAGEMENT") {
    return level === "HL"
      ? byName({ "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.25, "PAPER TWO": 0.3, "PAPER THREE": 0.25 })
      : byName({ "INTERNAL ASSESSMENT": 0.3, "PAPER ONE": 0.35, "PAPER TWO": 0.35 });
  }

  if (course.startsWith("HISTORY")) {
    return level === "HL"
      ? byName({ "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.2, "PAPER TWO": 0.25, "PAPER THREE": 0.35 })
      : byName({ "INTERNAL ASSESSMENT": 0.25, "PAPER ONE": 0.3, "PAPER TWO": 0.45 });
  }

  if (option === "GEOGRAPHY") {
    return level === "HL"
      ? byName({ "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.35, "PAPER TWO": 0.25, "PAPER THREE": 0.2 })
      : byName({ "INTERNAL ASSESSMENT": 0.25, "PAPER ONE": 0.35, "PAPER TWO": 0.4 });
  }

  if (course === "PSYCHOLOGY") {
    return level === "HL"
      ? byName({ "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.4, "PAPER TWO": 0.2, "PAPER THREE": 0.2 })
      : byName({ "INTERNAL ASSESSMENT": 0.25, "PAPER ONE": 0.5, "PAPER TWO": 0.25 });
  }

  if (option === "GLOBAL POLITICS") {
    return level === "HL"
      ? byName({ "EXTENSION ORAL": 0.2, "INTERNAL ASSESSMENT": 0.2, "PAPER ONE": 0.2, "PAPER TWO": 0.4 })
      : byName({ "INTERNAL ASSESSMENT": 0.25, "PAPER ONE": 0.3, "PAPER TWO": 0.45 });
  }

  if (option === "COMPUTER SC.") {
    return level === "HL"
      ? byName({ "PAPER ONE": 0.4, "PAPER TWO": 0.2, "PAPER THREE": 0.2, SOLUTION: 0.2 })
      : byName({ "PAPER ONE": 0.45, "PAPER TWO": 0.25, SOLUTION: 0.3 });
  }

  const commonRules = {
    "VISUAL ARTS": { "COMPARATIVE STUDY": 0.2, "PROCESS PORTFOLIO": 0.4, EXHIBITION: 0.4 },
    "ENV. AND SOC.": { "PAPER ONE": 0.25, "PAPER TWO": 0.5, "PRACTICAL WORK": 0.25 },
    "ART HISTORY": { "PAPER ONE": 0.3, "PAPER TWO": 0.4, "INTERNAL ASSESSMENT": 0.3 },
    "BRAZ.SOC.STUD": { "PAPER ONE": 0.35, "PAPER TWO": 0.4, "INTERNAL ASSESSMENT": 0.25 },
    "TURKEY IN THE 20TH CENTURY": { "PAPER ONE": 0.3, "PAPER TWO": 0.45, "INTERNAL ASSESSMENT": 0.25 },
    "MARINE SCIENCE": { "PAPER ONE": 0.5, "PAPER TWO": 0.3, "PRACTICAL WORK": 0.2 },
    "LITERATURE AND PERFORMANCE": { "PAPER ONE": 0.3, "WRITTEN ASSIGNMENT": 0.3, "INTERNAL ASSESSMENT": 0.4 },
    "LANGUAGE AND CULTURE": { "PAPER ONE": 0.35, "PAPER TWO": 0.35, AUTOETHNOGRAPHY: 0.3 },
    "WORLD RELIG.": { "PAPER ONE": 0.3, "PAPER TWO": 0.45, "INTERNAL ASSESSMENT": 0.25 },
  };

  if (commonRules[option]) {
    return byName(commonRules[option]);
  }

  if (option === "PHILOSOPHY") {
    return level === "HL"
      ? byName({ "PAPER ONE": 0.4, "PAPER TWO": 0.2, "PAPER THREE": 0.2, "INTERNAL ASSESSMENT": 0.2 })
      : byName({ "PAPER ONE": 0.5, "PAPER TWO": 0.25, "INTERNAL ASSESSMENT": 0.25 });
  }

  if (option === "DANCE") {
    return level === "HL"
      ? byName({ "COMPOSITION AND ANALYSIS": 0.35, "DANCE INVESTIGATION": 0.25, "DANCE PERFORMANCE": 0.4 })
      : byName({ "COMPOSITION AND ANALYSIS": 0.4, "DANCE INVESTIGATION": 0.2, "DANCE PERFORMANCE": 0.4 });
  }

  if (option === "FILM") {
    return level === "HL"
      ? byName({ "TEXTUAL ANALYSIS": 0.2, "COMPARATIVE STUDY": 0.2, "FILM PORTFOLIO": 0.25, "COLLABORATIVE FILM PROJECT": 0.35 })
      : byName({ "TEXTUAL ANALYSIS": 0.3, "COMPARATIVE STUDY": 0.3, "FILM PORTFOLIO": 0.4 });
  }

  if (option === "THEATRE") {
    return level === "HL"
      ? byName({ "PRODUCTION PROPOSAL": 0.2, "RESEARCH PRESENTATION": 0.2, "COLLABORATIVE PROJECT": 0.25, "SOLO THEATRE PIECE": 0.35 })
      : byName({ "PRODUCTION PROPOSAL": 0.3, "RESEARCH PRESENTATION": 0.3, "COLLABORATIVE PROJECT": 0.4 });
  }

  if (option === "MUSIC") {
    return level === "HL"
      ? byName({ "EXPERIMENTING WITH MUSIC": 0.2, "EXPLORING MUSIC IN CONTEXT": 0.2, "PRESENTING MUSIC": 0.3, "MUSIC-MAKER": 0.3 })
      : byName({ "EXPERIMENTING WITH MUSIC": 0.3, "EXPLORING MUSIC IN CONTEXT": 0.3, "PRESENTING MUSIC": 0.4 });
  }

  if (option === "DIGITAL SOC.") {
    return level === "HL"
      ? byName({ "PAPER ONE": 0.35, "PAPER TWO": 0.2, "PAPER THREE": 0.25, "INQUIRY PROJECT": 0.2 })
      : byName({ "PAPER ONE": 0.4, "PAPER TWO": 0.3, "INQUIRY PROJECT": 0.3 });
  }

  if (option === "SOC.CUL.ANTH.") {
    return level === "HL"
      ? byName({ "PAPER ONE": 0.3, "PAPER TWO": 0.45, "INTERNAL ASSESSMENT": 0.25 })
      : byName({ "PAPER ONE": 0.4, "PAPER TWO": 0.4, "INTERNAL ASSESSMENT": 0.2 });
  }

  if (option === "LATIN") {
    return level === "HL"
      ? byName({ "PAPER ONE": 0.3, "PAPER TWO": 0.3, COMPOSITION: 0.2, "INTERNAL ASSESSMENT": 0.2 })
      : byName({ "PAPER ONE": 0.35, "PAPER TWO": 0.35, "INTERNAL ASSESSMENT": 0.3 });
  }

  if (["SPORTS EX SCI", "DESIGN TECH."].includes(option)) {
    return level === "HL"
      ? byName({ "PAPER 1 (MCQ)": 0.2, "PAPER TWO": 0.36, "PAPER THREE": 0.2, "PRACTICAL WORK": 0.24 })
      : byName({ "PAPER 1 (MCQ)": 0.2, "PAPER TWO": 0.32, "PAPER THREE": 0.24, "PRACTICAL WORK": 0.24 });
  }

  return null;
}

function getGrade(points, boundary) {
  const value = Number(points);
  const match = boundary.bounds.find(
    (range) => value >= range.from && value <= range.to,
  );
  return match?.grade || boundary.bounds[0].grade;
}

function formatPercent(points, max) {
  const value = Math.max(0, Math.min(Number(points) || 0, max));
  return `${((value / max) * 100).toFixed(1)}%`;
}

function clampPointInput(input, max) {
  input.max = max;
  if (input.value === "") {
    return 0;
  }

  const value = Math.max(0, Math.min(Number(input.value) || 0, max));
  input.value = value;
  return value;
}

function defaultPointsForComponent(component) {
  return 0;
}

function componentsFor(boundary) {
  if (boundary.components?.length) {
    return boundary.components;
  }

  return [
    {
      name: "FINAL",
      max: boundary.max,
      bounds: boundary.bounds,
    },
  ];
}

function createComponentControl(component, index, boundary) {
  const value = defaultPointsForComponent(component);
  const weight = componentWeightFor(boundary, component);
  return `
    <div class="component-row">
      <label>${component.name}</label>
      <input class="component-input" type="range" min="0" max="${component.max}" step="1" value="${value}" aria-label="${component.name} points" data-component-index="${index}" />
      <output class="component-output">${value}/${component.max}</output>
      <span class="component-weight">${weight == null ? "Weight N/A" : `${Math.round(weight * 100)}%`}</span>
    </div>
  `;
}

function renderComponents(row, boundary) {
  const list = row.querySelector(".components-list");
  if (!boundary) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = componentsFor(boundary)
    .map((component, index) => createComponentControl(component, index, boundary))
    .join("");
}

function createSubjectRow(group) {
  const row = document.createElement("div");
  row.className = "subject-row";
  row.dataset.group = group.id;
  const isGroupSix = group.id === "arts";

  row.innerHTML = `
    <div class="subject-controls">
      <span class="group-label">${group.label}</span>
      <div class="subject-picker">
        <select class="source-group-select" name="source-${group.id}" aria-label="${group.label} subject source"${isGroupSix ? "" : " hidden disabled"}>
          ${isGroupSix ? sourceGroupOptionsMarkup(pendingValue) : placeholderOption("Subject source", pendingValue)}
        </select>
        <select class="subject-select" name="subject-${group.id}" aria-label="${group.label} subject">
          ${isGroupSix ? placeholderOption("Pending", pendingValue) : subjectOptionsMarkup(group.id, pendingValue)}
        </select>
        <select class="language-select" name="language-${group.id}" aria-label="${group.label} language" hidden disabled>
          ${placeholderOption("Select language", pendingValue)}
        </select>
      </div>
      <select class="level-select" name="level-${group.id}" aria-label="${group.label} level" disabled>
        ${placeholderOption("Level", pendingValue)}
      </select>
      <strong class="grade-output">Pending</strong>
    </div>
    <div class="components-list"></div>
    <div class="final-row">
      <span>Weighted final percent</span>
      <strong class="final-percent">Pending</strong>
    </div>
  `;

  renderComponents(row, null);
  return row;
}

function syncDependentSelects(row) {
  const sourceGroupSelect = row.querySelector(".source-group-select");
  const subjectSelect = row.querySelector(".subject-select");
  const languageSelect = row.querySelector(".language-select");
  const levelSelect = row.querySelector(".level-select");
  const ownerGroupId = row.dataset.group;
  let groupId = ownerGroupId;

  if (ownerGroupId === "arts") {
    const currentSource = groupSixSources.some(
      (source) => source.value === sourceGroupSelect.value,
    )
      ? sourceGroupSelect.value
      : pendingValue;
    sourceGroupSelect.innerHTML = sourceGroupOptionsMarkup(currentSource);
    sourceGroupSelect.value = currentSource;

    if (!currentSource) {
      subjectSelect.innerHTML = placeholderOption("Pending", pendingValue);
      subjectSelect.value = pendingValue;
      languageSelect.hidden = true;
      languageSelect.disabled = true;
      languageSelect.innerHTML = placeholderOption("Select language", pendingValue);
      levelSelect.innerHTML = placeholderOption("Level", pendingValue);
      levelSelect.value = pendingValue;
      levelSelect.disabled = true;
      return;
    }

    groupId = currentSource;
  }

  if (isLanguageGroup(groupId)) {
    const currentType = languageSubjectTypes[groupId].some(
      (type) => type.value === subjectSelect.value,
    )
      ? subjectSelect.value
      : pendingValue;
    subjectSelect.innerHTML = subjectOptionsMarkup(groupId, currentType, ownerGroupId);
    subjectSelect.value = currentType;

    if (!currentType) {
      languageSelect.hidden = true;
      languageSelect.disabled = true;
      languageSelect.innerHTML = placeholderOption("Select language", pendingValue);
      levelSelect.innerHTML = placeholderOption("Level", pendingValue);
      levelSelect.value = pendingValue;
      levelSelect.disabled = true;
      return;
    }

    const languageCourses = availableLanguageCoursesForType(groupId, currentType);
    const currentCourse = languageCourses.includes(languageSelect.value)
      ? languageSelect.value
      : pendingValue;
    languageSelect.hidden = false;
    languageSelect.disabled = false;
    languageSelect.innerHTML = languageOptionsMarkup(
      groupId,
      currentType,
      currentCourse,
      ownerGroupId,
    );
    languageSelect.value = currentCourse;

    if (!currentCourse) {
      levelSelect.innerHTML = placeholderOption("Level", pendingValue);
      levelSelect.value = pendingValue;
      levelSelect.disabled = true;
      return;
    }

    const levels = getLevels(currentCourse).filter((level) =>
      isAvailableForGlobalTimezone(currentCourse, level),
    );
    const selectedLevel = levels.includes(levelSelect.value)
      ? levelSelect.value
      : pendingValue;
    levelSelect.innerHTML =
      placeholderOption("Level", selectedLevel) + optionsMarkup(levels, selectedLevel);
    levelSelect.value = selectedLevel;
    levelSelect.disabled = false;
    return;
  }

  const courses = availableCoursesForGroup(groupId);
  const currentCourse = courses.includes(subjectSelect.value)
    ? subjectSelect.value
    : pendingValue;
  subjectSelect.innerHTML = subjectOptionsMarkup(groupId, currentCourse, ownerGroupId);
  subjectSelect.value = currentCourse;
  languageSelect.hidden = true;
  languageSelect.disabled = true;
  languageSelect.innerHTML = placeholderOption("Select language", pendingValue);

  if (!currentCourse) {
    levelSelect.innerHTML = placeholderOption("Level", pendingValue);
    levelSelect.value = pendingValue;
    levelSelect.disabled = true;
    return;
  }

  const levels = getLevels(currentCourse).filter((level) =>
    isAvailableForGlobalTimezone(currentCourse, level),
  );
  const selectedLevel = levels.includes(levelSelect.value)
    ? levelSelect.value
    : pendingValue;
  levelSelect.innerHTML =
    placeholderOption("Level", selectedLevel) + optionsMarkup(levels, selectedLevel);
  levelSelect.value = selectedLevel;
  levelSelect.disabled = false;
}

function getRowBoundary(row) {
  syncDependentSelects(row);
  const course = selectedCourseForRow(row);
  const level = row.querySelector(".level-select").value;
  if (!course || !level) {
    return null;
  }
  return getBoundaryForGlobalTimezone(course, level);
}

function updateSubjectRow(row) {
  const boundary = getRowBoundary(row);
  if (!boundary) {
    row.querySelector(".grade-output").textContent = "Pending";
    row.querySelector(".final-percent").textContent = "Pending";
    renderComponents(row, null);
    row.dataset.boundaryKey = "";
    return 0;
  }

  if (!row.querySelector(".component-input")) {
    renderComponents(row, boundary);
  }

  const componentInputs = [...row.querySelectorAll(".component-input")];
  let hasWeights = true;
  let weightTotal = 0;
  const weightedPercent = componentInputs.reduce((sum, input) => {
    const max = Number(input.max);
    const value = clampPointInput(input, max);
    const componentIndex = Number(input.dataset.componentIndex);
    const component = componentsFor(boundary)[componentIndex];
    const weight = componentWeightFor(boundary, component);
    input.closest(".component-row").querySelector(".component-output").textContent = `${value}/${max}`;
    if (weight == null) {
      hasWeights = false;
      return sum;
    }
    weightTotal += weight;
    return sum + (value / max) * 100 * weight;
  }, 0);
  const finalPercent = hasWeights && weightTotal
    ? weightedPercent / weightTotal
    : componentInputs.reduce((sum, input) => {
        const max = Number(input.max);
        return sum + (Number(input.value) / max) * 100;
      }, 0) / Math.max(componentInputs.length, 1);
  const finalPoint = Math.round((finalPercent / 100) * boundary.max);
  const grade = getGrade(finalPoint, boundary);

  row.querySelector(".final-percent").textContent = `${finalPercent.toFixed(1)}%`;
  row.querySelector(".grade-output").textContent = grade;
  return Number(grade);
}

function refreshCourseAvailability() {
  [...document.querySelectorAll(".subject-row")].forEach((row) => {
    syncDependentSelects(row);
  });
}

function updateCoreResult(input, boundary, outputNode, percentNode, letterNode) {
  const points = clampPointInput(input, boundary.max);
  const letter = getGrade(points, boundary);
  outputNode.textContent = `${points}/${boundary.max}`;
  percentNode.textContent = formatPercent(points, boundary.max);
  letterNode.textContent = letter;
  return letter;
}

function updateTokComponent(input, boundary, outputNode, percentNode, letterNode) {
  const points = clampPointInput(input, boundary.max);
  outputNode.textContent = `${points}/${boundary.max}`;
  percentNode.textContent = formatPercent(points, boundary.max);
  return points;
}

function updateTokResult() {
  const essay = updateTokComponent(
    tokEssayPoints,
    tokEssayBoundary,
    tokEssayOutput,
    tokEssayPercent,
    tokEssayLetter,
  );
  tokEssayLetter.textContent = tokEssayWeightLabel;
  const exhibition = updateTokComponent(
    tokExhibitionPoints,
    tokExhibitionBoundary,
    tokExhibitionOutput,
    tokExhibitionPercent,
    tokExhibitionLetter,
  );
  tokExhibitionLetter.textContent = tokExhibitionWeightLabel;
  const finalPercent =
    (essay / tokEssayBoundary.max) * 100 * tokEssayWeight +
    (exhibition / tokExhibitionBoundary.max) * 100 * tokExhibitionWeight;
  const finalPoints = Math.round((finalPercent / 100) * tokBoundary.max);
  const letter = getGrade(finalPoints, tokBoundary);

  tokPercent.textContent = `${finalPercent.toFixed(1)}%`;
  tokLetter.textContent = letter;
  return letter;
}

function getCorePoints(tok, ee) {
  return coreMatrix[tok]?.[ee] ?? 0;
}

function updateResults() {
  const subjectTotal = [...document.querySelectorAll(".subject-row")].reduce(
    (sum, row) => sum + updateSubjectRow(row),
    0,
  );
  const tok = updateTokResult();
  const ee = updateCoreResult(
    eePoints,
    eeBoundary,
    eeOutput,
    eePercent,
    eeLetter,
  );
  const coreTotal = getCorePoints(tok, ee);
  const total = subjectTotal + coreTotal;
  const hasFailingCore = tok === "E" || ee === "E";

  totalScore.textContent = total;
  heroScore.textContent = total;
  subjectPoints.textContent = subjectTotal;
  corePoints.textContent = coreTotal;

  if (hasFailingCore) {
    diplomaStatus.textContent = "At risk";
    diplomaStatus.style.color = "var(--danger)";
    resultNote.textContent =
      "TOK or EE is currently an E. This can affect diploma eligibility under IB award rules.";
    return;
  }

  if (total >= 24) {
    diplomaStatus.textContent = "On track";
    diplomaStatus.style.color = "var(--accent-dark)";
    resultNote.textContent =
      "Component points are calculated with subject-specific assessment weights where available.";
  } else {
    diplomaStatus.textContent = "Below threshold";
    diplomaStatus.style.color = "var(--danger)";
    resultNote.textContent =
      "This estimate is below 24 points. Adjust weighted component sliders to identify the fastest grade improvements.";
  }
}

function selectedSubjectSummary(row) {
  const boundary = getRowBoundary(row);
  const group = subjectGroups.find((item) => item.id === row.dataset.group);
  if (!boundary) {
    return {
      group: group?.label || row.dataset.group,
      status: "Pending",
    };
  }

  const finalPercent = row.querySelector(".final-percent").textContent;
  const grade = row.querySelector(".grade-output").textContent;
  return {
    group: group?.label || row.dataset.group,
    subject: boundary.course,
    level: boundary.level,
    timezone: boundary.timezone,
    grade,
    finalPercent,
  };
}

function collectAdvisorPayload() {
  updateResults();
  return {
    score: {
      total: totalScore.textContent,
      subjectPoints: subjectPoints.textContent,
      corePoints: corePoints.textContent,
      diplomaStatus: diplomaStatus.textContent,
    },
    core: {
      tok: {
        percent: tokPercent.textContent,
        letter: tokLetter.textContent,
        essay: tokEssayOutput.textContent,
        exhibition: tokExhibitionOutput.textContent,
      },
      ee: {
        points: eeOutput.textContent,
        percent: eePercent.textContent,
        letter: eeLetter.textContent,
      },
    },
    subjects: [...document.querySelectorAll(".subject-row")].map(selectedSubjectSummary),
    preferences: {
      countries: document.querySelector("#advisor-countries").value.trim(),
      major: document.querySelector("#advisor-major").value.trim(),
      budget: document.querySelector("#advisor-budget").value.trim(),
      english: document.querySelector("#advisor-english").value.trim(),
      notes: document.querySelector("#advisor-notes").value.trim(),
    },
  };
}

function validateAdvisorPayload(payload) {
  if (!payload.preferences.major) {
    return "Enter an intended major before generating guidance.";
  }
  if (!payload.preferences.countries) {
    return "Enter at least one target country or region.";
  }
  const selectedCount = payload.subjects.filter((subject) => subject.status !== "Pending").length;
  if (selectedCount < 3) {
    return "Select more IB subjects first so the AI can evaluate the academic profile.";
  }
  return "";
}

async function requestAdvisorGuidance(event) {
  event.preventDefault();
  const payload = collectAdvisorPayload();
  const validationError = validateAdvisorPayload(payload);
  if (validationError) {
    advisorOutput.textContent = validationError;
    return;
  }

  advisorOutput.textContent = "Generating AI guidance...";

  try {
    const response = await fetch(aiAdvisorEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "AI advisor endpoint is not available yet.");
    }
    advisorOutput.textContent = data.guidance || "No guidance was returned.";
  } catch (error) {
    const message = error.message || "AI advisor failed.";
    const lowerMessage = message.toLowerCase();
    const deploymentHint =
      lowerMessage.includes("failed to fetch") ||
      lowerMessage.includes("endpoint is not available") ||
      lowerMessage.includes("openai_api_key is not configured") ||
      lowerMessage.includes("groq_api_key is not configured");
    const quotaHint =
      lowerMessage.includes("quota") ||
      lowerMessage.includes("billing") ||
      lowerMessage.includes("insufficient_quota");
    const invalidKeyHint = lowerMessage.includes("invalid api key");

    if (quotaHint) {
      advisorOutput.textContent =
        `${message}\n\nBilling note: the AI backend is connected, but the OpenAI account has no available API quota. Add billing credits or increase the API usage limit in the OpenAI Platform billing settings, then try again.`;
      return;
    }

    if (invalidKeyHint) {
      advisorOutput.textContent =
        `${message}\n\nAPI key note: the AI backend is connected, but the provider rejected the key. Check the Vercel environment variable for the selected provider. For Groq, make sure GROQ_API_KEY is a valid Groq key and redeploy after saving it.`;
      return;
    }

    advisorOutput.textContent = deploymentHint
      ? `${message}\n\nDeployment note: GitHub Pages cannot run private AI API keys. Use the Vercel site or configure window.AI_ADVISOR_ENDPOINT to a secure backend URL.`
      : message;
  }
}

function resetComponentsForSelectedBoundary(event) {
  if (
    !event.target.classList.contains("source-group-select") &&
    !event.target.classList.contains("subject-select") &&
    !event.target.classList.contains("language-select") &&
    !event.target.classList.contains("level-select") &&
    event.target.name !== "global-timezone"
  ) {
    return;
  }

  const row = event.target.closest(".subject-row");
  if (!row) {
    [...document.querySelectorAll(".subject-row")].forEach((subjectRow) => {
      const boundary = getRowBoundary(subjectRow);
      renderComponents(subjectRow, boundary);
      subjectRow.dataset.boundaryKey = boundary
        ? `${boundary.course}|${boundary.level}|${boundary.timezone}`
        : "";
    });
    refreshCourseAvailability();
    return;
  }
  if (event.target.classList.contains("source-group-select")) {
    row.querySelector(".subject-select").value = pendingValue;
    row.querySelector(".language-select").value = pendingValue;
    row.querySelector(".level-select").value = pendingValue;
  }
  if (event.target.classList.contains("subject-select") && isLanguageGroup(row.dataset.group)) {
    row.querySelector(".language-select").value = pendingValue;
    row.querySelector(".level-select").value = pendingValue;
  }
  if (
    event.target.classList.contains("subject-select") &&
    isLanguageGroup(effectiveGroupForRow(row))
  ) {
    row.querySelector(".language-select").value = pendingValue;
    row.querySelector(".level-select").value = pendingValue;
  }
  if (event.target.classList.contains("language-select")) {
    row.querySelector(".level-select").value = pendingValue;
  }
  const previousKey = row.dataset.boundaryKey;
  syncDependentSelects(row);
  const boundary = getRowBoundary(row);
  const nextKey = boundary ? `${boundary.course}|${boundary.level}|${boundary.timezone}` : "";

  if (previousKey !== nextKey) {
    renderComponents(row, boundary);
    row.dataset.boundaryKey = nextKey;
  }
  refreshCourseAvailability();
}

subjectGroups.forEach((group) => {
  const row = createSubjectRow(group);
  row.dataset.boundaryKey = "";
  subjectsList.append(row);
});

tokEssayPoints.value = 0;
tokExhibitionPoints.value = 0;
eePoints.value = 0;
tokEssayPoints.max = tokEssayBoundary.max;
tokExhibitionPoints.max = tokExhibitionBoundary.max;
eePoints.max = eeBoundary.max;
eePoints.placeholder = `0-${eeBoundary.max}`;

document
  .querySelector("#calculator-form")
  .addEventListener("change", resetComponentsForSelectedBoundary);
document
  .querySelector("#calculator-form")
  .addEventListener("input", updateResults);
document
  .querySelector("#calculator-form")
  .addEventListener("change", updateResults);
advisorForm.addEventListener("submit", requestAdvisorGuidance);

updateResults();
