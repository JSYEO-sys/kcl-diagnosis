import items from './src/items_db.json';
import { registerSW } from 'virtual:pwa-register';

// 구글 앱스 스크립트의 웹 앱 URL (이메일 발송용 API 키 역할)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbUpZJt4aUoveDOiEY0xA1rUeZK6KLx79LaP3W4C4szdlqyn9g5ZmBLav7rP-5LNewqw/exec";

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

const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');

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
  screen: 'splash', // splash, selection, survey, results, admin
  role: null,
  surveyStep: 1,
  answers: { 1: [], 2: null }, // Step 1 is multiple choice array
  filteredItems: [],
  company: '',
  department: '',
  itemStatuses: {}, // Tracks 'completed' or 'incomplete' per itemId
  adminData: JSON.parse(localStorage.getItem('diag_records') || '[]')
};

window.handleLogout = function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      for(let reg of regs) reg.unregister();
    });
  }
  if ('caches' in window) {
    caches.keys().then(keys => {
      for(let key of keys) caches.delete(key);
    });
  }
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => { 
        localStorage.clear();
        window.location.replace('/login'); 
    })
    .catch((err) => { 
        console.error('Logout error', err); 
        window.location.replace('/login'); 
    });
};

// Verify session authenticity on load
async function verifySession() {
  try {
    const res = await fetch('/api/auth/status');
    if (!res.ok) window.location.replace('/login');
  } catch (err) {
    console.error('Session verification failed', err);
  }
}
verifySession();


// Returns standard Header for the left action panel
function getHeaderHTML() {
  return `
    <div class="header-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <img src="./kcl_logo.png" class="logo-img" alt="KCL Logo" style="margin-bottom: 0;" />
        <span onclick="window.handleLogout()" style="cursor: pointer; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: normal; transition: color 0.3s;" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">[Log out]</span>
      </div>
      <div class="header-meta" style="margin-bottom: 0;">
        v2.1.0<br/>Last update: 2026-04-07
      </div>
    </div>
  `;
}

function getBackButtonHTML() {
  return `
    <div style="margin-top: auto; padding-top: 40px; text-align: left;">
      <button class="btn-outline neon-border" style="border-color: var(--neon-magenta); color: var(--neon-magenta); text-shadow: 0 0 10px rgba(255,0,255,0.3); padding: 12px 24px; font-weight: 800; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;" onclick="window.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
        이전 페이지
      </button>
    </div>
  `;
}

// Ensure items are prepared for matrix when entering results
function initItemStatuses() {
  state.filteredItems.forEach(item => {
    if (!state.itemStatuses[item.id]) {
        state.itemStatuses[item.id] = '미대응'; // Changed from null to '미대응'
    }
  });
}

function saveData() {
  const record = {
    id: state.adminData.length + 1,
    date: new Date().toLocaleDateString(),
    company: state.company || 'Anonymous',
    department: state.department || 'N/A',
    role: state.role || 'manufacturer',
    category: state.answers[1]?.join(',') || 'N/A',
    items: state.filteredItems.map(i => i.id.replace('ITEM ', '')).join(', ')
  };
  state.adminData.push(record);
  localStorage.setItem('diag_records', JSON.stringify(state.adminData));
}

// Main Render Hub
function render() {
  leftPanel.innerHTML = '';
  rightPanel.innerHTML = '';
  leftPanel.scrollTop = 0;
  rightPanel.scrollTop = 0;
  
  if (state.screen === 'splash') {
    renderSplashLeft();
    renderEmptyRight();
  } else if (state.screen === 'selection') {
    renderSelectionLeft();
    renderEmptyRight();
  } else if (state.screen === 'survey') {
    renderSurveyLeft();
    renderSurveyRightRoleInfo(); // <--- Update to show role info
  } else if (state.screen === 'results') {
    renderResultsLeft();
    renderResultsRightMatrix();
  } else if (state.screen === 'admin') {
    renderAdminLeft();
    renderAdminRight();
  }
}

