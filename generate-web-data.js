const fs = require('fs');
const path = require('path');

let chapters = [];
for (let i = 1; i <= 11; i++) {
  const num = String(i).padStart(2, '0');
  const filePath = path.join(__dirname, 'chapters', `ch${num}.txt`);
  const rawContent = fs.readFileSync(filePath, 'utf8').trim();
  const cleanCount = rawContent.normalize('NFC').replace(/\s+/gu, '').length;
  
  // 첫 줄에서 제목 추출
  const lines = rawContent.split('\n');
  const title = lines[0].replace('### ', '').trim();
  const body = lines.slice(1).join('\n').trim();

  chapters.push({
    index: i,
    numberStr: num,
    title: title,
    body: body,
    cleanCount: cleanCount,
    rawCount: rawContent.length
  });
}

const manuscript = fs.readFileSync(path.join(__dirname, 'novel-manuscript.md'), 'utf8');

const outputData = `// Novel Data Generated from novel-manuscript.md
window.NOVEL_DATA = {
  author: "주한태 (Ju Han-tae)",
  title: "30분 먼저 켜진 불빛 — 넘어진 자리에서 시스템을 고쳐 일어선 이야기",
  totalCleanCount: 30256,
  targetCount: 30000,
  chaptersCount: 11,
  conclusionSentence: "넘어지는 것을 두려워하지 않고, 넘어진 그 자리에서 열 개의 알람처럼 환경과 시스템을 바로잡아 다시 30분 먼저 강의실의 불을 켜는 사람, 나는 오늘도 그렇게 한 걸음 더 단단해진 발걸음으로 세상의 벽을 향해 뚜벅뚜벅 걸어 나간다.",
  chapters: ${JSON.stringify(chapters, null, 2)},
  manuscriptMarkdown: ${JSON.stringify(manuscript)}
};
`;

fs.writeFileSync(path.join(__dirname, 'novel-data.js'), outputData, 'utf8');
console.log('novel-data.js generated successfully!');
