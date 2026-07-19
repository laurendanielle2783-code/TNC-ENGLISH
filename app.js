const STORAGE_KEY = "tnc-dashboard-v2";

const attendanceOptions = ["출석", "지각", "결석", "보강", "상담"];
const homeworkOptions = ["완료", "일부", "미완", "미검사"];
const scheduleOptions = ["월목", "화금", "월금", "화목", "수요일", "개별"];
const wednesdaySlotOptions = ["미정", "3시", "4시30분", "6시"];
const checkOptions = ["미진행", "완료", "보류", "불참"];
const listeningModeOptions = ["미진행", "문제", "딕테이션", "문제+딕테이션"];
const inactiveTypeOptions = ["휴원", "퇴원"];
const pageTitles = {
  todayPage: "정규 수업 관리",
  wednesdayPage: "수요일 개별 관리",
  calendarPage: "달력 기록",
  studentPage: "학생별 관리",
  inactivePage: "휴/퇴원생 관리",
  reportPage: "AI 보고서",
  classPage: "반별 학생 관리"
};

const defaultState = {
  activeClassId: "class-posan-2",
  selectedStudentId: "student-1",
  activePage: "todayPage",
  selectedDate: new Date().toISOString().slice(0, 10),
  calendarMonth: new Date().toISOString().slice(0, 7),
  dailyRecords: {},
  inactiveStudents: [],
  classes: [
    {
      id: "class-posan-2",
      name: "포산중2",
      classDays: "월목",
      time: "7:00-9:00",
      grammarDay: "월",
      readingDay: "목",
      teacher: "은하",
      book: "Reading Expert 2",
      level: "중2 내신/독해",
      grammarProgress: "중2 문법 분사구문 복습",
      readingProgress: "Reading Expert 2 Unit 5",
      todayHomework: "Workbook p.32-33 확인",
      nextHomework: "Workbook p.34-37",
      students: [
        createStudent({
          id: "student-1",
          name: "권동근",
          school: "포산중2",
          grade: "중2",
          schedulePattern: "월목",
          attendance: "출석",
          homework: "완료",
          wordDays: "Day 1-3",
          wordCount: "90개 완료",
          memo: "단어 정확도 보완",
          phone: "",
          parentPhone: "",
          status: "관리 양호",
          wednesdaySlot: "3시",
          weeklyTest: "완료",
          makeup: "미진행",
          listenLesson: "12강",
          listenMode: "딕테이션"
        }),
        createStudent({
          id: "student-2",
          name: "차지윤",
          school: "포산중2",
          grade: "중2",
          schedulePattern: "월금",
          attendance: "출석",
          homework: "일부",
          wordDays: "Day 1-3",
          wordCount: "70개 완료",
          memo: "과제 일부 미제출",
          phone: "",
          parentPhone: "",
          status: "과제 확인",
          wednesdaySlot: "4시30분",
          weeklyTest: "보류",
          makeup: "완료",
          listenLesson: "12강",
          listenMode: "문제",
          listenCorrect: "6",
          listenTotal: "8"
        }),
        createStudent({
          id: "student-3",
          name: "최수연",
          school: "포산중2",
          grade: "중2",
          schedulePattern: "화목",
          attendance: "지각",
          homework: "완료",
          wordDays: "Day 1-3",
          wordCount: "90개 완료",
          memo: "듣기 우수",
          phone: "",
          parentPhone: "",
          status: "관리 양호",
          wednesdaySlot: "6시",
          weeklyTest: "완료",
          makeup: "미진행",
          listenLesson: "12강",
          listenMode: "문제+딕테이션",
          listenCorrect: "8",
          listenTotal: "8"
        })
      ]
    }
  ]
};

let state = loadState();

const classFilter = document.querySelector("#classFilter");
const studentRows = document.querySelector("#studentRows");
const rosterRows = document.querySelector("#rosterRows");
const wednesdayRows = document.querySelector("#wednesdayRows");
const studentPicker = document.querySelector("#studentPicker");
const studentClassSelect = document.querySelector("#studentClassSelect");
const inactiveRows = document.querySelector("#inactiveRows");
const examRows = document.querySelector("#examRows");
const recordDateInput = document.querySelector("#recordDateInput");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarRegularRows = document.querySelector("#calendarRegularRows");
const calendarWednesdayRows = document.querySelector("#calendarWednesdayRows");
const reportClassFilter = document.querySelector("#reportClassFilter");
const reportStudentPicker = document.querySelector("#reportStudentPicker");
const reportDateInput = document.querySelector("#reportDateInput");
const reportPreview = document.querySelector("#reportPreview");
const reportStatus = document.querySelector("#reportStatus");
const importDataInput = document.querySelector("#importDataInput");
const toast = document.querySelector("#toast");

