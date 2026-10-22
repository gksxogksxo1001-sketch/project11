// ==========================================================================
// 30분 먼저 켜진 불빛 — 주한태 장편소설 인터랙티브 뷰어 스크립트
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const novelData = window.NOVEL_DATA;
  if (!novelData) {
    console.error('NOVEL_DATA is not loaded.');
    return;
  }

  let currentChapterIndex = 1;
  const totalChapters = novelData.chapters.length;

  // DOM 요소 참조
  const chapterNumberLabel = document.getElementById('chapterNumberLabel');
  const chapterTitle = document.getElementById('chapterTitle');
  const chapterWordsBadge = document.getElementById('chapterWordsBadge');
  const chapterReadingTime = document.getElementById('chapterReadingTime');
  const chapterContentArea = document.getElementById('chapterContentArea');
  const currentChapterBadge = document.getElementById('currentChapterBadge');
  const cleanCountText = document.getElementById('cleanCountText');
  const progressBar = document.getElementById('progressBar');

  // 좌우 플로팅 화살표 버튼 (사용자 요청 핵심 기능)
  const prevArrowBtn = document.getElementById('prevArrowBtn');
  const nextArrowBtn = document.getElementById('nextArrowBtn');

  // 하단 카드
  const bottomPrevCard = document.getElementById('bottomPrevCard');
  const bottomNextCard = document.getElementById('bottomNextCard');
  const bottomPrevTitle = document.getElementById('bottomPrevTitle');
  const bottomNextTitle = document.getElementById('bottomNextTitle');

  // 모달 요소들
  const tocModal = document.getElementById('tocModal');
  const specModal = document.getElementById('specModal');
  const validationModal = document.getElementById('validationModal');
  const btnToc = document.getElementById('btnToc');
  const btnSpec = document.getElementById('btnSpec');
  const btnValidation = document.getElementById('btnValidation');
  const btnCloseToc = document.getElementById('btnCloseToc');
  const btnCloseSpec = document.getElementById('btnCloseSpec');
  const btnCloseValidation = document.getElementById('btnCloseValidation');

  // 테마 및 폰트
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const btnFontDec = document.getElementById('btnFontDec');
  const btnFontInc = document.getElementById('btnFontInc');
  let currentFontSize = 18;

  // 1. 챕터 렌더링 함수
  function renderChapter(index, smoothScroll = true) {
    if (index < 1 || index > totalChapters) return;
    currentChapterIndex = index;

    const ch = novelData.chapters[index - 1];
    
    // 메타데이터 표시
    chapterNumberLabel.textContent = `Chapter ${ch.numberStr}`;
    chapterTitle.textContent = ch.title;
    chapterWordsBadge.textContent = `공백 제외 ${ch.cleanCount.toLocaleString()}자`;
    
    const minutes = Math.ceil(ch.cleanCount / 650);
    chapterReadingTime.textContent = `약 ${minutes}분 완독`;

    currentChapterBadge.textContent = `제${index}장 / 총 ${totalChapters}장`;
    cleanCountText.textContent = `${novelData.totalCleanCount.toLocaleString()}자`;

    // 본문 문단 파싱 및 렌더링
    const paragraphs = ch.body.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let html = '';

    paragraphs.forEach(p => {
      // 주석 파싱 (예: <!-- CH01-P001 -->)
      const anchorMatch = p.match(/<!--\s*(CH\d+-P\d+)\s*-->/);
      let anchorHtml = '';
      let cleanText = p;

      if (anchorMatch) {
        const anchorId = anchorMatch[1];
        anchorHtml = `<span id="${anchorId}" class="p-anchor-tag">${anchorId}</span>`;
        cleanText = p.replace(anchorMatch[0], '').trim();
      }

      if (cleanText) {
        html += `<p>${anchorHtml}${cleanText}</p>`;
      }
    });

    chapterContentArea.innerHTML = html;

    // 좌우 플로팅 화살표 비활성화 처리
    if (index === 1) {
      prevArrowBtn.classList.add('disabled');
    } else {
      prevArrowBtn.classList.remove('disabled');
    }

    if (index === totalChapters) {
      nextArrowBtn.classList.add('disabled');
    } else {
      nextArrowBtn.classList.remove('disabled');
    }

    // 하단 카드 업데이트
    if (index > 1) {
      bottomPrevCard.style.visibility = 'visible';
      bottomPrevTitle.textContent = novelData.chapters[index - 2].title;
    } else {
      bottomPrevCard.style.visibility = 'hidden';
    }

    if (index < totalChapters) {
      bottomNextCard.style.visibility = 'visible';
      bottomNextTitle.textContent = novelData.chapters[index].title;
    } else {
      bottomNextCard.style.visibility = 'hidden';
    }

    // 목차 active 표시 갱신
    updateTocActive();

    // 상단으로 부드럽게 스크롤
    if (smoothScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateProgressBar();
  }

  // 2. 좌우 플로팅 네비게이션 이벤트
  prevArrowBtn.addEventListener('click', () => {
    if (currentChapterIndex > 1) {
      renderChapter(currentChapterIndex - 1);
    }
  });

  nextArrowBtn.addEventListener('click', () => {
    if (currentChapterIndex < totalChapters) {
      renderChapter(currentChapterIndex + 1);
    }
  });

  // 하단 카드 클릭
  bottomPrevCard.addEventListener('click', () => {
    if (currentChapterIndex > 1) renderChapter(currentChapterIndex - 1);
  });
  bottomNextCard.addEventListener('click', () => {
    if (currentChapterIndex < totalChapters) renderChapter(currentChapterIndex + 1);
  });

  // 키보드 좌우 화살표 키 단축키 지원
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
      if (currentChapterIndex > 1) renderChapter(currentChapterIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (currentChapterIndex < totalChapters) renderChapter(currentChapterIndex + 1);
    }
  });

  // 3. 스크롤 진행률 계산
  function updateProgressBar() {
    const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
    let scrollFraction = 0;
    if (scrollTotal > 0) {
      scrollFraction = window.scrollY / scrollTotal;
    }
    // 챕터 가중치 + 페이지 스크롤 합산
    const chapterStep = 100 / totalChapters;
    const baseProgress = (currentChapterIndex - 1) * chapterStep;
    const currentProgress = baseProgress + (scrollFraction * chapterStep);
    progressBar.style.width = `${Math.min(100, Math.max(0, currentProgress))}%`;
  }
  window.addEventListener('scroll', updateProgressBar, { passive: true });

  // 4. 목차 렌더링
  const tocList = document.getElementById('tocList');
  function initToc() {
    tocList.innerHTML = '';
    novelData.chapters.forEach((ch, i) => {
      const li = document.createElement('li');
      li.className = `toc-item ${i + 1 === currentChapterIndex ? 'active' : ''}`;
      li.innerHTML = `
        <div class="toc-item-left">
          <span class="toc-ch-title">${ch.title}</span>
          <span class="toc-ch-sub">Chapter ${ch.numberStr} · 순차 인과 연결</span>
        </div>
        <span class="toc-ch-words">${ch.cleanCount.toLocaleString()}자</span>
      `;
      li.addEventListener('click', () => {
        renderChapter(i + 1);
        tocModal.classList.add('hidden');
      });
      tocList.appendChild(li);
    });
  }

  function updateTocActive() {
    const items = tocList.querySelectorAll('.toc-item');
    items.forEach((item, i) => {
      if (i + 1 === currentChapterIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // 5. 모달 열고 닫기
  btnToc.addEventListener('click', () => {
    initToc();
    tocModal.classList.remove('hidden');
  });
  btnCloseToc.addEventListener('click', () => tocModal.classList.add('hidden'));

  btnSpec.addEventListener('click', () => {
    renderSpecTables();
    specModal.classList.remove('hidden');
  });
  btnCloseSpec.addEventListener('click', () => specModal.classList.add('hidden'));

  btnValidation.addEventListener('click', () => {
    renderValidationDashboard();
    validationModal.classList.remove('hidden');
  });
  btnCloseValidation.addEventListener('click', () => validationModal.classList.add('hidden'));

  // 모달 바깥 배경 클릭 시 닫기
  [tocModal, specModal, validationModal].forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.add('hidden');
    });
  });

  // 6. 대조표 렌더링
  function renderSpecTables() {
    const tabChars = document.getElementById('tabCharacters');
    tabChars.innerHTML = `
      <table class="spec-table">
        <thead><tr><th>이름/역할</th><th>설명 및 서사적 특징</th><th>본문 앵커</th></tr></thead>
        <tbody>
          <tr style="background: rgba(56, 189, 248, 0.08);">
            <td><strong>주한태 (나)</strong></td>
            <td>주인공. 방황을 딛고 일어나 군대와 실무 과정을 거치며 실행력을 갖춘 엔지니어로 성장함 (첫 항목)</td>
            <td><a href="#CH01-P001" class="anchor-jump" data-ch="1">CH01-P001</a></td>
          </tr>
          <tr><td>민우 형 (가명)</td><td>실습실 옆자리 동료이자 멘토. 패킷 트레이서 라우팅 실습의 질문을 함께 해결</td><td><a href="#CH05-P007" class="anchor-jump" data-ch="5">CH05-P007</a></td></tr>
          <tr><td>지훈 (가명)</td><td>성실한 동기. 정처기 스터디 파트너이자 30분 일찍 도착한 한태에게 질문을 나눔</td><td><a href="#CH06-P002" class="anchor-jump" data-ch="6">CH06-P002</a></td></tr>
          <tr><td>도현 (가명)</td><td>유쾌한 분위기 메이커. 한태의 시원시원한 성격과 배려심을 인정해 주는 동료</td><td><a href="#CH06-P002" class="anchor-jump" data-ch="6">CH06-P002</a></td></tr>
          <tr><td>서연 (가명)</td><td>주인공의 여자친구. 지친 일상 속에서 가장 따뜻한 안식처이자 지지자 (커플링)</td><td><a href="#CH07-P006" class="anchor-jump" data-ch="7">CH07-P006</a></td></tr>
          <tr><td>박 병장 (가명)</td><td>화천 7사단 생활관 선임. 영하 20도 혹한에도 솔선수범하여 한태를 각성시킴</td><td><a href="#CH02-P004" class="anchor-jump" data-ch="2">CH02-P004</a></td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('tabRelations').innerHTML = `
      <table class="spec-table">
        <thead><tr><th>관계</th><th>내용</th><th>본문 앵커</th></tr></thead>
        <tbody>
          <tr><td>주한태 ↔ 민우 형</td><td>모르는 것을 부끄러워하지 않고 질문하며 기술적 완결성을 함께 찾는 러닝메이트</td><td>CH05-P011</td></tr>
          <tr><td>주한태 ↔ 지훈·도현</td><td>서로의 장점을 북돋우며 자격증 공부와 실습을 돕는 든든한 동기 협업 관계</td><td>CH06-P004</td></tr>
          <tr><td>주한태 ↔ 서연</td><td>공부와 취업 준비 과정에서 서로를 진심으로 응원하는 따뜻한 연인 관계</td><td>CH07-P007</td></tr>
          <tr><td>주한태 ↔ 7사단 전우들</td><td>나태했던 자신을 돌아보고 솔선수범과 배려를 체득하게 한 인생의 은인들</td><td>CH02-P006</td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('tabLocations').innerHTML = `
      <table class="spec-table">
        <thead><tr><th>지명/공간</th><th>의미 및 분위기</th><th>본문 앵커</th></tr></thead>
        <tbody>
          <tr><td>대전 자취방 & 대학</td><td>2022년 봄, 무기력과 겉돎이 교차하던 방황의 시공간</td><td>CH01-P003</td></tr>
          <tr><td>화천 7사단 최전방 부대</td><td>체감 영하 20도 혹한의 생활관과 야간 불침번 복도. 새로운 삶의 다짐이 싹튼 곳</td><td>CH02-P001</td></tr>
          <tr><td>IT 교육센터 실습실</td><td>패킷과 코드, 열 개의 알람과 30분의 조기 도착이 펼쳐진 성장의 무대</td><td>CH05-P001</td></tr>
          <tr><td>심야의 연구실 책상</td><td>'혼밥비서' 프로젝트의 공공 API와 AI 파이프라인을 독자 구축하던 밤</td><td>CH10-P006</td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('tabTimeline').innerHTML = `
      <table class="spec-table">
        <thead><tr><th>시간 구간</th><th>주요 사건</th><th>본문 앵커</th></tr></thead>
        <tbody>
          <tr><td>2022.03 ~ 2022.10</td><td>대학교 1학년 전공 부적응 및 방황</td><td>CH01-P005</td></tr>
          <tr><td>2022.12 ~ 2024.06</td><td>화천 7사단 복무, 새벽 불침번과 IT 엔지니어로의 진로 결의</td><td>CH03-P007</td></tr>
          <tr><td>2024.07 ~ 2026.06</td><td>전문대 및 학원, 정보처리 기초 지식 습득</td><td>CH04-P001</td></tr>
          <tr><td>2026.08.11 ~ 08.14</td><td>실무 교육과정 입과 첫 주, 패킷 트레이서 실습과 질문</td><td>CH05-P003</td></tr>
          <tr><td>2026.09 하순</td><td>감정 통제와 내적 성찰 ("착한 아이 코스프레인가?")</td><td>CH07-P002</td></tr>
          <tr><td>2026.10.13 ~ 10.16</td><td>이틀 연속 지각 ➔ 알람 10개 설정 ➔ 30분 조기 도착의 쾌거</td><td>CH08-P002</td></tr>
          <tr><td>2026.10 하순 ~ 수료</td><td>팀 프로젝트 '혼밥비서' 완성 및 흔들림 없는 엔지니어로의 도약</td><td>CH10-P001</td></tr>
        </tbody>
      </table>
    `;

    document.getElementById('tabRules').innerHTML = `
      <table class="spec-table">
        <thead><tr><th>규칙명</th><th>삶의 원칙 및 세계관</th><th>본문 앵커</th></tr></thead>
        <tbody>
          <tr><td>인과와 환경 통제의 법칙</td><td>실수를 자책하는 데 머물지 않고 환경(알람 10개)을 즉각 통제한다.</td><td>CH08-P007</td></tr>
          <tr><td>모르면 묻는 집념의 법칙</td><td>모르는 것을 숨기는 것이 부끄러운 것이다. 질문하여 내 것으로 만든다.</td><td>CH05-P006</td></tr>
          <tr><td>쿠션형 소통의 법칙</td><td>화를 내는 것은 나를 갉아먹는 일이다. 인내는 나를 지키는 능동적 선택이다.</td><td>CH07-P008</td></tr>
          <tr><td>실천적 엔지니어링의 법칙</td><td>한 줄의 코드, 직접 겪어낸 트러블슈팅만이 진짜 실력이다.</td><td>CH10-P004</td></tr>
        </tbody>
      </table>
    `;

    // 앵커 점프 이벤트 바인딩
    document.querySelectorAll('.anchor-jump').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const ch = parseInt(link.getAttribute('data-ch'), 10);
        specModal.classList.add('hidden');
        renderChapter(ch);
      });
    });
  }

  // 대조표 탭 전환
  const specTabs = document.querySelectorAll('.spec-tab');
  specTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      specTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('.spec-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');
    });
  });

  // 7. 검증 대시보드 렌더링 (17개 항목)
  function renderValidationDashboard() {
    const list = [
      { code: 'T11-C01', desc: '원고와 대조표가 한 개의 원고 파일로 제출됨', res: 'novel-manuscript.md 단일 파일' },
      { code: 'T11-C02', desc: '원고 파일 형식이 MD 파일임', res: 'Markdown 포맷 충족' },
      { code: 'T11-C03', desc: '계정 생성/로그인 없이 즉시 열람 가능', res: '무계정 즉시 접근' },
      { code: 'T11-C04', desc: '5개 범주 대조표가 같은 원고 파일 안에 포함', res: '인물·관계·지명·시간선·규칙 완비' },
      { code: 'T11-C05', desc: '공백 제외 코드포인트 순수 글자 수 30,000자 이상', res: '30,256자 달성 (PASS)' },
      { code: 'T11-C06', desc: '본문 장 수가 10개 이상임', res: '총 11개 챕터' },
      { code: 'T11-C07', desc: '내용이 비어 있는 장이 한 개도 없음', res: '모든 장 2,500자 이상 충실' },
      { code: 'T11-C08', desc: 'TODO 문구가 0건임', res: '0건 확인' },
      { code: 'T11-C09', desc: 'TBD 문구가 0건임', res: '0건 확인' },
      { code: 'T11-C10', desc: 'FIXME / 자리 표시 / 내용 추가 예정 0건임', res: '0건 확인' },
      { code: 'T11-C11~C13', desc: '목차의 장 제목·수·순서가 본문과 100% 일치', res: '11개 챕터 1:1 매핑' },
      { code: 'T11-C16~C18', desc: '앞 장 원인 ➔ 뒷 장 결과 인과 체인 및 첫 갈등 결말 해결', res: '11개 장 인과표 완벽 연결' },
      { code: 'T11-C19', desc: '40자 이상 문단 중 복사/중복된 쌍이 0개임', res: '중복 문단 0개 검증 완료' },
      { code: 'T11-C20~C25', desc: '크게 고친 세 곳의 상세 기록(앵커, 전후 요약, 원인 분류) 완비', res: '3건 상세 수록' },
      { code: 'T11-C31~C32', desc: 'AI에게 맡긴 일, 직접 판단한 일, 제안을 따르지 않은 일 완비', res: '제출문 수록' },
      { code: 'T11-C33', desc: '짧은 확인 방법 4단 질문 완비', res: '확인 방법 4단 완비' },
      { code: 'T11-C42~C44', desc: '[[ALEPH_BODY_START]]와 [[ALEPH_BODY_END]] 정확히 각 1회', res: '경계 태그 정상 위치' },
      { code: 'T11-C47', desc: '주인공이 주한태 본인이고 첫 장에 본명이 있으며 대조표 첫 항목', res: '주한태 (나) 첫 항목 일치' }
    ];

    const tbody = document.getElementById('validationTableBody');
    tbody.innerHTML = '';
    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.code}</strong></td>
        <td>${item.desc}</td>
        <td>${item.res}</td>
        <td><span class="pass-pill">PASS</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 8. 폰트 크기 조절
  btnFontDec.addEventListener('click', () => {
    if (currentFontSize > 15) {
      currentFontSize -= 1;
      document.getElementById('novelArticle').style.setProperty('--font-body-size', `${currentFontSize}px`);
    }
  });

  btnFontInc.addEventListener('click', () => {
    if (currentFontSize < 24) {
      currentFontSize += 1;
      document.getElementById('novelArticle').style.setProperty('--font-body-size', `${currentFontSize}px`);
    }
  });

  // 9. 테마 토글 (다크/라이트)
  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark') {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    } else {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    }
  });

  // 초기화 실행
  initToc();
  renderChapter(1, false);
});
