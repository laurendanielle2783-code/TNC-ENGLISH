const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(app.slice(app.indexOf('function createStudent'), app.indexOf('function loadState')) + app.slice(app.indexOf('function classLevel'), app.indexOf('function renderExamLessonPage')), context);
vm.runInContext(fs.readFileSync(path.join(root, 'high.js'), 'utf8'), context);
const data = {
  classes: [{id:'middle',name:'중등반',level:'중등',students:[{id:'m',name:'중등학생',consults:[{content:'보존'}]}]}],
  examClasses: [
    {id:'a',name:'가람고 1',level:'high',students:[{id:'s1',name:'학생가',school:'가람고',grade:'1',regularClassName:'화금'}, {id:'s2',name:'학생나',school:'가람고',grade:'1',regularClassName:''}]},
    {id:'b',name:'누리고 1',level:'high',students:[{id:'s3',name:'학생가',school:'누리고',grade:'1'}]}
  ],
  dailyRecords:{'2026-10-25':{exam:{a:{studentResults:{s1:{result:'기존 과제 기록',memo:'보존'}}}}}}, inactiveStudents:[]
};
const beforeMiddle=JSON.stringify(data.classes[0]);const beforeRecords=JSON.stringify(data.dailyRecords);
context.syncHighSchoolRoster(data);
const all = () => data.classes.flatMap(c=>c.students);
assert.equal(all().length,4);
assert(data.classes.some(c=>c.name==='화금'&&c.students[0].id==='s1'));
assert(data.classes.some(c=>c.name==='정규반 미배정'&&c.students.some(s=>s.id==='s2')));
assert.equal(data.examClasses[0].students[0].studentId,'s1');
assert.notEqual(data.examClasses[0].students[0].studentId,data.examClasses[1].students[0].studentId,'동명이인 학교별 분리');
assert.equal(JSON.stringify(data.classes[0]),beforeMiddle);
assert.equal(JSON.stringify(data.dailyRecords),beforeRecords);
const snapshot=JSON.stringify(data);context.syncHighSchoolRoster(data);assert.equal(JSON.stringify(data),snapshot);
const s=all().find(s=>s.id==='s1');s.name='변경이름';s.consults.push({content:'상담'});s.mockScores.push({year:'2026',exams:[{score:88}]});
data.examClasses[1].students.push({id:'row-other',studentId:'s1',name:'변경 전'});
context.syncHighSchoolRoster(data);assert.equal(data.examClasses[1].students[1].name,'변경이름');assert.equal(all().length,4);
assert.equal(s.consults[0].content,'상담');assert.equal(s.mockScores[0].exams[0].score,88);
// A saved round trip must keep memberships and history without creating duplicates.
const roundTrip=JSON.parse(JSON.stringify(data));context.syncHighSchoolRoster(roundTrip);assert.deepEqual(JSON.parse(JSON.stringify(roundTrip)),JSON.parse(JSON.stringify(data)));
console.log('High roster migration, idempotency, cross-class links, same-name separation and history preservation passed.');