function createStudent(overrides = {}) {
  return {
    id: `student-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "새 학생",
    school: "",
    grade: "",
    level: "",
    schedulePattern: "월목",
    phone: "",
    parentPhone: "",
    attendance: "출석",
    homework: "미검사",
    wordDays: "Day 1-3",
    wordCount: "",
    memo: "",
    status: "신규",
    wednesdaySlot: "미정",
    weeklyTest: "미진행",
    makeup: "미진행",
    listenLesson: "",
    listenMode: "미진행",
    listenCorrect: "",
    listenTotal: "",
    wednesdayMemo: "",
    consults: [],
    examScores: [],
    inactiveType: "휴원",
    inactiveStartDate: "",
    pauseReason: "",
    withdrawReason: "",
    previousClassId: "",
    previousClassName: "",
    ...overrides
  };
}

function createClass() {
  const nextNumber = state.classes.length + 1;
  const id = `class-${Date.now()}`;
  return {
    id,
    name: `새 반 ${nextNumber}`,
    classDays: "월목",
    time: "",
    grammarDay: "월",
    readingDay: "목",
    teacher: "",
    book: "",
    level: "",
    grammarProgress: "",
    readingProgress: "",
    todayHomework: "",
    nextHomework: "",
    students: [createStudent()]
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const loaded = saved ? safeParse(saved) : structuredClone(defaultState);
  const migrated = normalizeState(loaded || structuredClone(defaultState));
  return migrated;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function normalizeState(raw) {
  const normalized = {
    activeClassId: raw.activeClassId || defaultState.activeClassId,
    selectedStudentId: raw.selectedStudentId || defaultState.selectedStudentId,
    activePage: raw.activePage || "todayPage",
    selectedDate: raw.selectedDate || new Date().toISOString().slice(0, 10),
    calendarMonth: raw.calendarMonth || (raw.selectedDate || new Date().toISOString().slice(0, 10)).slice(0, 7),
    dailyRecords: raw.dailyRecords && typeof raw.dailyRecords === "object" ? raw.dailyRecords : {},
    inactiveStudents: Array.isArray(raw.inactiveStudents) ? raw.inactiveStudents.map((student) => createStudent(student)) : [],
    classes: Array.isArray(raw.classes) && raw.classes.length ? raw.classes : structuredClone(defaultState.classes)
  };

  normalized.classes = normalized.classes.map((classItem) => ({
    id: classItem.id || `class-${Date.now()}`,
    name: classItem.name || "새 반",
    classDays: classItem.classDays || inferClassDays(classItem),
    time: classItem.time || "",
    grammarDay: classItem.grammarDay || inferGrammarDay(classItem.classDays),
    readingDay: classItem.readingDay || inferReadingDay(classItem.classDays),
    teacher: classItem.teacher || "",
    book: classItem.book || "",
    level: classItem.level || "",
    grammarProgress: classItem.grammarProgress || classItem.todayProgress || "",
    readingProgress: classItem.readingProgress || "",
    todayHomework: classItem.todayHomework || "",
    nextHomework: classItem.nextHomework || "",
    students: Array.isArray(classItem.students) ? classItem.students.map((student) => createStudent(student)) : []
  }));

  if (!normalized.classes.some((classItem) => classItem.id === normalized.activeClassId)) {
    normalized.activeClassId = normalized.classes[0].id;
  }

  if (!findStudentById(normalized.selectedStudentId, normalized)) {
    normalized.selectedStudentId = normalized.classes[0].students[0]?.id || "";
  }

  return normalized;
}

function inferClassDays(classItem) {
  return classItem?.classDays || "월목";
}

function inferGrammarDay(classDays = "월목") {
  return classDays.includes("화") ? "화" : "월";
}

function inferReadingDay(classDays = "월목") {
  return classDays.includes("금") ? "금" : "목";
}

function saveState(showSaved = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showSaved) showToast("저장되었습니다.");
}

function currentClass() {
  return state.classes.find((classItem) => classItem.id === state.activeClassId) || state.classes[0];
}

function currentStudents() {
  return currentClass()?.students || [];
}

function selectedDate() {
  return state.selectedDate || new Date().toISOString().slice(0, 10);
}

function currentDayRecord() {
  const dateKey = selectedDate();
  if (!state.dailyRecords[dateKey]) {
    state.dailyRecords[dateKey] = { regular: {}, wednesday: {} };
  }
  state.dailyRecords[dateKey].regular ||= {};
  state.dailyRecords[dateKey].wednesday ||= {};
  return state.dailyRecords[dateKey];
}

function regularRecordFor(student) {
  const day = currentDayRecord();
  if (!day.regular[student.id]) {
    day.regular[student.id] = {
      attendance: student.attendance || "출석",
      homework: student.homework || "미검사",
      wordDays: student.wordDays || "Day 1-3",
      wordCount: student.wordCount || "",
      memo: student.memo || ""
    };
  }
  return day.regular[student.id];
}

function wednesdayRecordFor(student) {
  const day = currentDayRecord();
  if (!day.wednesday[student.id]) {
    day.wednesday[student.id] = {
      wednesdaySlot: student.wednesdaySlot || "미정",
      weeklyTest: student.weeklyTest || "미진행",
      makeup: student.makeup || "미진행",
      listenLesson: student.listenLesson || "",
      listenMode: student.listenMode || "미진행",
      listenCorrect: student.listenCorrect || "",
      listenTotal: student.listenTotal || "",
      wednesdayMemo: student.wednesdayMemo || ""
    };
  }
  return day.wednesday[student.id];
}

function updateRegularRecord(studentId, field, value) {
  const ref = findStudentById(studentId);
  if (!ref) return;
  regularRecordFor(ref.student)[field] = value;
  state.selectedStudentId = studentId;
  renderSummary(currentClass());
  renderAlerts(currentClass());
  renderCalendarViews();
}

function updateWednesdayRecord(studentId, field, value) {
  const ref = findStudentById(studentId);
  if (!ref) return;
  wednesdayRecordFor(ref.student)[field] = value;
  state.selectedStudentId = studentId;
  renderWednesdaySummary();
  renderAlerts(currentClass());
  renderCalendarViews();
}

function allStudentRefs() {
  return state.classes.flatMap((classItem) => classItem.students.map((student) => ({ classItem, student })));
}

function selectedStudentRef() {
  return findStudentById(state.selectedStudentId) || allStudentRefs()[0];
}

function selectedStudent() {
  return selectedStudentRef()?.student;
}

function findStudentById(studentId, fromState = state) {
  for (const classItem of fromState.classes || []) {
    const student = classItem.students?.find((item) => item.id === studentId);
    if (student) return { classItem, student };
  }
  return null;
}

function optionList(options, selected) {
  return options
    .map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  const classItem = currentClass();
  if (!classItem) return;

  if (!findStudentById(state.selectedStudentId)) {
    state.selectedStudentId = allStudentRefs()[0]?.student.id || "";
  }

  renderClassOptions();
  renderHero(classItem);
  renderSummary(classItem);
  renderPatternSummary(classItem);
  renderLessonRows(classItem);
  renderStudentDetail();
  renderClassFields(classItem);
  renderRoster(classItem);
  renderWednesdayRows();
  renderWednesdaySummary();
  renderDateControls();
  renderCalendarViews();
  renderStudentPicker();
  renderStudentClassSelectors();
  renderStudentProfile();
  renderConsults();
  renderExamScores();
  renderInactiveRows();
  renderInactiveSummary();
  renderReportTools();
  renderAlerts(classItem);
  renderPage();
}

function renderClassOptions() {
  classFilter.innerHTML = state.classes
    .map((classItem) => `<option value="${classItem.id}" ${classItem.id === state.activeClassId ? "selected" : ""}>${escapeHtml(classItem.name)} ${escapeHtml(classItem.classDays)} ${escapeHtml(classItem.time)}</option>`)
    .join("");
}

function renderHero(classItem) {
  document.querySelector("#heroClassName").textContent = classItem.name || "반 이름 없음";
  document.querySelector("#heroClassTime").textContent = `${classItem.classDays || "요일 미입력"} ${classItem.time || "시간 미입력"} 정규 수업`;
  document.querySelector("#heroTeacher").textContent = `담당: ${classItem.teacher || "미입력"}`;
  document.querySelector("#heroBook").textContent = `교재: ${classItem.book || "미입력"}`;
  document.querySelector("#heroFlow").textContent = `${classItem.grammarDay || "문법"}: 문법 / ${classItem.readingDay || "독해"}: 독해`;
}

function renderSummary(classItem) {
  const students = classItem.students;
  const present = students.filter((student) => {
    const record = regularRecordFor(student);
    return record.attendance === "출석" || record.attendance === "지각";
  }).length;
  const wordDone = students.filter((student) => regularRecordFor(student).wordCount.includes("완료")).length;
  const needsContact = students.filter((student) => {
    const record = regularRecordFor(student);
    return record.memo.includes("연락") || student.status.includes("상담") || record.attendance === "결석";
  }).length;

  document.querySelector("#totalStudents").textContent = `${students.length}명`;
  document.querySelector("#attendanceCount").textContent = `${present}명`;
  document.querySelector("#wordDoneCount").textContent = `${wordDone}명`;
  document.querySelector("#contactNeeded").textContent = `${needsContact}명`;
}

function renderPatternSummary(classItem) {
  const counts = scheduleOptions.reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
  classItem.students.forEach((student) => {
    counts[student.schedulePattern] = (counts[student.schedulePattern] || 0) + 1;
  });

  document.querySelector("#patternSummary").innerHTML = scheduleOptions
    .filter((option) => counts[option] > 0 || ["월목", "화금", "월금", "화목"].includes(option))
    .map((option) => `<span class="pattern-chip"><strong>${escapeHtml(option)}</strong>${counts[option] || 0}명</span>`)
    .join("");
}

function renderLessonRows(classItem) {
  studentRows.innerHTML = classItem.students
    .map((student) => {
      const record = regularRecordFor(student);
      return `
        <tr data-student-id="${student.id}" class="${student.id === state.selectedStudentId ? "selected" : ""}">
          <td><strong>${escapeHtml(student.name)}</strong></td>
          <td>${escapeHtml(student.school || "-")}</td>
          <td>${escapeHtml(student.grade || "-")}</td>
          <td><span class="pattern-chip mini">${escapeHtml(student.schedulePattern || "-")}</span></td>
          <td>
            <select data-regular-field="attendance">
              ${optionList(attendanceOptions, record.attendance)}
            </select>
          </td>
          <td>
            <select data-regular-field="homework">
              ${optionList(homeworkOptions, record.homework)}
            </select>
          </td>
          <td><input placeholder="Day 1-3" data-regular-field="wordDays" value="${escapeHtml(record.wordDays)}" /></td>
          <td><input placeholder="90개 완료" data-regular-field="wordCount" value="${escapeHtml(record.wordCount)}" /></td>
          <td><input class="memo-input" data-regular-field="memo" value="${escapeHtml(record.memo)}" /></td>
        </tr>
      `;
    })
    .join("");
}

function renderStudentDetail() {
  const student = selectedStudent();
  const ref = selectedStudentRef();
  const deleteButton = document.querySelector("#deleteSelectedBtn");

  if (!student) {
    document.querySelector("#detailName").textContent = "학생 없음";
    document.querySelector("#detailStatus").textContent = "대기";
    document.querySelector("#detailClassName").textContent = "-";
    document.querySelector("#detailSchoolGrade").textContent = "-";
    document.querySelector("#detailSchedule").textContent = "-";
    document.querySelector("#detailParentPhone").textContent = "-";
    deleteButton.disabled = true;
    return;
  }

  document.querySelector("#detailName").textContent = student.name || "이름 없음";
  document.querySelector("#detailStatus").textContent = student.status || "상태 없음";
  document.querySelector("#detailClassName").textContent = ref?.classItem.name || "-";
  document.querySelector("#detailSchoolGrade").textContent = `${student.school || "-"} / ${student.grade || "-"}`;
  document.querySelector("#detailSchedule").textContent = student.schedulePattern || "-";
  document.querySelector("#detailParentPhone").textContent = student.parentPhone || "-";
  deleteButton.disabled = false;
}

function renderClassFields(classItem) {
  document.querySelectorAll("[data-class-field]").forEach((input) => {
    input.value = classItem[input.dataset.classField] || "";
  });
}

function renderRoster(classItem) {
  rosterRows.innerHTML = classItem.students
    .map(
      (student) => `
        <tr data-student-id="${student.id}" class="${student.id === state.selectedStudentId ? "selected" : ""}">
          <td><strong>${escapeHtml(student.name)}</strong></td>
          <td>${escapeHtml(classItem.name)}</td>
          <td>${escapeHtml(student.school || "-")}</td>
          <td>${escapeHtml(student.grade || "-")}</td>
          <td><span class="pattern-chip mini">${escapeHtml(student.schedulePattern || "-")}</span></td>
          <td>${escapeHtml(student.wednesdaySlot || "-")}</td>
          <td>${escapeHtml(student.phone || "-")}</td>
          <td>${escapeHtml(student.parentPhone || "-")}</td>
          <td>${escapeHtml(student.status || "-")}</td>
          <td><button class="small-danger" type="button" data-delete-student="${student.id}">이동</button></td>
        </tr>
      `
    )
    .join("");
}

function renderWednesdayRows() {
  wednesdayRows.innerHTML = allStudentRefs()
    .map(({ classItem, student }) => {
      const record = wednesdayRecordFor(student);
      return `
        <tr data-student-id="${student.id}" class="${student.id === state.selectedStudentId ? "selected" : ""}">
          <td><strong>${escapeHtml(student.name)}</strong></td>
          <td>${escapeHtml(classItem.name)}</td>
          <td><span class="pattern-chip mini">${escapeHtml(student.schedulePattern)}</span></td>
          <td>
            <select data-wednesday-field="wednesdaySlot">
              ${optionList(wednesdaySlotOptions, record.wednesdaySlot)}
            </select>
          </td>
          <td>
            <select data-wednesday-field="weeklyTest">
              ${optionList(checkOptions, record.weeklyTest)}
            </select>
          </td>
          <td>
            <select data-wednesday-field="makeup">
              ${optionList(checkOptions, record.makeup)}
            </select>
          </td>
          <td><input placeholder="12강" data-wednesday-field="listenLesson" value="${escapeHtml(record.listenLesson)}" /></td>
          <td>
            <select data-wednesday-field="listenMode">
              ${optionList(listeningModeOptions, record.listenMode)}
            </select>
          </td>
          <td>
            <div class="score-pair">
              <input placeholder="맞음" data-wednesday-field="listenCorrect" value="${escapeHtml(record.listenCorrect)}" />
              <span>/</span>
              <input placeholder="전체" data-wednesday-field="listenTotal" value="${escapeHtml(record.listenTotal)}" />
            </div>
          </td>
          <td><input class="memo-input" data-wednesday-field="wednesdayMemo" value="${escapeHtml(record.wednesdayMemo)}" /></td>
        </tr>
      `;
    })
    .join("");
}

function renderWednesdaySummary() {
  const refs = allStudentRefs();
  document.querySelector("#slot3Count").textContent = `${refs.filter(({ student }) => wednesdayRecordFor(student).wednesdaySlot === "3시").length}명`;
  document.querySelector("#slot430Count").textContent = `${refs.filter(({ student }) => wednesdayRecordFor(student).wednesdaySlot === "4시30분").length}명`;
  document.querySelector("#slot6Count").textContent = `${refs.filter(({ student }) => wednesdayRecordFor(student).wednesdaySlot === "6시").length}명`;
  document.querySelector("#wednesdayMissingCount").textContent = `${refs.filter(({ student }) => isWednesdayMissing(student)).length}명`;
}

function renderStudentPicker() {
  studentPicker.innerHTML = allStudentRefs()
    .map(({ classItem, student }) => `<option value="${student.id}" ${student.id === state.selectedStudentId ? "selected" : ""}>${escapeHtml(student.name)} - ${escapeHtml(classItem.name)}</option>`)
    .join("");
}

function renderReportTools() {
  const classItem = currentClass();
  const students = classItem?.students || [];

  reportClassFilter.innerHTML = state.classes
    .map((item) => `<option value="${item.id}" ${item.id === state.activeClassId ? "selected" : ""}>${escapeHtml(item.name)} ${escapeHtml(item.classDays || "")} ${escapeHtml(item.time || "")}</option>`)
    .join("");

  if (!students.some((student) => student.id === state.selectedStudentId)) {
    state.selectedStudentId = students[0]?.id || "";
  }

  reportStudentPicker.innerHTML = students.length
    ? students
        .map((student) => `<option value="${student.id}" ${student.id === state.selectedStudentId ? "selected" : ""}>${escapeHtml(student.name)} - ${escapeHtml(classItem.name)}</option>`)
        .join("")
    : `<option value="">선택 반에 학생이 없습니다</option>`;
  reportStudentPicker.disabled = !students.length;
  reportDateInput.value = selectedDate();
}

function renderStudentClassSelectors() {
  const ref = selectedStudentRef();
  const selectedClassId = ref?.classItem.id || currentClass()?.id || "";
  const classOptions = state.classes
    .map((classItem) => `<option value="${classItem.id}" ${classItem.id === selectedClassId ? "selected" : ""}>${escapeHtml(classItem.name)} ${escapeHtml(classItem.classDays)} ${escapeHtml(classItem.time)}</option>`)
    .join("");

  studentClassSelect.innerHTML = classOptions;
  studentClassSelect.disabled = !ref;
}

function renderStudentProfile() {
  const student = selectedStudent();
  document.querySelectorAll("[data-profile-field]").forEach((input) => {
    input.disabled = !student;
    input.value = student ? student[input.dataset.profileField] || "" : "";
  });
}

function renderConsults() {
  const student = selectedStudent();
  document.querySelector("#consultTitle").textContent = student ? `${student.name} 상담 기록` : "상담 기록";
  document.querySelector("#consultList").innerHTML = student && student.consults.length
    ? student.consults
        .map(
          (consult) => `
            <li>
              <div>
                <strong>${escapeHtml(consult.date)} · ${escapeHtml(consult.type)}</strong>
                <p>${escapeHtml(consult.content)}</p>
              </div>
              <button class="small-danger" type="button" data-delete-consult="${consult.id}">삭제</button>
            </li>
          `
        )
        .join("")
    : `<li><div><strong>저장된 상담 기록이 없습니다.</strong><p>오른쪽 입력칸에서 상담 내용을 추가할 수 있습니다.</p></div></li>`;
}

function renderExamScores() {
  const student = selectedStudent();
  document.querySelector("#examTitle").textContent = student ? `${student.name} 내신 성적 관리` : "내신 성적 관리";

  if (!student) {
    examRows.innerHTML = `<tr><td colspan="7">학생을 선택해주세요.</td></tr>`;
    return;
  }

  examRows.innerHTML = student.examScores.length
    ? student.examScores
        .map(
          (score) => `
            <tr data-exam-id="${score.id}">
              <td><input data-exam-field="year" value="${escapeHtml(score.year)}" placeholder="2026" /></td>
              <td><input data-exam-field="firstMid" value="${escapeHtml(score.firstMid)}" placeholder="점수/등급" /></td>
              <td><input data-exam-field="firstFinal" value="${escapeHtml(score.firstFinal)}" placeholder="점수/등급" /></td>
              <td><input data-exam-field="secondMid" value="${escapeHtml(score.secondMid)}" placeholder="점수/등급" /></td>
              <td><input data-exam-field="secondFinal" value="${escapeHtml(score.secondFinal)}" placeholder="점수/등급" /></td>
              <td><input class="memo-input" data-exam-field="memo" value="${escapeHtml(score.memo)}" placeholder="학교 평균, 등급 변화 등" /></td>
              <td><button class="small-danger" type="button" data-delete-exam="${score.id}">삭제</button></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="7">년도 추가 버튼으로 성적 기록을 시작할 수 있습니다.</td></tr>`;
}

function renderInactiveRows() {
  inactiveRows.innerHTML = state.inactiveStudents.length
    ? state.inactiveStudents
        .map(
          (student) => `
            <tr data-inactive-id="${student.id}">
              <td><input class="name-input" data-inactive-field="name" value="${escapeHtml(student.name)}" /></td>
              <td>${escapeHtml(student.previousClassName || "미기록")}</td>
              <td><input data-inactive-field="school" value="${escapeHtml(student.school)}" /></td>
              <td><input data-inactive-field="grade" value="${escapeHtml(student.grade)}" /></td>
              <td>
                <select data-inactive-field="inactiveType">
                  ${optionList(inactiveTypeOptions, student.inactiveType)}
                </select>
              </td>
              <td><input type="date" data-inactive-field="inactiveStartDate" value="${escapeHtml(student.inactiveStartDate)}" /></td>
              <td><input class="memo-input" data-inactive-field="pauseReason" value="${escapeHtml(student.pauseReason)}" placeholder="휴원 사유" /></td>
              <td><input class="memo-input" data-inactive-field="withdrawReason" value="${escapeHtml(student.withdrawReason)}" placeholder="퇴원 사유" /></td>
              <td><input data-inactive-field="parentPhone" value="${escapeHtml(student.parentPhone)}" /></td>
              <td><button class="outline-btn" type="button" data-restore-student="${student.id}">재등록</button></td>
              <td><button class="small-danger" type="button" data-delete-inactive="${student.id}">삭제</button></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="11">휴원 또는 퇴원으로 이동된 학생이 없습니다.</td></tr>`;
}

function renderInactiveSummary() {
  const inactive = state.inactiveStudents;
  document.querySelector("#inactiveTotalCount").textContent = `${inactive.length}명`;
  document.querySelector("#pauseCount").textContent = `${inactive.filter((student) => student.inactiveType === "휴원").length}명`;
  document.querySelector("#withdrawCount").textContent = `${inactive.filter((student) => student.inactiveType === "퇴원").length}명`;
  document.querySelector("#inactiveMissingCount").textContent = `${inactive.filter((student) => !student.inactiveStartDate || (student.inactiveType === "휴원" && !student.pauseReason) || (student.inactiveType === "퇴원" && !student.withdrawReason)).length}명`;
}

function renderAlerts(classItem) {
  const alerts = [];

  classItem.students.forEach((student) => {
    const record = regularRecordFor(student);
    if (record.attendance === "결석") alerts.push([student.name, "결석 보강 일정 확인"]);
    if (record.homework === "미완" || record.homework === "일부") alerts.push([student.name, "과제 제출 확인"]);
    if (!record.wordCount.includes("완료")) alerts.push([student.name, "단어 완료 여부 확인"]);
    if (record.memo.includes("연락") || student.status.includes("상담")) alerts.push([student.name, "학부모 상담/연락 확인"]);
  });

  allStudentRefs().forEach(({ student }) => {
    if (isWednesdayMissing(student)) alerts.push([student.name, "수요일 개별 수업 체크 확인"]);
  });

  state.inactiveStudents.forEach((student) => {
    if (!student.inactiveStartDate) alerts.push([student.name, "휴/퇴원 시작일 입력 필요"]);
    if (student.inactiveType === "휴원" && !student.pauseReason) alerts.push([student.name, "휴원 사유 입력 필요"]);
    if (student.inactiveType === "퇴원" && !student.withdrawReason) alerts.push([student.name, "퇴원 사유 입력 필요"]);
  });

  document.querySelector("#sideAlertCount").textContent = `${alerts.length}건 확인 필요`;
  document.querySelector("#alertList").innerHTML = alerts.length
    ? alerts.slice(0, 8).map(([name, message]) => `<li><span>${escapeHtml(message)}</span><strong>${escapeHtml(name)}</strong></li>`).join("")
    : `<li><span>현재 확인할 항목이 없습니다.</span><strong>좋음</strong></li>`;
}

function isWednesdayMissing(student) {
  const record = wednesdayRecordFor(student);
  if (record.wednesdaySlot === "미정") return false;
  if (record.weeklyTest === "미진행" && record.makeup === "미진행" && record.listenMode === "미진행") return true;
  if (record.listenMode.includes("문제") && (!record.listenCorrect || !record.listenTotal)) return true;
  return false;
}

function renderPage() {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === state.activePage));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === state.activePage));
  document.querySelector("#pageTitle").textContent = pageTitles[state.activePage] || "TNC 관리";
}

function renderDateControls() {
  recordDateInput.value = selectedDate();
  document.querySelector("#selectedDateTitle").textContent = formatKoreanDate(selectedDate());
}

function renderCalendarViews() {
  renderCalendarGrid();
  renderCalendarDaySummary();
  renderCalendarRegularRows();
  renderCalendarWednesdayRows();
}

function renderCalendarGrid() {
  const [year, month] = (state.calendarMonth || selectedDate().slice(0, 7)).split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const selected = selectedDate();
  const today = new Date().toISOString().slice(0, 10);
  const weekdayHeaders = ["일", "월", "화", "수", "목", "금", "토"].map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  let cells = "";

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      cells += `<button class="calendar-day empty" type="button" disabled></button>`;
      continue;
    }

    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const record = state.dailyRecords[dateKey];
    const hasRegular = record?.regular && Object.keys(record.regular).length > 0;
    const hasWednesday = record?.wednesday && Object.keys(record.wednesday).length > 0;
    const classes = ["calendar-day", dateKey === selected ? "selected" : "", dateKey === today ? "today" : ""].filter(Boolean).join(" ");

    cells += `
      <button class="${classes}" type="button" data-calendar-date="${dateKey}">
        <strong>${dayNumber}</strong>
        <span>${hasRegular ? "정규" : ""}${hasWednesday ? " 수요" : ""}</span>
      </button>
    `;
  }

  document.querySelector("#calendarMonthTitle").textContent = `${year}년 ${month}월`;
  calendarGrid.innerHTML = weekdayHeaders + cells;
}

function renderCalendarDaySummary() {
  const regularCount = allStudentRefs().filter(({ student }) => {
    const record = currentDayRecord().regular[student.id];
    return record && (record.attendance || record.wordCount || record.homework);
  }).length;
  const wednesdayCount = allStudentRefs().filter(({ student }) => {
    const record = currentDayRecord().wednesday[student.id];
    return record && (record.wednesdaySlot !== "미정" || record.weeklyTest !== "미진행" || record.makeup !== "미진행" || record.listenMode !== "미진행");
  }).length;

  document.querySelector("#calendarDaySummary").innerHTML = `
    <div class="calendar-summary-list">
      <div><span>정규 수업 기록</span><strong>${regularCount}명</strong></div>
      <div><span>수요일 개별 기록</span><strong>${wednesdayCount}명</strong></div>
      <div><span>선택 반</span><strong>${escapeHtml(currentClass()?.name || "미선택")}</strong></div>
    </div>
  `;
}

function renderCalendarRegularRows() {
  calendarRegularRows.innerHTML = allStudentRefs()
    .map(({ classItem, student }) => {
      const record = currentDayRecord().regular[student.id];
      return `
        <tr>
          <td><strong>${escapeHtml(student.name)}</strong></td>
          <td>${escapeHtml(classItem.name)}</td>
          <td>${escapeHtml(record?.attendance || "-")}</td>
          <td>${escapeHtml(record?.homework || "-")}</td>
          <td>${escapeHtml(record?.wordDays || "-")}</td>
          <td>${escapeHtml(record?.wordCount || "-")}</td>
          <td>${escapeHtml(record?.memo || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCalendarWednesdayRows() {
  calendarWednesdayRows.innerHTML = allStudentRefs()
    .map(({ classItem, student }) => {
      const record = currentDayRecord().wednesday[student.id];
      return `
        <tr>
          <td><strong>${escapeHtml(student.name)}</strong></td>
          <td>${escapeHtml(classItem.name)}</td>
          <td>${escapeHtml(record?.wednesdaySlot || "-")}</td>
          <td>${escapeHtml(record?.weeklyTest || "-")}</td>
          <td>${escapeHtml(record?.makeup || "-")}</td>
          <td>${escapeHtml(record?.listenLesson || "-")}</td>
          <td>${escapeHtml(record?.listenMode || "-")}</td>
          <td>${escapeHtml(record?.listenCorrect || "-")} / ${escapeHtml(record?.listenTotal || "-")}</td>
          <td>${escapeHtml(record?.wednesdayMemo || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function formatKoreanDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(year, month - 1, day));
}

function changeCalendarMonth(offset) {
  const [year, month] = state.calendarMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + offset, 1);
  state.calendarMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  renderCalendarGrid();
}

function selectRecordDate(dateKey) {
  state.selectedDate = dateKey;
  state.calendarMonth = dateKey.slice(0, 7);
  render();
  saveState(false);
}

function setActiveStudent(studentId) {
  state.selectedStudentId = studentId;
  const ref = findStudentById(studentId);
  if (ref) state.activeClassId = ref.classItem.id;
  render();
}

function updateStudent(studentId, field, value) {
  const ref = findStudentById(studentId);
  if (!ref) return;
  ref.student[field] = value;
  state.selectedStudentId = studentId;
  renderSummary(currentClass());
  renderPatternSummary(currentClass());
  renderStudentDetail();
  renderStudentPicker();
  renderStudentClassSelectors();
  renderStudentProfile();
  renderWednesdaySummary();
  renderAlerts(currentClass());
  renderCalendarViews();
}

function moveStudentToClass(studentId, targetClassId) {
  const ref = findStudentById(studentId);
  const targetClass = state.classes.find((classItem) => classItem.id === targetClassId);
  if (!ref || !targetClass || ref.classItem.id === targetClassId) return;

  ref.classItem.students = ref.classItem.students.filter((student) => student.id !== studentId);
  targetClass.students.push(ref.student);
  state.activeClassId = targetClassId;
  state.selectedStudentId = studentId;
  render();
  saveState(false);
  showToast("학생 소속 반이 변경되었습니다.");
}

function archiveStudent(studentId, inactiveType = "휴원") {
  const ref = findStudentById(studentId);
  if (!ref) return;

  ref.classItem.students = ref.classItem.students.filter((student) => student.id !== studentId);
  ref.student.inactiveType = inactiveType;
  ref.student.inactiveStartDate = ref.student.inactiveStartDate || new Date().toISOString().slice(0, 10);
  ref.student.previousClassId = ref.classItem.id;
  ref.student.previousClassName = ref.classItem.name;
  state.inactiveStudents.unshift(ref.student);
  state.selectedStudentId = allStudentRefs()[0]?.student.id || "";
  state.activePage = "inactivePage";
  render();
  saveState(false);
  showToast("휴/퇴원생 목록으로 이동되었습니다.");
}

function restoreStudent(studentId) {
  const student = state.inactiveStudents.find((item) => item.id === studentId);
  if (!student) return;

  const targetClass = state.classes.find((classItem) => classItem.id === student.previousClassId) || currentClass() || state.classes[0];
  state.inactiveStudents = state.inactiveStudents.filter((item) => item.id !== studentId);
  targetClass.students.push(student);
  state.activeClassId = targetClass.id;
  state.selectedStudentId = student.id;
  state.activePage = "studentPage";
  render();
  saveState(false);
  showToast("재등록 처리되었습니다.");
}

function deleteInactiveStudent(studentId) {
  const student = state.inactiveStudents.find((item) => item.id === studentId);
  if (!student) return;

  const confirmed = window.confirm(`${student.name} 학생을 휴/퇴원생 목록에서 완전히 삭제할까요?`);
  if (!confirmed) return;

  state.inactiveStudents = state.inactiveStudents.filter((item) => item.id !== studentId);
  renderInactiveRows();
  renderInactiveSummary();
  renderAlerts(currentClass());
  saveState(false);
  showToast("휴/퇴원생 목록에서 삭제되었습니다.");
}

function addStudent() {
  const classItem = currentClass();
  const student = createStudent({
    name: `새 학생 ${classItem.students.length + 1}`,
    schedulePattern: classItem.classDays || "월목"
  });
  classItem.students.push(student);
  state.selectedStudentId = student.id;
  render();
  saveState(false);
  showToast("학생이 추가되었습니다.");
}

function deleteStudent(studentId) {
  archiveStudent(studentId, "휴원");
}

function addConsult() {
  const student = selectedStudent();
  const content = document.querySelector("#consultContent").value.trim();
  if (!student || !content) {
    showToast("상담 내용을 입력해주세요.");
    return;
  }

  student.consults.unshift({
    id: `consult-${Date.now()}`,
    date: document.querySelector("#consultDate").value || new Date().toISOString().slice(0, 10),
    type: document.querySelector("#consultType").value,
    content
  });

  document.querySelector("#consultContent").value = "";
  renderConsults();
  saveState(false);
  showToast("상담 기록이 저장되었습니다.");
}

function addExamYear() {
  const student = selectedStudent();
  if (!student) {
    showToast("학생을 먼저 선택해주세요.");
    return;
  }

  student.examScores.unshift({
    id: `exam-${Date.now()}`,
    year: String(new Date().getFullYear()),
    firstMid: "",
    firstFinal: "",
    secondMid: "",
    secondFinal: "",
    memo: ""
  });
  renderExamScores();
  saveState(false);
  showToast("성적 기록 행이 추가되었습니다.");
}

function updateInactiveStudent(studentId, field, value) {
  const student = state.inactiveStudents.find((item) => item.id === studentId);
  if (!student) return;
  student[field] = value;
  renderInactiveSummary();
}

function exportData() {
  saveState(false);
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `TNC-관리데이터-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("데이터 백업 파일을 저장했습니다.");
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = safeParse(String(reader.result));
      if (!imported) throw new Error("invalid");
      state = normalizeState(imported);
      saveState(false);
      render();
      showToast("데이터를 불러왔습니다.");
    } catch {
      showToast("불러올 수 없는 파일입니다.");
    } finally {
      importDataInput.value = "";
    }
  });
  reader.readAsText(file);
}

function reportTemplateLabel(value) {
  return {
    growth: "성장 스토리",
    weekly: "주간 체크",
    classic: "클래식 리포트"
  }[value] || "성장 스토리";
}

function buildReportPayload() {
  const ref = findStudentById(reportStudentPicker.value);
  if (!ref) return null;

  const dateKey = reportDateInput.value || selectedDate();
  const dayRecord = state.dailyRecords[dateKey] || { regular: {}, wednesday: {} };
  const regular = dayRecord.regular?.[ref.student.id] || regularRecordFor(ref.student);
  const wednesday = dayRecord.wednesday?.[ref.student.id] || wednesdayRecordFor(ref.student);

  return {
    academyName: "TNC 영어학원",
    reportDate: dateKey,
    template: reportTemplateLabel(document.querySelector("#reportTemplate").value),
    tone: document.querySelector("#reportTone").value,
    student: {
      name: ref.student.name,
      school: ref.student.school,
      grade: ref.student.grade,
      className: ref.classItem.name,
      schedulePattern: ref.student.schedulePattern,
      level: ref.student.level,
      status: ref.student.status
    },
    classInfo: {
      classDays: ref.classItem.classDays,
      time: ref.classItem.time,
      teacher: ref.classItem.teacher,
      book: ref.classItem.book,
      grammarProgress: ref.classItem.grammarProgress,
      readingProgress: ref.classItem.readingProgress,
      todayHomework: ref.classItem.todayHomework,
      nextHomework: ref.classItem.nextHomework
    },
    regular,
    wednesday,
    consults: (ref.student.consults || []).slice(0, 3),
    examScores: (ref.student.examScores || []).slice(0, 3)
  };
}

function setReportText(text) {
  const payload = buildReportPayload();
  reportPreview.innerHTML = `
    <h3>${escapeHtml(payload?.student.name || "학생")} 학습보고서</h3>
    <p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>
  `;
}

async function generateReport() {
  const payload = buildReportPayload();
  if (!payload) {
    showToast("보고서를 만들 학생을 선택해주세요.");
    return;
  }

  reportStatus.textContent = "AI가 보고서를 작성하는 중입니다.";
  document.querySelector("#generateReportBtn").disabled = true;

  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "보고서를 생성하지 못했습니다.");

    setReportText(data.report || "");
    reportStatus.textContent = "보고서가 생성되었습니다.";
    showToast("AI 보고서가 생성되었습니다.");
  } catch (error) {
    const fallback = createLocalReport(payload);
    setReportText(fallback);
    reportStatus.textContent = "API 연결 확인이 필요해 기본 보고서 초안으로 표시했습니다.";
    showToast("기본 보고서 초안을 만들었습니다.");
  } finally {
    document.querySelector("#generateReportBtn").disabled = false;
  }
}

function createLocalReport(payload) {
  const student = payload.student;
  const regular = payload.regular;
  const wednesday = payload.wednesday;
  return [
    `안녕하세요, ${student.name} 학생의 ${payload.template} 보고드립니다.`,
    "",
    `이번 수업에서는 ${payload.classInfo.grammarProgress || "문법 진도"}와 ${payload.classInfo.readingProgress || "독해 진도"}를 중심으로 학습했습니다.`,
    `단어는 ${regular.wordDays || "범위 미입력"} / ${regular.wordCount || "완료 기록 미입력"}로 기록되어 있습니다.`,
    `듣기는 ${wednesday.listenLesson || "강 미입력"} ${wednesday.listenMode || "미진행"} 상태이며, 문제 풀이 기록은 ${wednesday.listenCorrect || "-"} / ${wednesday.listenTotal || "-"}입니다.`,
    "",
    `다음 과제는 ${payload.classInfo.nextHomework || "수업 후 안내 예정"}입니다.`,
    "가정에서도 단어 복습과 과제 마무리를 함께 확인해 주시면 좋겠습니다."
  ].join("\n");
}

function currentReportText() {
  return reportPreview.innerText.trim();
}

async function copyReport() {
  const text = currentReportText();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  showToast("보고서 내용이 복사되었습니다.");
}

function downloadReportPdf() {
  const text = currentReportText();
  if (!text) return;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html lang="ko">
      <head>
        <title>TNC 학습보고서</title>
        <style>
          body { font-family: Malgun Gothic, sans-serif; padding: 32px; line-height: 1.7; }
          h1 { color: #ef3b18; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head>
      <body>
        <h1>TNC 영어학원 학습보고서</h1>
        <pre>${escapeHtml(text)}</pre>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");
  lines.forEach((line) => {
    const words = line.split(" ");
    let current = "";
    words.forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (context.measureText(test).width > maxWidth && current) {
        context.fillText(current, x, y);
        y += lineHeight;
        current = word;
      } else {
        current = test;
      }
    });
    context.fillText(current, x, y);
    y += lineHeight;
  });
}