// ------------------------------------------------------------------
// Left Panel Renderers
// ------------------------------------------------------------------
const disclaimerHTML = `
  <div style="font-size:14px; line-height:1.7; color: rgba(255,255,255,0.7); padding: 20px;">
    <h3 style="color:var(--primary-teal); margin-bottom:16px;">[EU 환경 규제(SUPD·ESPR·PPWR) 대응 자가진단 적용 범위 및 면책 고지]</h3>
    <p style="margin-bottom:12px;">본 프로그램은 EU 포장 및 포장 폐기물 규정(PPWR), 일회용 플라스틱 지침(SUPD), 에코디자인 규정(ESPR)의 핵심 요구사항을 기반으로 개발된 자가진단 프로그램입니다. 본 프로그램은 공급망 관리 및 규제 선제 대응을 위한 참고 자료이며, 법적 적합성을 보증하는 인증 문서나 공식 법률 자문을 대체하지 않습니다. 중대 사안에 대해서는 반드시 전문 법무법인 및 현지 규제 대행 기관 자문을 병행하시기 바랍니다.</p>
    <p style="margin-bottom:12px;">본 프로그램은 현재 신규 입법 체계상 '제조자' 의무 중심으로 작성되었으며, 수입자·유통업자·권한대리인 등 경제운영자별 책임은 규정에 따라 별도 적용됩니다. EU 역외 기업은 EPR 이행 및 시장감시 대응을 위해 EU 역내 법정 권한대리인(AR) 지정이 강제될 수 있으며, 실제 수출 대상국의 국내 이행 법령(National Law)을 반드시 교차 검토해야 합니다.</p>
    <p style="margin-bottom:12px;">ESPR·PPWR의 세부 기준은 향후 위임법령(Delegated Acts) 및 이행법령(Implementing Acts)을 통해 지속 고도화될 예정이므로, 협력사는 기술 문서 및 제품 설계 기준을 최신 요구사항에 맞추어 상시 업데이트할 의무가 있습니다.</p>
    <p>제품 법정 적합성은 단일 시험성적서가 아닌 BOM·SDS·공급망 물질수지·설계 도면 등 기술문서 전체를 기반으로 판정됩니다. 제출 자료의 정확성·무결성에 대한 1차 책임은 해당 정보를 제공한 공급업체에 귀속되며, 허위 지조 정보 제공으로 인한 규제 위반 시 엄중한 책임이 적용됩니다. 비적합 확인 시 유통 제한·리콜·전면 철수 조치가 강제될 수 있습니다. 해당사와 협력사는 공급망 추적성을 확보하고, 요청 시 10일 이내 기술 문서 제출 체계와 신속한 시정 조치 절차를 상시 운영해야 합니다.</p>
  </div>
`;

window.showNoticePopup = function(text, isLarge = false) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fade-in';
  overlay.innerHTML = `
    <div class="modal-content ${isLarge ? 'large' : ''}" style="border-width: 2px; border-color: var(--primary-teal);">
      <h2 style="color: var(--primary-teal); margin-bottom: 24px; font-size: ${isLarge ? '48px' : '24px'}">${text}</h2>
      <p style="color: var(--text-dim); font-size: ${isLarge ? '20px' : '14px'}; margin-top: ${isLarge ? 'auto' : '20px'};">더블클릭하여 프로그램으로 돌아갑니다</p>
    </div>
  `;
  overlay.ondblclick = () => overlay.remove();
  document.body.appendChild(overlay);
};

window.showPlasticPopup = function() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fade-in';
  overlay.innerHTML = `
    <div class="modal-content large" style="border-width: 2px; border-color: var(--primary-teal); max-width: 800px; padding: 50px;">
      <h2 style="color: var(--primary-teal); margin-bottom: 30px; font-size: 32px;">이런 것도 플라스틱입니다!</h2>
      <div style="font-size: 18px; line-height: 1.8; color: #eee; text-align: left;">
        <b>① 화학적 변형 여부:</b> 옥수수나 사탕수수로 만들었어도 화학 공정을 거쳤다면 플라스틱입니다.<br/><br/>
        <b>② 코팅 및 첨가제:</b> 종이 빨대나 종이 컵이라도 내부에 플라스틱 코팅이 되어 있다면 플라스틱 포함 제품입니다.<br/><br/>
        <b>③ 합성 고무:</b> 특정 합성 고무 성분도 고분자 화합물로서 규제 범위에 포함될 수 있습니다.<br/><br/>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 25px 0;">
        <b style="color: var(--neon-yellow);">※ 수출 품목군과의 연결:</b><br/>
        • <b>화장품:</b> 튜브 용기(PE/PP), 펌프 헤드, 캡 등<br/>
        • <b>식품:</b> 컵라면 용기(PS), 즉석밥 용기(PP), 비닐 파우치 등<br/>
      </div>
      <p style="color: var(--text-dim); font-size: 16px; margin-top: 40px; text-align: center;">(화면을 더블클릭하면 닫힙니다)</p>
    </div>
  `;
  overlay.ondblclick = () => overlay.remove();
  document.body.appendChild(overlay);
};

function renderSplashLeft() {
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.innerHTML = `
    ${getHeaderHTML(false)}
    <h1 class="text-gradient" style="margin-bottom: 40px;">자가진단 시작하기</h1>

    <div class="input-group">
      <label class="input-label">회사명</label>
      <input type="text" class="input-field" id="company-input" placeholder="소속 회사명을 입력해주세요" value="${state.company}">
    </div>
    <div class="input-group">
      <label class="input-label">소속 부서</label>
      <input type="text" class="input-field" id="dept-input" placeholder="부서명을 입력해주세요" value="${state.department}">
    </div>

    <button class="btn-primary" id="start-btn" style="margin-top: 40px; opacity: 0.5;">역할 선택으로 이동 ➔</button>

    <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
      <button class="btn-outline" style="width: auto; padding: 12px 24px; font-size: 14px; border: none; text-align: center;" onclick="window.enterAdmin()">관리자 모드</button>
    </div>
  `;
  leftPanel.appendChild(div);

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
}

