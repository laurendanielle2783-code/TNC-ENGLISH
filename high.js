/* High school: one student record, linked exam and regular memberships. */
function highSchoolKey(name, school, grade) {
  return [name, school, String(grade || '').replace(/고등학교|고등|학년|고|\s/g, '')].map(x => String(x || '').replace(/\s/g, '')).join('|');
}
function syncHighSchoolRoster(data) {
  data.examClasses = data.examClasses.filter(c => !(data.hiddenHighExamClassIds || []).includes(c.id));
  const highClasses = () => data.classes.filter(c => classLevel(c) === 'high');
  const refs = () => highClasses().flatMap(c => (c.students || []).map(student => ({student, classItem:c})));
  const ensureRegular = (name = '') => {
    name = name.trim();
    const found = highClasses().find(c => c.name === (name || '정규반 미배정'));
    if (found) return found;
    const c = {id: name ? `high-regular-${encodeURIComponent(name)}` : 'high-unassigned', name:name || '정규반 미배정', level:'고등', classDays:name || '개별', time:'', teacher:'', book:'', bookHistory:[], students:[]};
    data.classes.push(c); return c;
  };
  for (const group of data.examClasses.filter(c => c.level === 'high')) {
    group.bookHistory ||= [];
    const schoolMatch = group.name.match(/^(.+?고)\s*([123])/);
    for (const row of group.students || []) {
      if (!String(row.name || '').trim()) continue;
      if (row.studentId && (data.inactiveStudents || []).some(s => s.id === row.studentId)) continue;
      const school = row.school || schoolMatch?.[1] || '';
      const grade = row.grade || schoolMatch?.[2] || '';
      let ref = refs().find(r => r.student.id === (row.studentId || row.id));
      if (!ref && !row.studentId) {
        const matches = refs().filter(r => highSchoolKey(r.student.name,r.student.school,r.student.grade) === highSchoolKey(row.name,school,grade));
        if (matches.length === 1) ref = matches[0];
      }
      if (!ref) {
        const classItem = highClasses().find(c => c.id === row.regularClassId) || ensureRegular(row.regularClassName);
        const student = createStudent({...row, id:row.studentId || row.id, name:row.name.trim(), school, grade, level:'고등', schedulePattern:row.regularClassName || '개별'});
        delete student.studentId;
        classItem.students.push(student); ref = {student,classItem};
      }
      ref.student.mockScores ||= [];
      ref.student.schoolScoreDetails ||= [];
      if (!ref.student.school) ref.student.school = school;
      if (!ref.student.grade) ref.student.grade = grade;
      row.studentId = ref.student.id;
      row.name = ref.student.name;
      row.school = ref.student.school;
      row.grade = ref.student.grade;
      row.regularClassId = ref.classItem.id;
      row.regularClassName = ref.classItem.name === '정규반 미배정' ? '' : ref.classItem.name;
    }
  }
  return data;
}