function downloadReportImage() {
  const text = currentReportText();
  if (!text) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f5f6f2";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(70, 70, 1060, 1460);
  context.fillStyle = "#ef3b18";
  context.font = "700 44px Malgun Gothic, sans-serif";
  context.fillText("TNC 영어학원 학습보고서", 120, 150);
  context.fillStyle = "#181817";
  context.font = "28px Malgun Gothic, sans-serif";
  wrapCanvasText(context, text, 120, 230, 960, 48);
  const link = document.createElement("a");
  link.download = "TNC-학습보고서.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function shareReport() {
  const text = currentReportText();
  if (!text) return;
  if (navigator.share) {
    await navigator.share({ title: "TNC 영어학원 학습보고서", text });
    return;
  }
  await navigator.clipboard.writeText(text);
  showToast("공유가 지원되지 않아 보고서를 복사했습니다.");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function setTodayText() {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  document.querySelector("#todayText").textContent = formatter.format(new Date());
  document.querySelector("#consultDate").value = new Date().toISOString().slice(0, 10);
}

classFilter.addEventListener("change", (event) => {
  state.activeClassId = event.target.value;
  state.selectedStudentId = currentClass().students[0]?.id || "";
  render();
  saveState(false);
});

studentPicker.addEventListener("change", (event) => {
  setActiveStudent(event.target.value);
});

studentClassSelect.addEventListener("change", (event) => {
  if (state.selectedStudentId) moveStudentToClass(state.selectedStudentId, event.target.value);
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.activePage = button.dataset.page;
    render();
  });
});

