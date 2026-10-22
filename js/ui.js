// 금액을 한국 원화 형식으로 바꾸는 공통 함수입니다.
// 예: 13500 -> "₩13,500"
const money = value => `₩${Math.round(value || 0).toLocaleString("ko-KR")}`;

// 상단의 월 합계, 연간 합계, 이번 주 결제 예정 건수를 다시 그립니다.
function renderSummary(subscriptions) {
  // 월 구독료는 logic.js의 계산 함수를 사용합니다.
  const monthly = getTotalMonthlyAmount(subscriptions);
  document.querySelector("#monthlyTotal").textContent = money(monthly);
  document.querySelector("#yearlyTotal").textContent = money(getTotalYearlyAmount(subscriptions));
  document.querySelector("#dueSoonCount").textContent = `${getSubscriptionsDueSoon(subscriptions, todayString(), 7).length}건`;
  document.querySelector("#subscriptionCount").textContent = subscriptions.length;
}

// 구독 배열을 카드 목록으로 변환해서 화면에 표시합니다.
function renderSubscriptions(subscriptions, callbacks) {
  const list = document.querySelector("#subscriptionList");
  // 이전 목록을 비워야 수정/추가 후 중복 카드가 생기지 않습니다.
  list.innerHTML = "";
  if (!subscriptions.length) {
    // 구독이 하나도 없을 때 보여줄 안내 문구입니다.
    list.innerHTML = `<div class="empty-state">아직 등록된 구독이 없어요.<br>오른쪽 폼에서 첫 구독을 추가해보세요.</div>`;
    return;
  }
  // slice()로 복사본을 만든 뒤 날짜순으로 정렬합니다.
  // 원본 subscriptions 배열의 순서는 직접 바꾸지 않습니다.
  subscriptions.slice().sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate)).forEach(subscription => {
    // 오늘부터 결제일까지 며칠 남았는지 계산합니다.
    const days = getDaysUntilNextPayment(todayString(), subscription.nextPaymentDate);
    const dday = days < 0 ? `D+${Math.abs(days)}` : days === 0 ? "D-DAY" : `D-${days}`;
    // article 요소 하나가 화면의 구독 카드 하나가 됩니다.
    const item = document.createElement("article");
    item.className = "subscription-item";
    item.innerHTML = `
      <div class="service-icon">${escapeHtml((subscription.name || "?").charAt(0).toUpperCase())}</div>
      <div class="service-info"><strong>${escapeHtml(subscription.name)}</strong><small>${escapeHtml(subscription.category)} · ${escapeHtml(subscription.paymentMethod)} · ${subscription.autoRenew ? "자동 결제" : "수동 결제"}</small></div>
      <div class="price">${money(getMonthlyAmount(subscription))}<small>${subscription.cycle === "yearly" ? "연 " + money(subscription.amount) : "매월"}</small></div>
      <div class="dday${days === 0 ? " today" : ""}">${dday}</div>
      <div class="item-actions"><button type="button" data-action="edit" aria-label="${escapeHtml(subscription.name)} 수정">수정</button><button type="button" data-action="delete" aria-label="${escapeHtml(subscription.name)} 삭제">삭제</button></div>`;
    // 카드가 만들어진 뒤 수정/삭제 버튼에 클릭 이벤트를 연결합니다.
    item.querySelector('[data-action="edit"]').addEventListener("click", () => callbacks.onEdit(subscription));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => callbacks.onDelete(subscription.id));
    list.appendChild(item);
  });
}

// 카테고리별 월 금액과 전체에서 차지하는 비율을 표시합니다.
function renderCategories(subscriptions) {
  const target = document.querySelector("#categoryBreakdown");
  const totals = getMonthlyAmountByCategory(subscriptions);
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  // 모든 카테고리 금액을 더해 비율 계산의 기준값으로 사용합니다.
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  target.innerHTML = entries.length ? entries.map(([name, amount], index) => {
    const percent = total ? Math.round(amount / total * 100) : 0;
    return `<div class="category-row"><div class="category-label"><span>${escapeHtml(name)}</span><span>${percent}% · ${money(amount)}</span></div><div class="bar"><i style="width:${percent}%;opacity:${Math.max(.55, 1 - index * .1)}"></i></div></div>`;
  }).join("") : `<p class="empty-state">데이터가 쌓이면<br>카테고리별 비중이 보여요.</p>`;
}

// 수정 버튼을 눌렀을 때 기존 구독 정보를 입력 폼에 채웁니다.
function fillForm(subscription) {
  document.querySelector("#subscriptionId").value = subscription.id;
  ["name", "amount", "cycle", "nextPaymentDate", "category", "paymentMethod"].forEach(key => { document.querySelector(`#${key}`).value = subscription[key]; });
  document.querySelector("#autoRenew").checked = subscription.autoRenew;
  document.querySelector("#formTitle").textContent = "구독 수정";
  document.querySelector("#submitButton").textContent = "수정 내용 저장";
  document.querySelector("#cancelEditButton").classList.remove("hidden");
}

// 입력 폼을 새 구독 추가 상태로 되돌립니다.
function resetForm() {
  document.querySelector("#subscriptionForm").reset();
  document.querySelector("#subscriptionId").value = "";
  document.querySelector("#nextPaymentDate").value = todayString();
  document.querySelector("#formTitle").textContent = "새 구독 추가";
  document.querySelector("#submitButton").textContent = "구독 추가하기";
  document.querySelector("#cancelEditButton").classList.add("hidden");
}

// 오늘 날짜를 input[type=date]가 요구하는 YYYY-MM-DD 문자열로 반환합니다.
function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// 사용자 입력이 HTML로 해석되지 않도록 특수문자를 안전한 문자로 바꿉니다.
// 구독 이름에 <script> 같은 문자열이 들어가도 화면의 코드로 실행되지 않습니다.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

// 일반 script 방식으로 읽히는 main.js에서도 UI 함수에 접근할 수 있도록
// window 객체에 공개합니다. ES module을 사용하지 않아 index.html을 직접 열 수 있습니다.
window.subTrackerUI = { fillForm, renderCategories, renderSubscriptions, renderSummary, resetForm };
