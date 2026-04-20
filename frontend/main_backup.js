import items from './src/items_db.json';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline support
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('신규 업데이트가 있습니다. 지금 적용하시겠습니까?')) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('앱이 오프라인에서 실행될 준비가 되었습니다.');
  },
});

const app = document.getElementById('app');

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  render(); // Re-render to show install button
});

const itemNames = {
  "ITEM 01": "제품 마킹 규정 준수 증빙문",
  "ITEM 02": "출시 금지 일회용품 및 금지 재질 적합성 증빙",
  "ITEM 03": "소비자 인식 제고 및 환경 정보 제공 의무 이행",
  "ITEM 04": "비적합 제품 시정조치 및 당국 통보 절차",
  "ITEM 05": "일체형 뚜껑 설계 적합성 성적서",
  "ITEM 06": "지속가능한 제품 에코디자인 규정 발효 안내",
  "ITEM 07": "생산자 책임 재활용(EPR) 의무 이행 책임 문서",
  "ITEM 08": "분리수거 인프라 달성 증명 및 통계치 실증 체계",
  "ITEM 09": "재생 플라스틱 의무 함유량 산출식 (25%)",
  "ITEM 10": "포장재법(PPWR) 발효 숙지 및 대응 지침 수령 여부",
  "ITEM 11": "위임법령(Delegated Acts)에 따른 우선 품목 특화 자가진단표",
  "ITEM 12": "회원국 감축체계 대응을 위한 내부 출고량 관리 및 증빙자료",
  "ITEM 13": "디지털 제품 식별 정보 데이터베이스 연동 체계 설정 명세",
  "ITEM 14": "소비재 미판매 재고 물량의 단순 폐기 파쇄/소각 금지 시스템",
  "ITEM 15": "적합성평가 기술문서 및 EU 적합성 선언서(DoC)",
  "ITEM 16": "영업기밀 침해 방지 가이드 접목 BOM 및 다중재질 물질명세",
  "ITEM 17": "공인 규격 기반 포장재 유해물질 정밀 시험성적서 제출",
  "ITEM 18": "경제운영자별 역할(수입자/유통자 등) 개별 의무 이행",
  "ITEM 19": "공급망 원료 기원(Origin) 및 생산 배치 물리적 추적 체계",
  "ITEM 20": "제품 재질 물질 및 고위험성 우려물질 추적 명세서 전체",
  "ITEM 21": "기계적 내구성, 신뢰성 보증 및 수리가능성 정량화 수식/평가 증빙 서류",
  "ITEM 22": "전과정 모니터링 탄소 발자국 단계별 요구 전력/물류 운송 명세 체계",
  "ITEM 23": "디지털 제품 여권 필수 데이터 페이로드 종합 명세",
  "ITEM 24": "퇴비화 가능(Compostable) 포장재 의무 전환 적합성 입증",
  "ITEM 25": "소비자 분리배출 안내 EU 공통 표준 라벨링 시안",
  "ITEM 26": "일회용 플라스틱 음료병(전 재질) 재생 플라스틱 30% 함유량 확증",
  "ITEM 27": "재활용성 설계 공인 등급 산출 기준 기반 진단 평가 결과",
  "ITEM 28": "플라스틱 포장재 재생원료 함량 산정 및 적합성 인증",
  "ITEM 29": "의료·의약·영유아용 등 접촉민감 포장에 대한 재생원료 함량 의무 예외 입증",
  "ITEM 30": "포장재 빈 공간 비율 50% 상한 통제 및 체적 연산 입증",
  "ITEM 31": "포장재 최소화(Minimisation) 설계 및 중량·부피 감축 입증",
  "ITEM 32": "특정 일회용 포장재 형태 사용 전면 금지 대응 증빙",
  "ITEM 33": "포장재 재사용(Reuse) 목표 달성 및 시스템 참여 증빙",
  "ITEM 34": "ESPR 에코디자인 요건 적합성 선언(DoC) 및 CE 마킹"
};

let state = {
  screen: 'splash',
  role: null,
  surveyStep: 1,
  answers: { 1: [], 2: null }, // Step 1 is multiple choice array
  filteredItems: [],
  company: '',
  department: '',
  adminData: JSON.parse(localStorage.getItem('diag_records') || '[]')
};