document.querySelector("#addClassBtn").addEventListener("click", () => {
  const newClass = createClass();
  state.classes.push(newClass);
  state.activeClassId = newClass.id;
  state.selectedStudentId = newClass.students[0].id;
  state.activePage = "classPage";
  render();
  saveState(false);
  showToast("반이 추가되었습니다.");
});

document.querySelector("#deleteClassBtn").addEventListener("click", () => {
  if (state.classes.length <= 1) {
    showToast("마지막 반은 삭제할 수 없습니다.");
    return;
  }

  state.classes = state.classes.filter((classItem) => classItem.id !== state.activeClassId);
  state.activeClassId = state.classes[0].id;
  state.selectedStudentId = state.classes[0].students[0]?.id || "";
  render();
  saveState(false);
  showToast("반이 삭제되었습니다.");
});

document.querySelector("#addStudentBtn").addEventListener("click", addStudent);
document.querySelector("#addStudentInClassBtn").addEventListener("click", addStudent);
document.querySelector("#exportDataBtn").addEventListener("click", exportData);
document.querySelector("#importDataBtn").addEventListener("click", () => importDataInput.click());
importDataInput.addEventListener("change", (event) => importData(event.target.files[0]));

document.querySelector("#deleteSelectedBtn").addEventListener("click", () => {
  if (state.selectedStudentId) deleteStudent(state.selectedStudentId);
});