function renderSelectionLeft() {
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.minHeight = '100%';
  div.innerHTML = `
    ${getHeaderHTML()}
    <h1 class="text-gradient">비즈니스 역할 정의</h1>
    <p style="color: var(--text-dim); font-size: 14px; margin-bottom: 30px;">
      공급망 생태계에서의 귀사의 역할을 정확히 선택해 주십시오. (현재 버전은 제조자 기준으로 제작되었습니다.)
    </p>
    
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <button class="btn-outline role-btn" data-role="manufacturer" style="border-color: var(--primary-teal); border-width: 2px;">
        <span style="display:block; font-size: 20px; font-weight:800; margin-bottom: 8px;">제조자 (Manufacturer)</span>
        <span style="display:block; font-size: 14px; color: var(--text-dim);">제품을 시장에 원천적으로 생산하여 공급하는 주체</span>
      </button>
      <button class="btn-outline role-btn" data-role="importer" style="opacity: 0.7;">
        <span style="display:block; font-size: 20px; font-weight:800; margin-bottom: 8px;">수입자 (Importer)</span>
        <span style="display:block; font-size: 14px; color: var(--text-dim);">EU 역외에서 생산된 제품을 EU 내로 수입하는 주체</span>
      </button>
      <button class="btn-outline role-btn" data-role="distributor" style="opacity: 0.7;">
        <span style="display:block; font-size: 20px; font-weight:800; margin-bottom: 8px;">유통자 (Distributor)</span>
        <span style="display:block; font-size: 14px; color: var(--text-dim);">EU 내에서 제품을 유통망에 공급하는 주체</span>
      </button>
      <button class="btn-outline role-btn" data-role="authorizedrepresentative" style="opacity: 0.7;">
        <span style="display:block; font-size: 20px; font-weight:800; margin-bottom: 8px;">권한대행자 (Authorized Representative)</span>
        <span style="display:block; font-size: 14px; color: var(--text-dim);">제조자의 위임을 받아 행정 의무를 대행하는 법인</span>
      </button>
    </div>
  `;
  div.innerHTML += getBackButtonHTML();
  leftPanel.appendChild(div);

  div.querySelectorAll('.role-btn').forEach(btn => {
    btn.onclick = () => {
      const role = btn.dataset.role;
      state.role = role;
      state.screen = 'survey'; 
      state.surveyStep = 1; 
      state.answers = { 1: [], 2: null }; 
      render(); 
    };
  });
}