function saveData(results) {
  const record = {
    id: state.adminData.length + 1,
    date: new Date().toLocaleDateString(),
    company: state.company || 'Anonymous',
    department: state.department || 'N/A',
    role: state.role || 'manufacturer',
    category: state.answers[1] || 'N/A', // Adjusted category mapping if needed
    items: results.map(i => i.id.replace('ITEM ', '')).join(', ')
  };
  state.adminData.push(record);
  localStorage.setItem('diag_records', JSON.stringify(state.adminData));
}

// Global render function
function render() {
  app.innerHTML = '';
  app.scrollTop = 0;
  
  switch(state.screen) {
    case 'splash': renderSplash(); break;
    case 'selection': renderSelection(); break;
    case 'tbu': renderTBU(); break;
    case 'survey': renderSurvey(); break;
    case 'results': renderResults(); break;
    case 'admin': renderAdmin(); break;
  }
}

function checkAdminPassword() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay fade-in';
  overlay.innerHTML = `
    <div class="popup-content" style="text-align: center;">
      <h2 style="color: var(--primary-teal); margin-bottom: 20px;">관리자 인증</h2>
      <input type="password" id="admin-pw" class="input-field" placeholder="비밀번호 입력" style="margin-bottom: 20px; text-align: center; font-size: 20px; letter-spacing: 0.2em;">
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn-outline" style="width: auto; padding: 10px 20px;" onclick="this.closest('.popup-overlay').remove()">취소</button>
        <button class="btn-primary" style="width: auto; padding: 10px 20px;" id="admin-pw-btn">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  const submitPw = () => {
    if (document.getElementById('admin-pw').value === '1004') {
      overlay.remove();
      state.screen = 'admin';
      render();
    } else {
      alert("비밀번호가 틀렸습니다.");
      document.getElementById('admin-pw').value = '';
    }
  };
  
  document.getElementById('admin-pw-btn').onclick = submitPw;
  document.getElementById('admin-pw').onkeydown = (e) => { if (e.key === 'Enter') submitPw(); };
  document.getElementById('admin-pw').focus();
}
window.checkAdminPassword = checkAdminPassword;
window.render = render;

function renderSplash() {
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.innerHTML = `
    <h3 style="color: var(--primary-teal); font-size: 14px; letter-spacing: 0.2em; margin-bottom: 8px;">EU 환경 규제</h3>
    <h1 class="text-gradient">자가진단</h1>
    
    <div class="notice-box">
      <h3>Notice.</h3>
      <p>본프로그램은 컨설팅 이전에 자가진단을 목적으로 제작되었으며, 법적 해석을 대체하지 않습니다. 세부 의무사항은 각 규제의 최신 조문 및 이행 법령에 따릅니다.</p>
    </div>

    <div class="glass-pane" style="margin-bottom: 30px;">
      <div class="input-group">
        <label class="input-label">회사명</label>
        <input type="text" class="input-field" id="company-input" placeholder="(입력란)" value="${state.company}">
      </div>
      <div class="input-group">
        <label class="input-label">소속 부서</label>
        <input type="text" class="input-field" id="dept-input" placeholder="(입력란)" value="${state.department}">
      </div>
    </div>

    <button class="btn-primary" id="start-btn" style="margin-bottom: 12px; opacity: 0.5;">자가진단 시작</button>
    ${deferredPrompt ? `<button class="btn-outline" id="install-btn" style="margin-bottom: 12px; border-color: var(--primary-teal); color: var(--primary-teal); text-align: center;">홈 화면에 앱 설치</button>` : ''}
    
    <div style="text-align: center;">
      <button class="btn-admin" onclick="checkAdminPassword()">관리자</button>
    </div>
  `;
  app.appendChild(div);

  const startBtn = document.getElementById('start-btn');
  const checkInputs = () => {
    const isFilled = state.company.trim() && state.department.trim();
    startBtn.style.opacity = isFilled ? "1" : "0.5";
    startBtn.style.pointerEvents = isFilled ? "auto" : "none";
  };
  
  document.getElementById('company-input').oninput = (e) => { state.company = e.target.value; checkInputs(); };
  document.getElementById('dept-input').oninput = (e) => { state.department = e.target.value; checkInputs(); };
  
  checkInputs(); // Initial check

  startBtn.onclick = () => { if (state.company.trim() && state.department.trim()) { state.screen = 'selection'; render(); } };
  
  if (deferredPrompt && document.getElementById('install-btn')) {
    document.getElementById('install-btn').onclick = async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        render();
      }
    };
  }
}

function renderSelection() {
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.innerHTML = `
    <h1>비즈니스 역할을<br/>정의하십시오</h1>
    <p style="color: var(--text-dim); font-size: 14px; margin-bottom: 30px;">
      본 프로그램은 제조자(Manufacturer)를 기준으로 제작되었습니다.
    </p>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button class="btn-outline role-btn" data-role="manufacturer" style="border-color: var(--primary-teal); border-width: 2px;">
        <span style="display:block; font-weight:700;">제조자 (Manufacturer)</span>
      </button>
      <button class="btn-outline role-btn" data-role="importer">
        <span style="display:block; font-weight:700;">수입자 (Importer)</span>
      </button>
      <button class="btn-outline role-btn" data-role="distributor">
        <span style="display:block; font-weight:700;">유통 (Distributor)</span>
      </button>
      <button class="btn-outline role-btn" data-role="authorizedrepresentative">
        <span style="display:block; font-weight:700;">권한대행자 (Authorized Representative)</span>
      </button>
    </div>

    <p style="margin-top: 30px; font-size: 11px; color: var(--text-dim); text-align: center; line-height: 1.5;">
      * 현재 버전에서는 중복 선택이 되지 않지만, 하반기 업데이트를 통해 다중 역할 선택 기능을 제공할 예정입니다.
    </p>
  `;
  app.appendChild(div);

  const showRolePopup = (roleName) => {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay fade-in';
    overlay.innerHTML = `
      <div class="popup-content" style="text-align: center;">
        <h2 style="color: var(--primary-teal); margin-bottom: 15px;">안내</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #eee; margin-bottom: 25px;">
          선택하신 <b>${roleName}</b> 역할에 대한 설문은<br/>2026년 하반기 업데이트를 통해 제공될 예정입니다.<br/>현재 버전에서는 <b>'제조자'</b> 역할만 지원됩니다.
        </p>
        <button class="btn-primary" style="width: auto; padding: 10px 30px;" onclick="this.closest('.popup-overlay').remove()">확인</button>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  div.querySelectorAll('.role-btn').forEach(btn => {
    btn.onclick = () => {
      const role = btn.dataset.role;
      if (role === 'manufacturer') { 
        state.role = role;
        state.screen = 'survey'; 
        state.surveyStep = 1; 
        state.answers = { 1: [], 2: null }; 
        render(); 
      } else { 
        showRolePopup(btn.innerText.trim());
      }
    };
  });
}