document.querySelector("#saveBtn").addEventListener("click", () => saveState(true));
document.querySelector("#addConsultBtn").addEventListener("click", addConsult);
document.querySelector("#addExamYearBtn").addEventListener("click", addExamYear);
document.querySelector("#generateReportBtn").addEventListener("click", generateReport);
document.querySelector("#copyReportBtn").addEventListener("click", copyReport);
document.querySelector("#downloadReportImageBtn").addEventListener("click", downloadReportImage);
document.querySelector("#downloadReportPdfBtn").addEventListener("click", downloadReportPdf);
document.querySelector("#shareReportBtn").addEventListener("click", shareReport);
reportClassFilter.addEventListener("change", (event) => {
  state.activeClassId = event.target.value;
  state.selectedStudentId = currentClass().students[0]?.id || "";
  render();
  saveState(false);
});
reportStudentPicker.addEventListener("change", (event) => {
  state.selectedStudentId = event.target.value;
  const ref = findStudentById(event.target.value);
  if (ref) state.activeClassId = ref.classItem.id;
  renderStudentPicker();
});
reportDateInput.addEventListener("change", (event) => {
  if (event.target.value) state.selectedDate = event.target.value;
});
recordDateInput.addEventListener("change", (event) => {
  if (event.target.value) selectRecordDate(event.target.value);
});
document.querySelector("#prevMonthBtn").addEventListener("click", () => changeCalendarMonth(-1));
document.querySelector("#nextMonthBtn").addEventListener("click", () => changeCalendarMonth(1));
document.querySelector("#thisMonthBtn").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  state.calendarMonth = today.slice(0, 7);
  renderCalendarGrid();
});
calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-calendar-date]");
  if (button) selectRecordDate(button.dataset.calendarDate);
});