function renderSurveyLeft() {
  const steps = [
    {
      q: "주요 취급 제품군은 무엇입니까?<br/><span style='font-size:16px; color:var(--text-dim); font-weight:500;'>(복수 선택이 가능합니다)</span>",
      options: [
        { text: "포장재 (Packaging)", value: "PPWR" },
        { text: "소비재/내구재 (General Product)", value: "ESPR" },
        { text: "일회용 플라스틱 (SUP)", value: "SUPD" }
      ],
      multiple: true
    },
    {
      q: "해당 제품에 플라스틱 소재가 포함됩니까?",
      options: [
          { text: "예 (Yes - 코팅 등 일부 포함)", value: "yes" },
          { text: "아니오 (No - 일체 포함 안함)", value: "no" }
      ]
    }
  ];
  
  const step = steps[state.surveyStep - 1];
  const isMulti = step.multiple;
  
  if (state.surveyStep === 2) {
    setTimeout(() => { window.showPlasticPopup(); }, 50);
  }
  
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.minHeight = '100%';
  div.innerHTML = `
    ${getHeaderHTML()}
    <div class="progress-bar"><div class="progress-fill" style="width: ${state.surveyStep * 50}%"></div></div>
    <h1 style="margin-top: 20px; font-size: 32px;">${step.q}</h1>
    
    <div style="margin-top: 40px; display: flex; flex-direction: column; gap: 16px;" id="options-container">
      ${step.options.map(opt => `<button class="btn-outline opt-btn ${isMulti && state.answers[state.surveyStep]?.includes(opt.value) ? 'selected-multi' : ''}" data-val="${opt.value}" style="font-size: 18px; border-width: 2px;">${opt.text}</button>`).join('')}
    </div>
    
    ${isMulti ? `<button class="btn-primary" id="next-step-btn" style="margin-top: 40px; opacity: ${state.answers[state.surveyStep].length > 0 ? '1' : '0.5'}; pointer-events: ${state.answers[state.surveyStep].length > 0 ? 'auto' : 'none'};">다음 질문 ➔</button>` : ''}
    ${getBackButtonHTML()}
  `;
  leftPanel.appendChild(div);

  const goNext = () => {
    if (state.surveyStep < steps.length) { 
      state.surveyStep++; 
      render(); 
    }
    else { 
      calculateResults(); 
      initItemStatuses();
      saveData();
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
  const targetTags = state.answers[1];
  state.filteredItems = items.filter(item => {
    return targetTags.some(tag => {
      if (tag === 'PPWR') return item.reg_tags.includes('PPWR') || item.reg_tags.includes('ESPR');
      if (tag === 'SUPD') return item.reg_tags.includes('SUPD') || item.reg_tags.includes('ESPR');
      return item.reg_tags.includes('ESPR');
    });
  });
  
  const uniqueIds = new Set();
  state.filteredItems = state.filteredItems.filter(item => {
    if (uniqueIds.has(item.id)) return false;
    uniqueIds.add(item.id);
    return true;
  });
}

function renderResultsLeft() {
  if (state.role !== 'manufacturer') {
    const div = document.createElement('div');
    div.className = 'fade-in';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.minHeight = '100%';
    div.innerHTML = `
      ${getHeaderHTML()}
      <h1 class="text-gradient">진단 항목<br/><span style="color:var(--neon-yellow);">준비 중</span></h1>
      <p style="margin-bottom: 24px; font-size: 16px; color: var(--text-dim); line-height:1.6;">
        현재 버전에서는 <b>제조자(Manufacturer)</b>를 제외한 나머지 주체의 세부 진단 가이드라인 및 항목 점검 기능이 준비 중입니다.
        <br/><br/>향후 대상별 규제 데이터가 업데이트될 예정입니다.
      </p>
      <button class="btn-outline neon-border" onclick="location.reload()" style="border-color: #00F2FF; color: #00F2FF; width: 100%; font-weight:800; padding:16px;">처음으로 돌아가기</button>
      ${getBackButtonHTML()}
    `;
    leftPanel.appendChild(div);
    return;
  }

  const div = document.createElement('div');
  div.className = 'fade-in';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.minHeight = '100%';
  div.innerHTML = `
    ${getHeaderHTML()}
    <h1 class="text-gradient">도출된<br/>진단 체크리스트</h1>
    <p style="margin-bottom: 24px; font-size: 14px; color: var(--text-dim); line-height:1.6;">
      귀하의 기초 입력 자료를 토대로 총 <b style="color: var(--primary-teal)">${state.filteredItems.length}</b>개의 점검 항목을 노출합니다. 
      각 항목을 검토 후 <b>[미완료/완료]</b>를 마킹해 주십시오. 우측 매트릭스에 리스크가 실시간으로 반영됩니다.
    </p>
    
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${state.filteredItems.map(item => {
        const rawId = item.id;
        const officialName = itemNames[rawId] || "유럽 환경 규제 적합성 대응 항목";
        const currentStatus = state.itemStatuses[rawId] || '미대응';
        
        return `
          <div class="checklist-item ${currentStatus === '완료' ? 'completed' : ''}" data-id="${rawId}">
            <div class="checklist-content">
              <div class="checklist-id">${rawId}</div>
              <div class="checklist-title">${officialName}</div>
              <div style="font-size: 13px; color: var(--text-dim); cursor:pointer; text-decoration: underline;" onclick="window.showDetail('${rawId}')">요구사항 세부내용 보기</div>
            </div>
            <div class="checklist-actions" style="flex-wrap: nowrap;">
              <button class="btn-toggle ${currentStatus === '미대응' ? 'active' : ''}" data-state="미대응" onclick="window.toggleStatus('${rawId}', '미대응')">미대응</button>
              <button class="btn-toggle ${currentStatus === '진행중' ? 'active' : ''}" data-state="진행중" onclick="window.toggleStatus('${rawId}', '진행중')">진행중</button>
              <button class="btn-toggle ${currentStatus === '완료' ? 'active' : ''}" data-state="완료" onclick="window.toggleStatus('${rawId}', '완료')">완료</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ${getBackButtonHTML()}
  `;
  leftPanel.appendChild(div);
}

function renderAdminLeft() {
  const div = document.createElement('div');
  div.className = 'fade-in';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.minHeight = '100%';
  div.innerHTML = `
    ${getHeaderHTML()}
    <h2 class="text-gradient" style="margin-bottom: 24px;">Admin Dashboard</h2>
    <p style="color: var(--text-dim); margin-bottom: 40px; font-size: 14px; line-height: 1.6;">
      진단 시뮬레이션을 수행한 기업 및 부서들의 내역을 확인하고 데이터를 내보낼 수 있는 관리자 화면입니다.
    </p>

    <div class="neon-box" style="margin-bottom: 24px; text-align: center;">
      <div class="counter-title">총 누적 진단 건수</div>
      <div class="counter-value" style="color: var(--neon-yellow);">${state.adminData.length} <span style="font-size:16px;">건</span></div>
    </div>

    <button class="btn-primary" onclick="window.sendAdminEmail()" id="btn-export-email" style="margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      Excel 이메일 전송
    </button>
    ${getBackButtonHTML()}
  `;
  leftPanel.appendChild(div);
}


// ------------------------------------------------------------------
// Right Panel Renderers
// ------------------------------------------------------------------
const roleDataMap = {
  manufacturer: {
    title: "제조자",
    color: "var(--neon-green)",
    bg: "./bg_manufacturer.png",
    defs: {
      "PPWR": "포장재를 직접 제조하거나, 제품을 포장하여 '포장된 제품(Packaged Product)'을 제조하는 자연인 또는 법인.",
      "SUPD": "회원국 내에 설립되어 일회용 플라스틱 제품을 직업적으로 제조, 충전, 판매하는 자연인 또는 법인.",
      "ESPR": "제품을 제조하거나 제품의 설계 또는 제조를 의뢰하고 해당 제품을 자신의 이름이나 상표로 시장에 출시하는 자."
    },
    duties: {
      "PPWR": [
        "재활용을 위한 설계(Design for Recycling): 최소 C등급 이상의 재활용성 성과 등급 충족 설계",
        "최소 재활용 원료 함량(Minimum Recycled Content) 관련 PCR 원료 비율 달성",
        "포장재 최소화(Packaging Minimisation): 공간 부피를 줄이고 빈 공간 50% 이하 통제",
        "적합성 평가 및 포장재 최초 제공 회원국 EPR 의무 레지스터 등록"
      ],
      "SUPD": [
        "제품 설계 요구사항 준수 (예: 테더링 캡 적용, rPET 플라스틱 25% 함유 최적화)",
        "마킹(Marking) 요구사항 준수: 플라스틱 함유 표식 및 부정적 영향 명시 시각적 마크 부착",
        "EPR 비용 부담: 공공 수거 및 정화 비용(Clean-ups) 재정적 전액 부담"
      ],
      "ESPR": [
        "에코디자인 필수 요구사항 준수: 물리적 내구성, 수리 가능성, 재활용 용이성 극대화 설계",
        "관련 위임법률 기반 적합성 평가 수행 및 기술 문서 구비, 최종 CE 마크 부착",
        "특정 소비재 무단 파괴 금지 준수 및 매년 폐기량 및 사유 투명 공개",
        "디지털 제품 여권(DPP) 생성 및 데이터 접근 식별자 생성 배포"
      ]
    }
  },
  importer: {
    title: "수입자",
    color: "var(--primary-teal)",
    bg: "./bg_importer.png",
    defs: {
      "PPWR": "제3국에서 생산된 포장재 또는 포장된 제품을 EU 시장에 최초로 출시하는 자연인 또는 법인.",
      "SUPD": "EU 외부에서 일회용 플라스틱 제품이나 포장재를 들여와 특정 회원국에 최초 배치하는 자.",
      "ESPR": "제3국(EU 외부)에서 생산된 제품을 EU 역내 시장에 출시하는 역내 설립 자연인/법인."
    },
    duties: {
      "PPWR": [
        "제조자 요건(포장재 최소화, 재활용성, 재생 원료 함량 등) 충족 증명 서류 수취 및 적법성 검증",
        "제품 출시 대상 개별 국가 단위의 EPR 대장 등록 및 재활용 분담금 납부",
        "수입자 연락처 패키지 명시 확인 및 필수 재활용 지침 QR 코드 검수"
      ],
      "SUPD": [
        "수입품 사전 검열: 금지 품목(EPS 식품용기 등) 해당 시 시장 출시 차단 의무 이행",
        "제품으로부터 기인한 폐기물 수거 및 정화 비용 등 EPR 수수료 현지 납부 의무 병행"
      ],
      "ESPR": [
        "제조자의 적합성 평가 및 기술 문서 완비 확인 및 불량 제조품 차단 (1차 방어선 역할)",
        "CE 마크 및 디지털 제품 여권(DPP)의 실 연동 여부 점검",
        "제품 및 포장에 수입자 이름/등록상표/연락주소 표시 및 10년 기준 문서 보관"
      ]
    }
  },
  distributor: {
    title: "유통자",
    color: "var(--neon-yellow)",
    bg: "./bg_distributor.png",
    defs: {
      "PPWR": "포장재나 제품을 시장에 제공하는 제조자/수입자 외의 최종 업자 및 풀필먼트 제공자.",
      "SUPD": "제품을 구매해 소비자에게 전달하는 중간 유통망 (원격 판매자 포함).",
      "ESPR": "제품 공급망 내 제조/수입자 외의 주체로서 시장에 제공(유통/판매)하는 주체."
    },
    duties: {
      "PPWR": [
        "유통 취급 포장재 내 규범적 재활용 라벨링 및 디지털 라벨(QR코드) 정상 부착 확인",
        "상류측 공급자(제조·수입자)의 EPR 대장 시스템 등록 및 분담금 준수 상황 점검 의무"
      ],
      "SUPD": [
        "금지 항목(플라스틱 빨대, 산화분해성 제품 등) 취급 시 즉시 판매 중단 및 시장 퇴출 조치",
        "소매 유통 간 규제 위법 여부 확인 및 생산자 의무 대상 전이 여부 점검"
      ],
      "ESPR": [
        "출시 전 CE 인증 마크 및 디지털 제품 여권 캐리어 정상 식별 확인",
        "보관 또는 운송 구간 간 환경 조건에 따른 에코디자인 요건 훼손 방지 보장",
        "위반 의심 시 유통 전면 중단 조치 및 정상 규정 준수 전까지 시장 내 차단"
      ]
    }
  },
  authorizedrepresentative: {
    title: "권한대행인",
    color: "var(--danger-red)",
    bg: "./bg_auth_rep.png",
    defs: {
      "PPWR": "제조자의 EPR 대행 지정을 받았거나 '원격 판매자'가 필수로 지정한 EPR 권한대행인.",
      "SUPD": "역내 실체 없는 원격 판매자가 단일 회원국의 EPR 의무 대행을 위해 지명한 대리인.",
      "ESPR": "제조자로부터 특정 법적 의무 및 위임을 서면으로 받아 대행하는 역내 자연인/법인."
    },
    duties: {
      "PPWR": [
        "원격 판매자를 대체하여 해당 대상 회원국 내 EPR 의무(쓰레기 발생 추산 등) 직접 수행",
        "제품별 포장재 발생량을 국가 기관에 보고 및 EPR 재정 분담금 납무 업무 대행",
        "감시 당국 행정 요청 시 패키징 적합성 입증 문서 등 적극 제공 방어 지원"
      ],
      "SUPD": [
        "단일 또는 복수 유럽 회원국 단위별 상이한 수거 및 정화 기금 관련 EPR 행정 직접 보고 수행",
        "개별 국가 단위 대응 통한 원격 판매자의 수수료 대응력 상실 보완 및 협력"
      ],
      "ESPR": [
        "제조자를 대신해 EU 적합성 선언서 및 필수 기술 문서를 10년 기준 현지 보관 관리",
        "제품 부적합 및 위험도 구제 시 정부 관련 부처와의 공식 소통 창구 역할 일원화 담당"
      ]
    }
  }
};

function renderSurveyRightRoleInfo() {
  const roleId = state.role || 'manufacturer';
  const roleInfo = roleDataMap[roleId];
  if (!roleInfo) {
    renderEmptyRight();
    return;
  }
  
  const bgStyle = `
    background: linear-gradient(rgba(5,5,5,0.85), rgba(5,5,5,0.95)), url('${roleInfo.bg}') center/cover;
    height: 100%;
    overflow-y: auto;
    padding: 60px 40px;
    position: relative;
    border-radius: 24px;
    scrollbar-width: none;
  `;

  let html = `<div class="fade-in glass-pane" style="${bgStyle}">`;
  html += `<h1 style="font-size: 40px; color: ${roleInfo.color}; text-shadow: 0 0 15px ${roleInfo.color}80; margin-bottom: 30px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">${roleInfo.title}</h1>`;
  
  ['ESPR', 'PPWR', 'SUPD'].forEach(reg => {
    html += `
      <div style="margin-bottom: 30px; background: rgba(255,255,255,0.03); border-left: 2px solid ${roleInfo.color}; padding: 20px; border-radius: 0 16px 16px 0;">
         <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;">
           <span style="background: ${roleInfo.color}20; color: ${roleInfo.color}; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 16px; letter-spacing: 1px;">${reg}</span>
           <span style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; line-height: 1.5; word-break: keep-all;">${roleInfo.defs[reg]}</span>
         </div>
         
         <div style="padding-left: 12px;">
           ${roleInfo.duties[reg].map(duty => `
             <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                <div style="width: 6px; height: 6px; background: ${roleInfo.color}; box-shadow: 0 0 10px ${roleInfo.color}; margin-top: 6px; margin-right: 12px; flex-shrink: 0; transform: rotate(45deg);"></div>
                <div style="color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.6; word-break: keep-all;">${duty}</div>
             </div>
           `).join('')}
         </div>
      </div>
    `;
  });

  html += `</div>`;
  rightPanel.innerHTML = html;
}

function renderEmptyRight() {
  rightPanel.innerHTML = `
    <div class="glass-pane fade-in" style="height: 100%; overflow-y: auto;">
      ${disclaimerHTML}
    </div>
  `;
}

function renderResultsRightMatrix() {
  if (state.role !== 'manufacturer') {
    rightPanel.innerHTML = `
      <div class="fade-in glass-pane" style="height: 100%; display: flex; flex-direction: column; align-items:center; justify-content:center; gap:24px; text-align:center;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--neon-yellow)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 10px var(--neon-yellow)); margin-bottom: 20px;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h2 style="font-size: 32px; color:#fff; margin:0;">RISK 매트릭스 서비스 <span style="color:var(--neon-yellow);">준비 중</span></h2>
        <p style="color:var(--text-dim); font-size:16px; max-width: 80%; line-height: 1.6;">
          선택하신 <b>${roleDataMap[state.role]?.title || '역할'}</b>에 대한 진단 항목 맵핑 및 Risk 시뮬레이션 알고리즘이 차기 버전에서 제공될 예정입니다. 데이터 수집 및 법률 검토가 완료되는 대로 업데이트 됩니다.
        </p>
      </div>
    `;
    return;
  }

  const totalItems = state.filteredItems.length;
  let countNone = 0; let countProg = 0; let countDone = 0;
  
  state.filteredItems.forEach(item => {
    const s = state.itemStatuses[item.id];
    if (s === '진행중') countProg++;
    else if (s === '완료') countDone++;
    else countNone++;
  });

  const percentDone = Math.round((countDone / totalItems) * 100) || 0;
  const percentProg = Math.round((countProg / totalItems) * 100) || 0;
  
  let finalDecisionStr = "적합";
  let evalColor = "var(--neon-green)";
  if (countNone > 0) {
      finalDecisionStr = "위험";
      evalColor = "var(--danger-red)";
  } else if (countProg > 0) {
      finalDecisionStr = "추가조치 필요";
      evalColor = "var(--neon-yellow)";
  }

  rightPanel.innerHTML = `
    <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
        <h2 style="font-size: 24px; color:#fff; margin:0;">Risk status & 달성도</h2>
        <button class="btn-outline neon-border" onclick="location.reload()" style="border-color: #00F2FF; color: #00F2FF; width: auto; font-weight:800; padding:12px 24px; margin-bottom:0;">처음으로 가기 (재진단)</button>
      </div>
      
      <div style="flex:1; display:flex; justify-content:space-between; gap:20px; align-items:stretch;">
         <div class="glass-pane" style="flex: 1; padding: 30px; display:flex; flex-direction:column; justify-content:center;">
            <h3 style="font-size:20px; margin-bottom:16px;">종합 평가 판정</h3>
            <div style="font-size: 32px; font-weight:800; color: ${evalColor}; margin-bottom:24px;">${finalDecisionStr}</div>
            <p style="color:var(--text-dim); line-height: 1.6; font-size:15px; word-break:keep-all;">
              현재 전체 요구 항목 ${totalItems}개 중 완료된 항목은 <b style="color:var(--neon-green)">${countDone}</b>개 입니다.<br/><br/>
              • 종합 달성률은 완료 항목 수만 산입합니다.<br/>
              • 모니터링 항목(진행중+완료)은 총 <b style="color:var(--neon-yellow)">${countProg + countDone}</b>개 입니다.<br/>
              • 미대응 항목이 1개라도 발생하면 '위험'으로 분류됩니다.
            </p>
         </div>
         
         <div class="glass-pane" style="flex: 1; min-width:300px; display:flex; align-items:center; justify-content:center; flex-direction:column;">
            <div class="donut-chart" style="background: conic-gradient(var(--neon-green) 0% ${percentDone}%, var(--neon-yellow) ${percentDone}% ${percentDone + percentProg}%, var(--danger-red) ${percentDone + percentProg}% 100%);">
                <div class="donut-inner">
                   <span style="font-size:36px; font-weight:800; color:var(--primary-teal);">${percentDone}%</span>
                   <span style="font-size:14px; color:var(--text-dim); margin-top:8px;">종합달성률</span>
                </div>
            </div>
         </div>
         
         <div class="glass-pane" style="flex: 1; padding: 30px; display:flex; flex-direction:column; justify-content:center; gap: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--danger-red); padding-left:16px;">
               <span style="color:var(--text-dim); font-size:16px;">미대응</span>
               <span style="color:var(--danger-red); font-size:28px; font-weight:800;">${countNone} 개</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--neon-yellow); padding-left:16px;">
               <span style="color:var(--text-dim); font-size:16px;">진행중</span>
               <span style="color:var(--neon-yellow); font-size:28px; font-weight:800;">${countProg} 개</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--neon-green); padding-left:16px;">
               <span style="color:var(--text-dim); font-size:16px;">완료</span>
               <span style="color:var(--neon-green); font-size:28px; font-weight:800;">${countDone} 개</span>
            </div>
         </div>
      </div>
      <p style="text-align:center; color:var(--text-dim); font-size:12px; margin-top:20px;">* 좌측 패널의 토글 버튼을 조작하여 실시간 업데이트를 확인하세요.</p>
    </div>
  `;
}



function renderAdminRight() {
  rightPanel.innerHTML = `
    <div class="fade-in" style="height: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 style="font-size: 24px; color:#fff;">시스템 진단 내역 레지스트리</h2>
      </div>
      <div class="admin-table-container" style="height: calc(100% - 60px);">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>회사/소속</th>
              <th>Role</th>
              <th>제품군</th>
              <th>매칭 수</th>
            </tr>
          </thead>
          <tbody>
            ${state.adminData.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-dim);">데이터가 없습니다.</td></tr>` : state.adminData.map((r, index) => {
              const itemsArr = (typeof r.items === 'string') ? r.items.split(',') : [];
              return `
                <tr>
                  <td>#${index + 1}</td>
                  <td>${r.date}</td>
                  <td><strong style="color:#fff;">${r.company}</strong><br/><span style="font-size:12px; color:var(--text-dim);">${r.department}</span></td>
                  <td><span style="background: rgba(0,255,209,0.1); border: 1px solid rgba(0,255,209,0.3); color: var(--primary-teal); padding: 4px 8px; border-radius: 4px; font-size: 11px;">${r.role || 'N/A'}</span></td>
                  <td>${r.category || '-'}</td>
                  <td><span style="color:var(--primary-teal); font-weight:700;">${itemsArr.length}</span> 항목</td>
                </tr>
              `;
            }).reverse().join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------