function renderTBU() {
  app.innerHTML = `
    <div class="fade-in glass-pane" style="text-align: center; margin-top: 100px;">
      <h1 style="font-size: 24px;">준비 중인<br/>세그먼트입니다.</h1>
      <p>수입 및 유통업자 가이드는 2026년 하반기 업데이트 예정입니다.</p>
      <button class="btn-primary" onclick="location.reload()">메인으로</button>
    </div>
  `;
}

function renderSurvey() {
  const steps = [
    {
      q: "주요 취급 제품군은 무엇입니까?<br/><span style='font-size:14px; color:var(--text-dim)'>(중복선택 가능)</span>",
      description: `
        <div class="admin-table-container" style="margin-bottom: 20px;">
          <table class="admin-table" style="white-space: normal;">
            <thead><tr><th style="width: 25%;">품목</th><th>주요 내용 및 예시</th></tr></thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; color: #fff;">포장재</td>
                <td style="line-height: 1.4;">내용물보다 용기 및 포장의 재활용성과 환경 영향이 핵심인 품목<br/><span style="color: var(--text-dim); font-size: 11px;">예: 식품, 화장품, 의약품 등</span></td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: #fff;">소비재/내구재</td>
                <td style="line-height: 1.4;">제품 자체의 내구성, 수리가능성, 재활용 설계가 중요한 품목<br/><span style="color: var(--text-dim); font-size: 11px;">예: 가전, 섬유(의류), 가구, 신발, 철강 등</span></td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: #fff;">일회용<br/>플라스틱</td>
                <td style="line-height: 1.4;">환경오염이 심한 '일회용 플라스틱' 소재 사용이 금지/제한된 품목<br/><span style="color: var(--text-dim); font-size: 11px;">예: 일회용컵/식기, 물티슈, 빨대, 용기 등</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      options: [
        { text: "포장재 (Packaging)", value: "PPWR" },
        { text: "소비재/내구재 (General)", value: "ESPR" },
        { text: "일회용 플라스틱 (SUP)", value: "SUPD" }
      ],
      multiple: true
    },
    {
      q: "해당 제품에 플라스틱<br/>소재가 포함됩니까? <button class='btn-help' id='help-btn'>도움말</button>",
      help: `
        <div class="popup-overlay" id="help-popup">
          <div class="popup-content" id="popup-inner">
            <h2 style="color: var(--primary-teal); margin-bottom: 15px;">이런 것도 플라스틱입니다!</h2>
            <div style="font-size: 13px; line-height: 1.6; color: #eee;">
              <b>① 화학적 변형 여부:</b> 옥수수나 사탕수수로 만들었어도 화학 공정을 거쳤다면 플라스틱입니다.<br/><br/>
              <b>② 코팅 및 첨가제:</b> 종이 빨대나 종이 컵이라도 내부에 플라스틱 코팅이 되어 있다면 플라스틱 포함 제품입니다.<br/><br/>
              <b>③ 합성 고무:</b> 특정 합성 고무 성분도 고분자 화합물로서 규제 범위에 포함될 수 있습니다.<br/><br/>
              <hr style="border: none; border-top: 1px solid #444; margin: 15px 0;">
              <b>※ 수출 품목군과의 연결:</b><br/>
              • <b>화장품:</b> 튜브 용기(PE/PP), 펌프 헤드, 캡 등<br/>
              • <b>식품:</b> 컵라면 용기(PS), 즉석밥 용기(PP), 비닐 파우치 등<br/>
              <p style="margin-top: 20px; color: var(--text-dim); font-size: 11px;">(팝업을 더블클릭하면 닫힙니다)</p>
            </div>
          </div>
        </div>
      `,
      options: [
          { text: "예 (Yes)", value: "yes" },
          { text: "아니오 (No)", value: "no" }
      ]
    }
  ];
  
  const step = steps[state.surveyStep - 1];
  const div = document.createElement('div');
  div.className = 'fade-in';
  const isMulti = step.multiple;
  div.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" style="width: ${state.surveyStep * 50}%"></div></div>
    <h1 style="margin-top: 20px;">${step.q}</h1>
    ${step.description || ''}
    ${step.help || ''}
    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 12px;" id="options-container">
      ${step.options.map(opt => `<button class="btn-outline opt-btn ${isMulti && state.answers[state.surveyStep]?.includes(opt.value) ? 'selected-multi' : ''}" data-val="${opt.value}" style="border-width: 2px; margin-bottom: 0;">${opt.text}</button>`).join('')}
    </div>
    ${isMulti ? `<button class="btn-primary" id="next-step-btn" style="margin-top: 24px; opacity: ${state.answers[state.surveyStep].length > 0 ? '1' : '0.5'}; pointer-events: ${state.answers[state.surveyStep].length > 0 ? 'auto' : 'none'};">다음 단계</button>` : ''}
  `;
  app.appendChild(div);
  
  if (document.getElementById('help-btn')) {
    const popup = document.getElementById('help-popup');
    document.getElementById('help-btn').onclick = () => popup.style.display = 'flex';
    document.getElementById('popup-inner').ondblclick = () => popup.style.display = 'none';
  }

  const goNext = () => {
    if (state.surveyStep < steps.length) { state.surveyStep++; render(); }
    else { 
      calculateResults(); 
      saveData(state.filteredItems);
      state.screen = 'results'; 
      render(); 
    }
  };

  div.querySelectorAll('.opt-btn').forEach(btn => {
    btn.onclick = () => {
      const val = btn.dataset.val;
      if (isMulti) {
        if (state.answers[state.surveyStep].includes(val)) {
          state.answers[state.surveyStep] = state.answers[state.surveyStep].filter(v => v !== val);
          btn.classList.remove('selected-multi');
        } else {
          state.answers[state.surveyStep].push(val);
          btn.classList.add('selected-multi');
        }
        const nextBtn = document.getElementById('next-step-btn');
        const hasSelection = state.answers[state.surveyStep].length > 0;
        nextBtn.style.opacity = hasSelection ? '1' : '0.5';
        nextBtn.style.pointerEvents = hasSelection ? 'auto' : 'none';
      } else {
        state.answers[state.surveyStep] = val;
        goNext();
      }
    };
  });

  if (isMulti) {
    document.getElementById('next-step-btn').onclick = goNext;
  }
}

function calculateResults() {
  const targetTags = state.answers[1]; // Array of selected tags
  state.filteredItems = items.filter(item => {
    // If ANY of the chosen multiple tags match the item's reg_tags or implicit 'ESPR' broad net
    return targetTags.some(tag => {
      if (tag === 'PPWR') return item.reg_tags.includes('PPWR') || item.reg_tags.includes('ESPR');
      if (tag === 'SUPD') return item.reg_tags.includes('SUPD') || item.reg_tags.includes('ESPR');
      return item.reg_tags.includes('ESPR');
    });
  });
  
  // Remove duplicates resulting from multiple matched tags
  const uniqueIds = new Set();
  state.filteredItems = state.filteredItems.filter(item => {
    if (uniqueIds.has(item.id)) return false;
    uniqueIds.add(item.id);
    return true;
  });
}

function renderResults() {
  app.innerHTML = `
    <div class="fade-in">
      <h1>진단 리포트</h1>
      <p style="margin-bottom: 30px; font-size: 14px; color: var(--text-dim);">입력된 정보를 기반으로 확인되는 <b style="color: var(--primary-teal)">${state.filteredItems.length}</b> 개의 대응 항목 리스트입니다.</p>
      
      <div class="item-grid" id="results-grid">
        ${state.filteredItems.map(item => {
          const rawId = item.id;
          const officialName = itemNames[rawId] || "유럽 환경 규제 적합성 대응 항목";
          
          return `
            <div class="item-card highlight clickable-card" data-id="${item.id}" style="cursor: pointer; height: auto; aspect-ratio: auto; min-height: 140px;">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 4px;">${item.id}</div>
              
              <div class="neon-card-title">${officialName}</div>
              
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                  <div>대응 여부: <span style="color: #fff">필수</span></div>
                  <div>해당 주체: <span style="color: #fff">전사업자</span></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 40px; display: flex; gap: 12px; flex-direction: column; padding-bottom: 60px;">
        <button class="btn-primary" onclick="renderChecklistSummary()">체크리스트 확인</button>
        <button class="btn-outline" style="text-align: center;" onclick="location.reload()">처음으로</button>
      </div>
    </div>
  `;
  
  document.querySelectorAll('.clickable-card').forEach(card => {
    card.onclick = () => {
      const item = state.filteredItems.find(i => i.id === card.dataset.id);
      showDetail(item.id);
    };
  });
}

function renderChecklistSummary() {
  app.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'fade-in';
  
  // Clean up bullets and leading numbers from the new polished data
  const filterExamples = (fields) => {
    if (!fields) return [];
    return fields
      .map(f => f.replace(/^[-▸\s•·0-9.]*/, '').trim())
      .filter(f => f.length > 1);
  };

  div.innerHTML = `
    <h1 style="margin-top: 40px;">체크리스트 요약</h1>
    <p>본 자가진단을 통해 도출된 핵심 체크사항 목록입니다.</p>
    
    <table class="checklist-table">
      <thead>
        <tr>
          <th style="width: 100px;">항목</th>
          <th>체크사항</th>
        </tr>
      </thead>
      <tbody>
        ${state.filteredItems.map(item => {
          const cleanFields = filterExamples(item.checklist_fields);
          const rawId = item.id;
          const officialName = itemNames[rawId] || "적합성 대응 항목";
          return `
            <tr>
              <td style="vertical-align: top;">
                <div style="font-weight: 800; font-size: 12px; color: var(--text-dim); margin-bottom: 4px;">${rawId}</div>
                <div style="font-weight: 700; color: #00FFD1; font-size: 13px; line-height: 1.4;">${officialName}</div>
              </td>
              <td style="text-align: left; padding: 16px;">
                ${cleanFields.map(f => `<div style="margin-bottom: 8px;">• ${f}</div>`).join('')}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div style="margin-top: 40px; padding-bottom: 60px; text-align: center;">
      <button class="btn-primary" onclick="location.reload()">재진단하기</button>
    </div>
  `;
  app.appendChild(div);
  window.scrollTo(0, 0);
}

function showDetail(id) {
  const item = items.find(i => i.id === id);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fade-in';
  overlay.style.display = 'block';
  
  let contentHtml = item.content
    .replace(/!\[\]\(images\/(.*?)\)/g, '<img src="/images/$1" style="width:100%; border-radius:12px; margin: 16px 0;">')
    .replace(/__/g, '')
    .replace(/\n\s*▸/g, '<br/>• ')
    .replace(/\n\s*-\s/g, '<br/>• ')
    .replace(/\n/g, '<br/>');

  overlay.innerHTML = `
    <div class="modal-content glass-pane" style="margin-top: 40px;">
      <button style="position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="this.closest('.modal-overlay').remove()">×</button>
      <span style="color: var(--primary-teal); font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">${item.id} | ${item.regulation || 'General'}</span>
      <div class="neon-card-title" style="margin: 12px 0 24px; font-size: 20px;">${itemNames[item.id] || "세부 내용 확인"}</div>
      <div style="font-size: 14.5px; line-height: 1.7; color: rgba(255,255,255,0.9); font-weight: 300;">${contentHtml}</div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--glass-border);">
        <p style="color: var(--primary-teal); font-weight: 700; font-size: 14px;">Compliance Timing: ${item.timing || 'TBU'}</p>
      </div>
    </div>
    <div style="height: 100px;"></div>
  `;
  document.body.appendChild(overlay);
}

function renderAdmin() {
  const roleMap = {
    'manufacturer': '제조자',
    'importer': '수입자',
    'distributor': '유통',
    'rep': '권한대행'
  };

  app.innerHTML = `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1>관리자 페이지</h1>
        <button class="btn-outline" style="width: auto; padding: 8px 15px; font-size: 12px;" onclick="location.reload();">닫기</button>
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>순번</th>
              <th>날짜</th>
              <th>회사/부서</th>
              <th>비즈니스 역할</th>
              <th>진단항목</th>
            </tr>
          </thead>
          <tbody>
            ${state.adminData.map((r, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${r.date}</td>
                <td>${r.company}<br/><span style="font-size: 10px; color: var(--text-dim)">${r.department}</span></td>
                <td>${roleMap[r.role] || r.role}</td>
                <td>${r.items}</td>
              </tr>
            `).reverse().join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn-primary" id="export-btn">Excel로 내보내기</button>
      </div>

      <p style="margin-top: 15px; font-size: 11px; color: var(--text-dim); text-align: center;">
        * 데이터는 브라우저의 로컬 스토리지에 저장됩니다.
      </p>
    </div>
  `;

  document.getElementById('export-btn').onclick = () => {
    let csvContent = "\uFEFF순번,Date,Company,Department,Role,Items\n";
    state.adminData.forEach((r, index) => {
      const sanitizedItems = typeof r.items === 'string' ? r.items.replace(/,/g, '|') : r.items;
      const mappedRole = roleMap[r.role] || r.role;
      csvContent += `${index + 1},${r.date},${r.company},${r.department},${mappedRole},"${sanitizedItems}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `diagnosis_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}


window.showDetail = showDetail;
window.renderChecklistSummary = renderChecklistSummary;

render();
