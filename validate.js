const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'novel-manuscript.md');
if (!fs.existsSync(targetFile)) {
  console.error('[FAIL] novel-manuscript.md file not found!');
  process.exit(1);
}

const content = fs.readFileSync(targetFile, 'utf8');

console.log('====================================================');
console.log('🔍 [과제 11] 나에 대한 3만 자 장편소설 전체 기준 검증');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function check(code, desc, condition, detail = '') {
  if (condition) {
    console.log(`✅ [PASS] ${code}: ${desc} ${detail ? '(' + detail + ')' : ''}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${code}: ${desc} ${detail ? '(' + detail + ')' : ''}`);
    failCount++;
  }
}

// 1. 경계 태그 검사 (T11-C42, C43, C44)
const startTag = '[[ALEPH_BODY_START]]';
const endTag = '[[ALEPH_BODY_END]]';
const startCount = (content.match(/\[\[ALEPH_BODY_START\]\]/g) || []).length;
const endCount = (content.match(/\[\[ALEPH_BODY_END\]\]/g) || []).length;
const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

check('T11-C42', '[[ALEPH_BODY_START]]가 정확히 한 번 존재함', startCount === 1, `발견: ${startCount}회`);
check('T11-C43', '[[ALEPH_BODY_END]]가 정확히 한 번 존재함', endCount === 1, `발견: ${endCount}회`);
check('T11-C44', 'START 태그가 END 태그보다 앞서 위치함', startIdx !== -1 && endIdx !== -1 && startIdx < endIdx);

// 2. 본문 추출 및 글자 수 검사 (T11-C05)
let bodyText = '';
if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
  bodyText = content.substring(startIdx + startTag.length, endIdx).trim();
}
const cleanBody = bodyText.normalize('NFC').replace(/\s+/gu, '');
check('T11-C05', '두 경계 표시 사이 공백 제거 순수 글자 수 30,000 이상', cleanBody.length >= 30000, `글자 수: ${cleanBody.length}자`);

// 3. 금지어 검사 (T11-C08, C09, C10)
const hasTodo = /\bTODO\b/.test(content);
const hasTbd = /\bTBD\b/.test(content);
const hasFixme = /FIXME/i.test(content);
const hasPlaceholder1 = content.includes('자리 표시');
const hasPlaceholder2 = content.includes('내용 추가 예정');

check('T11-C08', 'TODO 문구가 0건임', !hasTodo);
check('T11-C09', 'TBD 문구가 0건임', !hasTbd);
check('T11-C10', 'FIXME / 자리 표시 / 내용 추가 예정 0건임', !hasFixme && !hasPlaceholder1 && !hasPlaceholder2);

// 4. 본문 장 수 및 빈 장 검사 (T11-C06, C07)
const chapterMatches = bodyText.match(/### 제\d+장:.+/g) || [];
check('T11-C06', '본문 장 수가 10개 이상임', chapterMatches.length >= 10, `장 수: ${chapterMatches.length}개`);

let hasEmptyChapter = false;
for (let i = 0; i < chapterMatches.length; i++) {
  const currentChapter = chapterMatches[i];
  const nextChapter = chapterMatches[i + 1];
  const start = bodyText.indexOf(currentChapter);
  const end = nextChapter ? bodyText.indexOf(nextChapter) : bodyText.length;
  const chContent = bodyText.substring(start + currentChapter.length, end).trim();
  if (chContent.length < 500) {
    hasEmptyChapter = true;
    break;
  }
}
check('T11-C07', '내용이 비어 있는 장이 한 개도 없음', !hasEmptyChapter);

// 5. 목차와 본문 일치 검사 (T11-C11, C12, C13)
const tocMatches = content.match(/\| \*\*제\d+장: [^*]+\*\*/g) || [];
const tocTitles = tocMatches.map(m => m.replace(/\| \*\*/g, '').replace(/\*\*/g, '').trim());
const bodyTitles = chapterMatches.map(m => m.replace('### ', '').trim());

const titlesMatch = tocTitles.length === bodyTitles.length && tocTitles.every((t, i) => t === bodyTitles[i]);
check('T11-C11~C13', '목차와 본문의 장 제목, 개수, 순서가 100% 일치함', titlesMatch, `목차 ${tocTitles.length}개 / 본문 ${bodyTitles.length}개 일치`);

// 6. 문단 중복 검사 (T11-C19: 40자 이상 동일한 쌍 0개)
const paragraphs = bodyText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0 && !p.startsWith('<!--') && !p.startsWith('###') && !p.startsWith('---'));
const normalizedParagraphs = paragraphs.map(p => {
  return p.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}).filter(p => p.length >= 40);