document.querySelector("[data-bulk='attendance']").addEventListener("click", () => {
  currentStudents().forEach((student) => {
    const record = regularRecordFor(student);
    if (record.attendance !== "결석") record.attendance = "출석";
  });
  render();
  saveState(false);
});

document.querySelector("[data-bulk='homework']").addEventListener("click", () => {
  currentStudents().forEach((student) => {
    regularRecordFor(student).homework = "완료";
  });
  render();
  saveState(false);
});

document.querySelectorAll("[data-wed-slot]").forEach((button) => {
  button.addEventListener("click", () => {
    const student = selectedStudent();
    if (!student) return;
    wednesdayRecordFor(student).wednesdaySlot = button.dataset.wedSlot;
    render();
    saveState(false);
  });
});

studentRows.addEventListener("click", (event) => {
  if (event.target.closest("input, select, button, textarea")) return;
  const row = event.target.closest("tr");
  if (row) setActiveStudent(row.dataset.studentId);
});

studentRows.addEventListener("input", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row) return;
  if (target.dataset.regularField) {
    updateRegularRecord(row.dataset.studentId, target.dataset.regularField, target.value);
    return;
  }
  if (!target.dataset.studentField) return;
  updateStudent(row.dataset.studentId, target.dataset.studentField, target.value);
});