// Global Functions (Modal and Toggles)
// ------------------------------------------------------------------

window.goBack = function() {
  if (state.screen === 'selection') {
    state.screen = 'splash';
  } else if (state.screen === 'survey') {
    if (state.surveyStep > 1) {
      state.surveyStep--;
    } else {
      state.screen = 'selection';
    }
  } else if (state.screen === 'results') {
    state.screen = 'survey';
    state.surveyStep = 2; // Assuming 2 is the max step
  } else if (state.screen === 'admin') {
    state.screen = 'splash';
  }
  render();
}

window.toggleStatus = function(itemId, status) {
  state.itemStatuses[itemId] = status;
  const leftScroll = leftPanel.scrollTop;
  render();
  setTimeout(() => {
    leftPanel.scrollTop = leftScroll;
  }, 0);
}

window.showDetail = function(id) {
  const item = items.find(i => i.id === id);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fade-in';
  
  let contentHtml = item.content
    .replace(/!\[\]\(images\/(.*?)\)/g, '<img src="/images/$1" style="width:100%; border-radius:12px; margin: 16px 0;">')
    .replace(/__/g, '')
    .replace(/\n\s*▸/g, '<br/>• ')
    .replace(/\n\s*-\s/g, '<br/>• ')
    .replace(/\n/g, '<br/>');

  overlay.innerHTML = `
    <div class="modal-content glass-pane">
      <button style="position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="this.closest('.modal-overlay').remove()">×</button>
      <span style="color: var(--primary-teal); font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">${item.id} | ${item.regulation || 'General'}</span>
      <h2 style="color: #00FFD1; font-weight: 800; font-size: 24px; line-height: 1.3; margin: 16px 0 24px;">${itemNames[item.id] || "세부 내용 확인"}</h2>
      <div style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.9); font-weight: 300;">${contentHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

window.enterAdmin = function() {
  const answer = prompt("관리자 모드 접속 비밀번호를 입력하세요");
  if(answer === "1004") {
    state.screen = 'admin';
    render();
  } else if (answer !== null) {
    alert("비밀번호가 불일치합니다.");
  }
}

window.sendAdminEmail = async function() {
  if (state.adminData.length === 0) {
    window.showNoticePopup('전송할 진단 데이터가 없습니다.');
    return;
  }

  // UTF-8 BOM
  let csvContent = "\uFEFF";
  // CSV 헤더 (Role 추가)
  csvContent += "ID,진단일자,회사명,소속부서,Role,선택제품군,매칭된조치항목\n";

  state.adminData.forEach(r => {
    // 혹시라도 구버전 캐시 데이터 중 숫자로 저장된 항목이 있으면 replace 에서 에러가 나므로 형변환 필수
    const cCompany = r.company != null ? String(r.company) : '';
    const cDept = r.department != null ? String(r.department) : '';
    const cRole = r.role != null ? String(r.role) : '';
    const cCategory = r.category != null ? String(r.category) : '';
    const cItems = r.items != null ? String(r.items) : '';

    // csv에서는 쌍따옴표로 감싸서 콤마 문제 회피
    const safeCompany = '"' + cCompany.replace(/"/g, '""') + '"';
    const safeDept = '"' + cDept.replace(/"/g, '""') + '"';
    const safeRole = '"' + cRole.replace(/"/g, '""') + '"';
    const safeCategory = '"' + cCategory.replace(/"/g, '""') + '"';
    const safeItems = '"' + cItems.replace(/"/g, '""') + '"';

    csvContent += `${r.id},${r.date},${safeCompany},${safeDept},${safeRole},${safeCategory},${safeItems}\n`;
  });

  const payload = {
    csvData: csvContent,
    fileName: `자가진단_리스트백업_${new Date().getTime()}.csv`,
    recipientEmail: "yeojunseok@gmail.com"
  };

  const btn = document.getElementById('btn-export-email');
  let progressInterval;
  if (btn) {
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';
    let percent = 0;
    btn.innerHTML = `<span class="spinner" style="display:inline-block; margin-right:8px; border: 2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; width:16px; height:16px; animation:spin 1s linear infinite;"></span> 이메일 전송중 입니다. 작업 진행 중 : <span id="email-progress">0</span> %`;
    if (!document.getElementById('spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
    progressInterval = setInterval(() => {
      if (percent < 95) {
        percent += Math.floor(Math.random() * 8) + 1;
        if (percent > 95) percent = 95;
        const pSpan = document.getElementById('email-progress');
        if (pSpan) pSpan.innerText = percent;
      }
    }, 400);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      mode: 'no-cors' // Google Apps Script Web App bypass
    });
    
    if (progressInterval) clearInterval(progressInterval);
    if (btn) {
      const pSpan = document.getElementById('email-progress');
      if (pSpan) pSpan.innerText = '100';
    }
    
    setTimeout(() => {
        window.showNoticePopup("이메일 전송이 성공적으로 완료되었습니다!", true);
    }, 500);
  } catch (error) {
    console.error(error);
    if (progressInterval) clearInterval(progressInterval);
    window.showNoticePopup("전송 중 네트워크 오류가 발생했습니다.", true);
  } finally {
    if (btn) {
      setTimeout(() => {
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Excel 이메일 전송`;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }, 2000);
    }
  }
}

// Initial Kick-off
render();

// Force reload on back button to re-verify session
window.addEventListener('pageshow', function(event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