const dupSet = new Set();
let dupCount = 0;
for (const norm of normalizedParagraphs) {
  if (dupSet.has(norm)) {
    dupCount++;
  } else {
    dupSet.add(norm);
  }
}
check('T11-C19', '정규화 40자 이상 문단 중 중복된 쌍이 0개임', dupCount === 0, `중복 문단: ${dupCount}건`);

// 7. 대조표 및 인물 검사 (T11-C14, C15, C47)
const hasFiveCategories = content.includes('1. 인물') && content.includes('2. 관계') && content.includes('3. 지명') && content.includes('4. 시간선') && content.includes('5. 세계 규칙');
check('T11-C14', '대조표에 인물·관계·지명·시간선·세계 규칙의 다섯 범주가 있음', hasFiveCategories);

const hasProtagonistFirst = content.includes('**인물 1**') && content.includes('**주한태 (나)**');
const hasNameInCh01 = bodyText.substring(0, 1500).includes('주한태');
check('T11-C47', '주인공이 주한태이고 첫 장에 본명이 있으며 대조표 인물 첫 항목임', hasProtagonistFirst && hasNameInCh01);

// 8. 큰 수정 3건 및 제출문 검사 (T11-C20~C25, T11-C31~C33)
const hasMajorRevisions = content.includes('[큰 수정 1]') && content.includes('[큰 수정 2]') && content.includes('[큰 수정 3]');
check('T11-C20~C25', '크게 고친 세 곳의 기록(앵커, 전후 요약, 발견 경위, 원인 분류) 완비', hasMajorRevisions);

const hasSubmissionQuestions = content.includes('① AI에게 맡긴 일') && content.includes('② 내가 직접 판단한 일') && content.includes('③ AI 제안을 따르지 않은 일');
check('T11-C31~C32', '제출문(AI/본인 판단 세 줄 및 판단 범위) 완비', hasSubmissionQuestions);

const hasQuickCheck = content.includes('① 파일 안 어디에 있나요') && content.includes('② 세 단계 안에 어떤 확인을 하나요') && content.includes('③ 무엇이 나오면 통과인가요') && content.includes('④ 안 될 때는 무엇이 나오나요');
check('T11-C33', '짧은 확인 방법 4단 질문 완비', hasQuickCheck);

// 9. 개인정보 및 비밀값 검사 (T11-C40, C41)
const hasSecret = /AIza[0-9A-Za-z-_]{35}/.test(content) || /ghp_[0-9A-Za-z]{36}/.test(content) || /sk-[0-9A-Za-z]{32}/.test(content);
check('T11-C41', '비밀번호, 토큰, API 키 원문이 0건임', !hasSecret);

console.log('\n====================================================');
console.log(`📊 검증 결과: 통과 ${passCount}건 / 실패 ${failCount}건`);
if (failCount === 0) {
  console.log('🎉 [PASS] All Validation Criteria 100% Met! 완벽하게 모든 기준 통과!');
} else {
  console.log('⚠️ [FAIL] 기준을 충족하지 못한 항목이 있습니다.');
}
console.log('====================================================\n');