studentRows.addEventListener("change", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row) return;
  if (target.dataset.regularField) {
    updateRegularRecord(row.dataset.studentId, target.dataset.regularField, target.value);
    render();
    return;
  }
  if (!target.dataset.studentField) return;
  updateStudent(row.dataset.studentId, target.dataset.studentField, target.value);
  render();
});

wednesdayRows.addEventListener("click", (event) => {
  if (event.target.closest("input, select, button, textarea")) return;
  const row = event.target.closest("tr");
  if (row) setActiveStudent(row.dataset.studentId);
});

wednesdayRows.addEventListener("input", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row || !target.dataset.wednesdayField) return;
  updateWednesdayRecord(row.dataset.studentId, target.dataset.wednesdayField, target.value);
});

wednesdayRows.addEventListener("change", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row || !target.dataset.wednesdayField) return;
  updateWednesdayRecord(row.dataset.studentId, target.dataset.wednesdayField, target.value);
  render();
});

rosterRows.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-student]");
  if (deleteButton) {
    deleteStudent(deleteButton.dataset.deleteStudent);
    return;
  }

  if (event.target.closest("input, select, button, textarea")) return;
  const row = event.target.closest("tr");
  if (row) setActiveStudent(row.dataset.studentId);
});

rosterRows.addEventListener("input", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row || !target.dataset.rosterField) return;
  updateStudent(row.dataset.studentId, target.dataset.rosterField, target.value);
});