function installHighSchoolManagement() {
  const baseNormalize = normalizeState;
  normalizeState = raw => {const normalized=baseNormalize(raw);normalized.hiddenHighExamClassIds=Array.isArray(raw.hiddenHighExamClassIds)?raw.hiddenHighExamClassIds:[];normalized.examClasses=normalized.examClasses.filter(c=>!normalized.hiddenHighExamClassIds.includes(c.id));return syncHighSchoolRoster(normalized);};
  syncHighSchoolRoster(state);
  const baseEnsure = ensureDivisionState;
  ensureDivisionState = () => {
    baseEnsure();
    if (currentDivision() === 'high' && !['divisionPage','highManagementPage','inactivePage'].includes(state.activePage)) state.activePage = 'highManagementPage';
    if (currentDivision() !== 'high' && state.activePage === 'highManagementPage') state.activePage = 'todayPage';
  };
  pageTitles.highManagementPage = '명단 · 출석 · 학생 관리';
  const root = document.createElement('section'); root.id = 'highManagementPage'; root.className = 'page high-workspace';
  document.querySelector('main').append(root);
  const nav = document.createElement('button'); nav.type='button'; nav.className='nav-item'; nav.dataset.page='highManagementPage'; nav.textContent='고등부 관리';
  document.querySelector('.nav-list').insertBefore(nav, document.querySelector('.nav-list').children[1]);
  nav.addEventListener('click',()=>{ state.activePage='highManagementPage'; render(); });
  const ui = {tab:'exam', mode:'roster', groupId:'', studentId:'', month:new Date().toISOString().slice(0,7), search:''};
  const h = escapeHtml;
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const highClasses = () => divisionClasses('high');
  const examGroups = () => divisionExamClasses('high');
  const highRefs = () => highClasses().flatMap(c => c.students.map(student=>({student,classItem:c})));
  const master = id => highRefs().find(r=>r.student.id===id)?.student;
  const memberships = id => examGroups().filter(g=>g.students.some(s=>s.studentId===id));
  const persist = () => {syncHighSchoolRoster(state); saveState(false); setCloudStatus('수정사항 있음 · 상단 저장 필요');};
  const group = () => (ui.tab==='regular'?highClasses():examGroups()).find(g=>g.id===ui.groupId);
  const options = (groups, id, blank) => `${blank?`<option value="">${h(blank)}</option>`:''}`+groups.map(g=>`<option value="${h(g.id)}" ${g.id===id?'selected':''}>${h(g.name)}</option>`).join('');
  const input = (field, value, label, type='text', extras='') => `<label>${h(label)}<input type="${type}" data-hs-field="${h(field)}" value="${h(value)}" ${extras}></label>`;
  const selected = () => master(ui.studentId);
  const fields = (student, fields) => fields.map(([key,label,type])=>input(key,student[key]||'',label,type||'text')).join('');

  function members(g) {
    if (!g) return [];
    return ui.tab==='regular' ? g.students : g.students.map(row=>master(row.studentId)).filter(Boolean);
  }
  function draw() {
    if (currentDivision() !== 'high') return;
    const groups = ui.tab==='regular'?highClasses():examGroups();
    if (!groups.some(g=>g.id===ui.groupId)) ui.groupId=groups[0]?.id || '';
    if (!master(ui.studentId)) ui.studentId=highRefs()[0]?.student.id || '';
    root.innerHTML = `<div class="hs-intro"><div><p class="eyebrow">HIGH SCHOOL</p><h2>고등부 관리</h2><p>내신반에서 등록한 학생을 정규반과 학생별 관리에서 함께 확인합니다.</p></div><div class="hs-count">${highRefs().length}<small>등록 학생</small></div></div>
      <div class="hs-tabs" role="tablist" aria-label="고등부 관리 메뉴">${[['exam','내신반'],['regular','정규반'],['students','학생별 관리']].map(([id,label])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" data-hs-tab="${id}" class="${ui.tab===id?'active':''}">${label}</button>`).join('')}</div>
      ${ui.tab==='students'?studentView():groupView(groups)}`;
  }
  function groupView(groups) {
    const g=group(); const list=members(g);
    return `<div class="main-panel hs-panel"><div class="section-head"><label>관리할 ${ui.tab==='exam'?'내신반':'정규반'}<select id="hsGroup">${options(groups,ui.groupId)}</select></label><button class="outline-btn" data-hs-action="add-group">${ui.tab==='exam'?'내신반':'정규반'} 추가</button></div>
      <div class="hs-subtabs">${[['roster','학생명단'],['attendance','출석부'],['books','반별 교재']].map(([id,label])=>`<button data-hs-mode="${id}" class="${ui.mode===id?'active':''}">${label}</button>`).join('')}</div>
      ${g?`<div class="hs-group-tools"><button class="small-danger" data-hs-action="delete-group">현재 반 삭제</button></div><div class="class-form hs-group-form" data-hs-group="${h(g.id)}">${input('name',g.name,'반 이름')}${input('classDays',g.classDays||'','수업 요일')}${input('time',g.time||'','수업 시간')}${input('teacher',g.teacher||'','담당 선생님')}</div>
      ${ui.mode==='roster'?rosterView(g,list):ui.mode==='attendance'?attendanceView(g,list):booksView(g)}`:'<p class="hs-empty">반을 추가해주세요.</p>'}</div>`;
  }
  function rosterView(g,list) {
    return `<div class="section-head"><p>${list.length}명 · 이름을 누르면 상담·성적 기록으로 이동합니다.</p><div class="table-actions"><button data-hs-action="add-student">새 학생 등록</button><button data-hs-action="link-student">기존 학생 연결</button><button data-hs-action="roster-csv">명단 내려받기</button></div></div>
    <div class="hs-add-form" id="hsAddForm" hidden><h3>새 학생 등록</h3><div class="class-form"><label>이름<input id="hsNewName" placeholder="학생 이름"></label><label>학교<input id="hsNewSchool" placeholder="학교"></label><label>학년<input id="hsNewGrade" placeholder="고1 / 1"></label><label>정규반<select id="hsNewRegular">${options(highClasses(),ui.tab==='regular'?g.id:'','정규반 미배정')}</select></label></div><button class="primary-btn" data-hs-action="confirm-student">등록</button></div>
    <div class="hs-add-form" id="hsLinkForm" hidden><label>이미 등록된 학생<select id="hsLinkStudent">${highRefs().filter(r=>!list.some(s=>s.id===r.student.id)).map(r=>`<option value="${h(r.student.id)}">${h(r.student.name)} · ${h(r.student.school)} ${h(r.student.grade)}</option>`).join('')}</select></label><button data-hs-action="confirm-link">이 반에 연결</button></div>
    <div class="table-wrap"><table class="hs-table"><thead><tr><th>이름</th><th>학교</th><th>학년</th><th>내신반</th><th>정규반</th><th>학생 연락처</th><th>학부모 연락처</th><th>명단 정리</th></tr></thead><tbody>${list.map(s=>`<tr data-hs-student="${h(s.id)}"><td><button class="hs-student-link" data-hs-open="${h(s.id)}">${h(s.name)}</button></td><td>${h(s.school)}</td><td>${h(s.grade)}</td><td>${h(memberships(s.id).map(c=>c.name).join(', ')||'미배정')}</td><td><select aria-label="${h(s.name)} 정규반" data-hs-regular="${h(s.id)}">${options(highClasses(),findStudentById(s.id)?.classItem.id)}</select></td><td>${h(s.phone)}</td><td>${h(s.parentPhone)}</td><td><button class="small-danger" data-hs-unlink="${h(s.id)}">이 반에서 제외</button></td></tr>`).join('')||'<tr><td colspan="8">등록된 학생이 없습니다.</td></tr>'}</tbody></table></div>`;
  }
  function attendanceFor(g,student,date,create=false) {
    const isExam=ui.tab==='exam';
    const row=isExam?g.students.find(r=>r.studentId===student.id):null;
    const key=isExam?row?.id:student.id;
    if (create) {
      const day=state.dailyRecords[date] ||= {regular:{},wednesday:{},exam:{}};
      if(isExam){day.exam ||= {}; const record=day.exam[g.id] ||= {studentResults:{}}; record.studentResults ||= {};return record.studentResults[key] ||= {};}
      day.regular ||= {};return day.regular[key] ||= {};
    }
    const day=state.dailyRecords[date];
    return (isExam?day?.exam?.[g.id]?.studentResults?.[key]:day?.regular?.[key]) || {};
  }
  function monthDates() {
    const [year,month]=ui.month.split('-').map(Number); const count=new Date(year,month,0).getDate();
    return Array.from({length:count},(_,i)=>`${ui.month}-${String(i+1).padStart(2,'0')}`);
  }
  function attendanceView(g,list) {
    const dates=monthDates();
    return `<div class="section-head"><label>출석부 월<input id="hsMonth" type="month" value="${h(ui.month)}"></label><div class="table-actions"><button data-hs-action="attendance-csv">출석부 내려받기</button><button data-hs-action="print">출석부 인쇄</button></div></div><p class="hs-help">빈칸은 미기록입니다. 출석 상태를 선택하면 해당 날짜에 기록됩니다. 내신반과 정규반 출결은 각각 관리합니다.</p><div class="table-wrap hs-attendance-wrap"><table class="hs-attendance"><caption>${h(g.name)} · ${h(ui.month)} 출석부</caption><thead><tr><th>학생</th>${dates.map(d=>`<th>${Number(d.slice(-2))}<small>${['일','월','화','수','목','금','토'][new Date(d+'T12:00:00').getDay()]}</small></th>`).join('')}<th>출석</th><th>지각</th><th>결석</th></tr></thead><tbody>${list.map(s=>{const values=dates.map(d=>attendanceFor(g,s,d).attendance||'');return `<tr><th>${h(s.name)}</th>${dates.map((d,i)=>`<td><select aria-label="${h(s.name)} ${d} 출석" data-hs-attendance="${h(s.id)}" data-date="${d}">${optionList(['','출석','지각','결석','보강','공결'],values[i])}</select></td>`).join('')}<td>${values.filter(v=>v==='출석').length}</td><td>${values.filter(v=>v==='지각').length}</td><td>${values.filter(v=>v==='결석').length}</td></tr>`;}).join('')||`<tr><td colspan="${dates.length+4}">학생을 먼저 등록해주세요.</td></tr>`}</tbody></table></div>`;
  }
  function booksView(g) {
    g.bookHistory ||= [];
    return `<div class="section-head"><h3>${h(g.name)} 교재 기록</h3><button data-hs-action="add-book">교재 추가</button></div>${g.book?`<p>기존 교재: ${h(g.book)}</p>`:''}<div class="table-wrap"><table><thead><tr><th>교재명</th><th>구분</th><th>시작일</th><th>종료일</th><th>상태</th><th>메모</th><th>정리</th></tr></thead><tbody>${g.bookHistory.map(b=>`<tr data-hs-book="${h(b.id)}"><td><input aria-label="교재명" data-hs-book-field="title" value="${h(b.title)}"></td><td><input aria-label="교재 구분" data-hs-book-field="category" value="${h(b.category)}"></td><td><input aria-label="시작일" type="date" data-hs-book-field="startDate" value="${h(b.startDate)}"></td><td><input aria-label="종료일" type="date" data-hs-book-field="endDate" value="${h(b.endDate)}"></td><td><select aria-label="교재 상태" data-hs-book-field="status">${optionList(['진행중','완료','보류','교체'],b.status)}</select></td><td><input aria-label="교재 메모" data-hs-book-field="memo" value="${h(b.memo)}"></td><td><button data-hs-delete-book="${h(b.id)}">삭제</button></td></tr>`).join('')||'<tr><td colspan="7">반별로 사용한 교재를 누적해서 기록합니다.</td></tr>'}</tbody></table></div>`;
  }
  function studentView() {
    const list=highRefs().filter(r=>`${r.student.name} ${r.student.school} ${r.classItem.name}`.includes(ui.search));
    const s=selected();
    return `<div class="hs-student-layout"><aside class="main-panel hs-student-sidebar"><label>학생 검색<input id="hsSearch" value="${h(ui.search)}" placeholder="이름·학교·정규반"></label><p>${list.length}명</p><div class="hs-student-list">${list.map(r=>`<button data-hs-open="${h(r.student.id)}" class="${r.student.id===ui.studentId?'active':''}"><strong>${h(r.student.name)}</strong><small>${h(r.student.school)} ${h(r.student.grade)} · ${h(r.classItem.name)}</small></button>`).join('')||'<p>학생이 없습니다.</p>'}</div></aside><div class="hs-student-content">${s?profileView(s):'<div class="main-panel hs-panel">내신반에서 학생을 등록해주세요.</div>'}</div></div>`;
  }
  function profileView(s) {
    s.consults ||= [];s.examScores ||= [];s.mockScores ||= [];s.schoolScoreDetails ||= [];
    return `<div class="main-panel hs-panel"><div class="section-head"><div><p class="eyebrow">학생 기본 정보</p><h3>${h(s.name)}</h3></div><button class="small-danger" data-hs-action="archive">휴/퇴원 처리</button></div><div class="class-form hs-profile">${fields(s,[['name','이름'],['school','학교'],['grade','학년'],['phone','학생 연락처'],['parentPhone','학부모 연락처'],['memo','학생 메모']])}<label>정규반<select data-hs-regular="${h(s.id)}">${options(highClasses(),findStudentById(s.id)?.classItem.id)}</select></label></div><p>내신반: ${h(memberships(s.id).map(c=>c.name).join(', ')||'미배정')}</p></div>
      <div class="main-panel hs-panel"><div class="section-head"><h3>상담 기록</h3></div><div class="class-form"><label>상담일<input id="hsConsultDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>상담 구분<select id="hsConsultType">${optionList(['학부모 상담','학생 상담','전화 상담','기타'],'학생 상담')}</select></label></div><label>상담 내용<textarea id="hsConsultContent" rows="3" placeholder="상담 내용과 다음 확인할 사항"></textarea></label><button class="primary-btn" data-hs-action="add-consult">상담 기록 추가</button><ul class="consult-list">${s.consults.map(c=>`<li><div><strong>${h(c.date)} · ${h(c.type)}</strong><p>${h(c.content)}</p></div><button data-hs-delete-consult="${h(c.id)}">삭제</button></li>`).join('')||'<li>상담 기록이 없습니다.</li>'}</ul></div>
      <div class="main-panel hs-panel"><div class="section-head"><div><h3>모의고사 성적 · 매년 4회</h3><p>회차별 시행월을 직접 입력할 수 있습니다.</p></div><button data-hs-action="add-mock-year">모고 연도 추가</button></div>${mockView(s)}</div>
      <div class="main-panel hs-panel"><div class="section-head"><h3>학교 내신 성적</h3><button data-hs-action="add-school-year">내신 연도 추가</button></div><div class="table-wrap"><table><thead><tr><th>연도 / 학년</th><th>1학기 중간</th><th>1학기 기말</th><th>2학기 중간</th><th>2학기 기말</th><th>메모</th></tr></thead><tbody>${s.examScores.map(c=>`<tr data-hs-school-score="${h(c.id)}">${['year','firstMid','firstFinal','secondMid','secondFinal','memo'].map(f=>`<td><input aria-label="내신 ${h(f)}" data-hs-school-field="${f}" value="${h(c[f])}" placeholder="${f==='year'?'연도 / 학년':f==='memo'?'성적 변화·특이사항':'점수 / 등급 / 석차'}"></td>`).join('')}</tr>`).join('')||'<tr><td colspan="6">연도별 4회 내신 성적을 기록합니다.</td></tr>'}</tbody></table></div><div class="section-head hs-detail-head"><h4>수행평가 · 세부 성적</h4><button data-hs-action="add-school-detail">기록 추가</button></div><div class="table-wrap"><table><thead><tr><th>연도 / 학년</th><th>학기 / 시험</th><th>지필 점수</th><th>수행평가</th><th>최종 등급 / 석차</th><th>메모</th></tr></thead><tbody>${s.schoolScoreDetails.map(c=>`<tr data-hs-detail-score="${h(c.id)}">${['year','exam','written','performance','grade','memo'].map(f=>`<td><input aria-label="내신 세부 ${f}" data-hs-detail-score-field="${f}" value="${h(c[f])}"></td>`).join('')}</tr>`).join('')||'<tr><td colspan="6">수행평가와 학기 최종 결과를 필요할 때 추가합니다.</td></tr>'}</tbody></table></div></div>`;
  }
  function mockView(s) {
    return (s.mockScores||[]).map(year=>`<div class="hs-mock-year" data-hs-mock-year="${h(year.id)}"><div class="class-form"><label>연도<input data-hs-mock-field="year" value="${h(year.year)}"></label><label>학년<input data-hs-mock-field="grade" value="${h(year.grade)}"></label></div><button class="small-danger" data-hs-delete-mock="${h(year.id)}">이 연도 모고 기록 삭제</button><div class="table-wrap"><table><thead><tr><th>회차</th><th>시행월</th><th>영어 원점수</th><th>등급</th><th>메모</th></tr></thead><tbody>${year.exams.map((exam,i)=>`<tr data-hs-mock-index="${i}"><th>${i+1}회</th><td><input aria-label="${i+1}회 시행월" type="month" data-hs-mock-exam-field="month" value="${h(exam.month)}"></td><td><input aria-label="${i+1}회 원점수" type="number" min="0" max="100" data-hs-mock-exam-field="score" value="${h(exam.score)}"></td><td><input aria-label="${i+1}회 등급" type="number" min="1" max="9" data-hs-mock-exam-field="grade" value="${h(exam.grade)}"></td><td><input aria-label="${i+1}회 모고 메모" data-hs-mock-exam-field="memo" value="${h(exam.memo)}"></td></tr>`).join('')}</tbody></table></div></div>`).join('')||'<p class="hs-empty">연도를 추가하면 4회 모의고사 입력란이 생성됩니다.</p>';
  }
  function moveRegular(id,target) {
    const ref=findStudentById(id),next=state.classes.find(c=>c.id===target);
    if(!ref||!next||classLevel(next)!=='high'||ref.classItem.id===next.id)return;
    ref.classItem.students=ref.classItem.students.filter(s=>s.id!==id);next.students.push(ref.student);
  }
  function unassigned() {syncHighSchoolRoster(state);let c=highClasses().find(c=>c.id==='high-unassigned');if(!c){c={...createClass('high'),id:'high-unassigned',name:'정규반 미배정',students:[]};state.classes.push(c);}return c;}
  function addMembership(g,s) {
    if(ui.tab==='regular'){moveRegular(s.id,g.id);return;}
    if(!g.students.some(r=>r.studentId===s.id))g.students.push(createExamClassStudent({name:s.name,school:s.school,grade:s.grade,studentId:s.id}));
  }
  function downloadCsv(name,rows) {
    const escape = v => {let text=String(v??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  root.addEventListener('input',event=>{
    const t=event.target,s=selected(),g=group();
    if(t.id==='hsSearch')return;
    if(t.dataset.hsField){const c=t.closest('[data-hs-group]');if(c){const item=[...highClasses(),...examGroups()].find(c=>c.id===g?.id);if(item)item[t.dataset.hsField]=t.value;}else if(s)s[t.dataset.hsField]=t.value;persist();}
    if(t.dataset.hsBookField){const b=g?.bookHistory?.find(b=>b.id===t.closest('[data-hs-book]').dataset.hsBook);if(b){b[t.dataset.hsBookField]=t.value;persist();}}
    if(t.dataset.hsSchoolField){const c=s?.examScores.find(c=>c.id===t.closest('[data-hs-school-score]').dataset.hsSchoolScore);if(c){c[t.dataset.hsSchoolField]=t.value;persist();}}
    if(t.dataset.hsDetailScoreField){const c=s?.schoolScoreDetails.find(c=>c.id===t.closest('[data-hs-detail-score]').dataset.hsDetailScore);if(c){c[t.dataset.hsDetailScoreField]=t.value;persist();}}
    if(t.dataset.hsMockField||t.dataset.hsMockExamField){const c=s?.mockScores.find(c=>c.id===t.closest('[data-hs-mock-year]').dataset.hsMockYear);if(c){if(t.dataset.hsMockField)c[t.dataset.hsMockField]=t.value;else{if(t.type==='number'&&!t.validity.valid)return;c.exams[Number(t.closest('[data-hs-mock-index]').dataset.hsMockIndex)][t.dataset.hsMockExamField]=t.value;}persist();}}
  });
  root.addEventListener('change',event=>{
    const t=event.target,g=group();
    if(t.id==='hsGroup'){ui.groupId=t.value;draw();}
    if(t.id==='hsMonth'&&t.value){ui.month=t.value;draw();}
    if(t.id==='hsSearch'){ui.search=t.value;draw();}
    if(t.dataset.hsRegular){moveRegular(t.dataset.hsRegular,t.value);persist();draw();}
    if(t.dataset.hsAttendance){attendanceFor(g,master(t.dataset.hsAttendance),t.dataset.date,true).attendance=t.value;persist();draw();}
    if(t.dataset.hsBookField){const b=g?.bookHistory?.find(b=>b.id===t.closest('[data-hs-book]').dataset.hsBook);if(b){b[t.dataset.hsBookField]=t.value;persist();}}
  });
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.hsTab){ui.tab=b.dataset.hsTab;ui.groupId='';draw();return;}
    if(b.dataset.hsMode){ui.mode=b.dataset.hsMode;draw();return;}
    if(b.dataset.hsOpen){ui.studentId=b.dataset.hsOpen;ui.tab='students';draw();return;}
    const g=group(),s=selected();
    if(b.dataset.hsUnlink){const id=b.dataset.hsUnlink; if(!window.confirm('이 반에서 제외할까요? 학생 정보와 상담·성적 기록은 유지됩니다.'))return;if(ui.tab==='exam')g.students=g.students.filter(r=>r.studentId!==id);else moveRegular(id,unassigned().id);persist();draw();return;}
    if(b.dataset.hsDeleteBook){if(!window.confirm('이 교재 기록을 삭제할까요?'))return;g.bookHistory=g.bookHistory.filter(c=>c.id!==b.dataset.hsDeleteBook);persist();draw();return;}
    if(b.dataset.hsDeleteConsult){if(!window.confirm('이 상담 기록을 삭제할까요?'))return;s.consults=s.consults.filter(c=>c.id!==b.dataset.hsDeleteConsult);persist();draw();return;}
    if(b.dataset.hsDeleteMock){if(!window.confirm('이 연도의 모의고사 기록을 삭제할까요?'))return;s.mockScores=s.mockScores.filter(c=>c.id!==b.dataset.hsDeleteMock);persist();draw();return;}
    const action=b.dataset.hsAction;
    if(action==='delete-group'){if(ui.tab==='regular'&&g.id==='high-unassigned'){showToast('정규반 미배정은 학생 보관용 반으로 유지됩니다.');return;}if(!window.confirm('이 반을 삭제할까요? 학생 정보와 상담·성적 및 과거 출결은 보존됩니다.'))return;if(ui.tab==='regular'){const target=unassigned();for(const student of [...g.students])moveRegular(student.id,target.id);state.classes=state.classes.filter(c=>c.id!==g.id);}else{state.hiddenHighExamClassIds ||= [];state.hiddenHighExamClassIds.push(g.id);state.examClasses=state.examClasses.filter(c=>c.id!==g.id);}ui.groupId='';persist();draw();return;}
    if(action==='add-student'){root.querySelector('#hsAddForm').hidden=false;root.querySelector('#hsNewName').focus();return;}
    if(action==='link-student'){root.querySelector('#hsLinkForm').hidden=false;return;}
    if(action==='confirm-student'){
      const name=root.querySelector('#hsNewName').value.trim();if(!name){showToast('학생 이름을 입력해주세요.');return;}
      const school=root.querySelector('#hsNewSchool').value.trim(),grade=root.querySelector('#hsNewGrade').value.trim();
      const matches=highRefs().filter(r=>highSchoolKey(r.student.name,r.student.school,r.student.grade)===highSchoolKey(name,school,grade));
      if(matches.length){showToast('동일한 학생이 있습니다. 기존 학생 연결을 이용해주세요.');return;}
      const c=highClasses().find(c=>c.id===root.querySelector('#hsNewRegular').value)||unassigned();
      const student=createStudent({name,school,grade,level:'고등',mockScores:[],schoolScoreDetails:[]});c.students.push(student);addMembership(g,student);ui.studentId=student.id;persist();draw();showToast('학생이 연결됐습니다. 상단 저장을 눌러 공용 저장해주세요.');return;
    }
    if(action==='confirm-link'){const student=master(root.querySelector('#hsLinkStudent').value);if(student){addMembership(g,student);persist();draw();}return;}
    if(action==='add-group'){const name=window.prompt('새 반 이름을 입력해주세요.');if(!name?.trim())return;const list=ui.tab==='regular'?highClasses():examGroups();if(list.some(c=>c.name===name.trim())){showToast('같은 이름의 반이 있습니다.');return;}const c=ui.tab==='regular'?{...createClass('high'),name:name.trim(),students:[]}:createExamClass({name:name.trim(),level:'high',students:[]});(ui.tab==='regular'?state.classes:state.examClasses).push(c);ui.groupId=c.id;persist();draw();return;}
    if(action==='add-book'){g.bookHistory ||= [];g.bookHistory.unshift({id:uid('class-book'),title:'',category:'',startDate:new Date().toISOString().slice(0,10),endDate:'',status:'진행중',memo:''});persist();draw();return;}
    if(action==='add-consult'){const content=root.querySelector('#hsConsultContent').value.trim();if(!content){showToast('상담 내용을 입력해주세요.');return;}s.consults.unshift({id:uid('consult'),date:root.querySelector('#hsConsultDate').value,type:root.querySelector('#hsConsultType').value,content});persist();draw();return;}
    if(action==='add-mock-year'){const year=String(new Date().getFullYear());s.mockScores.unshift({id:uid('mock'),year,grade:s.grade,exams:[3,6,9,10].map(m=>({month:`${year}-${String(m).padStart(2,'0')}`,score:'',grade:'',memo:''}))});persist();draw();return;}
    if(action==='add-school-year'){s.examScores.unshift({id:uid('school-score'),year:`${new Date().getFullYear()} / ${s.grade||'학년'}`,firstMid:'',firstFinal:'',secondMid:'',secondFinal:'',memo:''});persist();draw();return;}
    if(action==='add-school-detail'){s.schoolScoreDetails.unshift({id:uid('school-detail'),year:`${new Date().getFullYear()} / ${s.grade||''}`,exam:'',written:'',performance:'',grade:'',memo:''});persist();draw();return;}
    if(action==='archive'){if(!window.confirm(`${s.name} 학생을 휴/퇴원생으로 이동할까요? 상담·성적 기록은 유지됩니다.`))return;const ref=findStudentById(s.id);s.previousExamMemberships=memberships(s.id).map(c=>({classId:c.id,row:c.students.find(r=>r.studentId===s.id)}));examGroups().forEach(c=>{c.students=c.students.filter(r=>r.studentId!==s.id)});state.selectedStudentId=s.id;archiveStudent(s.id,'휴원');persist();return;}
    if(action==='roster-csv'){downloadCsv(`${g.name}_학생명단.csv`,[['이름','학교','학년','내신반','정규반','학생 연락처','학부모 연락처'],...members(g).map(s=>[s.name,s.school,s.grade,memberships(s.id).map(c=>c.name).join(' / '),findStudentById(s.id)?.classItem.name,s.phone,s.parentPhone])]);return;}
    if(action==='attendance-csv'){const dates=monthDates();downloadCsv(`${g.name}_${ui.month}_출석부.csv`,[['이름',...dates],...members(g).map(s=>[s.name,...dates.map(d=>attendanceFor(g,s,d).attendance||'')])]);return;}
    if(action==='print'){window.print();return;}
  });
  const baseRender=render;
  render=()=>{
    syncHighSchoolRoster(state);
    const high=currentDivision()==='high';
    if(high){ensureDivisionState();renderDivisionUI();renderPage();renderInactiveRows();renderInactiveSummary();}else{baseRender();}
    document.body.classList.toggle('high-school-mode',high);
    document.querySelectorAll('.nav-item').forEach(b=>{if(b===nav)b.hidden=!high;else if(high)b.hidden=!['divisionPage','inactivePage'].includes(b.dataset.page);else b.hidden=b.hasAttribute('data-middle-only')?false:false;});
    document.querySelectorAll('.top-actions > label, #addClassBtn, #addStudentBtn').forEach(el=>{el.hidden=high;});
    if(high){document.querySelector('.side-panel:last-of-type p').textContent='고등부는 내신반·정규반 명단과 출석, 상담 및 성적을 관리합니다.';draw();}
  };
  const baseSave=saveState;
  saveState=(...args)=>{syncHighSchoolRoster(state);return baseSave(...args);};
  const baseRestore=restoreStudent;
  restoreStudent=id=>{const student=state.inactiveStudents.find(s=>s.id===id);const memberships=student?.previousExamMemberships||[];baseRestore(id);for(const m of memberships){const g=state.examClasses.find(c=>c.id===m.classId);if(g&&!g.students.some(s=>s.studentId===id))g.students.push(m.row);}syncHighSchoolRoster(state);render();saveState(false);};
}