rosterRows.addEventListener("change", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (target.dataset.rosterClass) {
    moveStudentToClass(target.dataset.rosterClass, target.value);
    return;
  }
  if (!row || !target.dataset.rosterField) return;
  updateStudent(row.dataset.studentId, target.dataset.rosterField, target.value);
  render();
});

document.querySelector("#detailForm").addEventListener("input", (event) => {
  const target = event.target;
  if (!target.dataset.detailField || !state.selectedStudentId) return;
  updateStudent(state.selectedStudentId, target.dataset.detailField, target.value);
  renderLessonRows(currentClass());
  renderRoster(currentClass());
});

document.querySelector("#detailForm").addEventListener("change", (event) => {
  const target = event.target;
  if (!target.dataset.detailField || !state.selectedStudentId) return;
  updateStudent(state.selectedStudentId, target.dataset.detailField, target.value);
  render();
});

document.querySelectorAll("[data-profile-field]").forEach((input) => {
  const handleProfileChange = () => {
    if (!state.selectedStudentId) return;
    updateStudent(state.selectedStudentId, input.dataset.profileField, input.value);
    renderLessonRows(currentClass());
    renderRoster(currentClass());
    renderWednesdayRows();
  };
  input.addEventListener("input", handleProfileChange);
  input.addEventListener("change", () => {
    handleProfileChange();
    render();
  });
});

document.querySelectorAll("[data-class-field]").forEach((input) => {
  const handleClassChange = () => {
    const classItem = currentClass();
    classItem[input.dataset.classField] = input.value;
    if (input.dataset.classField === "classDays") {
      classItem.grammarDay = inferGrammarDay(input.value);
      classItem.readingDay = inferReadingDay(input.value);
    }
    renderClassOptions();
    renderHero(classItem);
    renderPatternSummary(classItem);
    renderStudentPicker();
    renderStudentClassSelectors();
  };
  input.addEventListener("input", handleClassChange);
  input.addEventListener("change", () => {
    handleClassChange();
    render();
  });
});

document.querySelector("#consultList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-consult]");
  if (!button) return;
  const student = selectedStudent();
  student.consults = student.consults.filter((consult) => consult.id !== button.dataset.deleteConsult);
  renderConsults();
  saveState(false);
  showToast("상담 기록이 삭제되었습니다.");
});

examRows.addEventListener("input", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  const student = selectedStudent();
  if (!row || !student || !target.dataset.examField) return;
  const score = student.examScores.find((item) => item.id === row.dataset.examId);
  if (score) score[target.dataset.examField] = target.value;
});

examRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-exam]");
  const student = selectedStudent();
  if (!button || !student) return;
  student.examScores = student.examScores.filter((score) => score.id !== button.dataset.deleteExam);
  renderExamScores();
  saveState(false);
  showToast("성적 기록이 삭제되었습니다.");
});

inactiveRows.addEventListener("input", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row || !target.dataset.inactiveField) return;
  updateInactiveStudent(row.dataset.inactiveId, target.dataset.inactiveField, target.value);
});

inactiveRows.addEventListener("change", (event) => {
  const target = event.target;
  const row = target.closest("tr");
  if (!row || !target.dataset.inactiveField) return;
  updateInactiveStudent(row.dataset.inactiveId, target.dataset.inactiveField, target.value);
  renderInactiveRows();
});

inactiveRows.addEventListener("click", (event) => {
  const restoreButton = event.target.closest("[data-restore-student]");
  if (restoreButton) {
    restoreStudent(restoreButton.dataset.restoreStudent);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-inactive]");
  if (deleteButton) deleteInactiveStudent(deleteButton.dataset.deleteInactive);
});

setTodayText();
render();
