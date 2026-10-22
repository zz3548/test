// localStorage에서 사용할 저장 이름입니다.
// 같은 브라우저에서 이 이름으로 데이터를 저장하고 다시 읽습니다.
const STORAGE_KEY = "sub-tracker-subscriptions";
// ui.js가 window에 공개한 화면 갱신 함수들을 가져옵니다.
const ui = window.subTrackerUI;
// 페이지가 시작될 때 저장된 구독을 먼저 불러옵니다.
let subscriptions = loadSubscriptions();
// 토스트 메시지의 이전 타이머를 저장합니다.
let toastTimer;

// 페이지가 준비되면 한 번 실행되는 초기화 함수입니다.
function init() {
  // 상단에 현재 날짜를 한국어 형식으로 표시합니다.
  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  // 입력 폼을 새 구독 상태로 초기화합니다.
  ui.resetForm();
  // 저장된 데이터를 사용해 모든 화면을 그립니다.
  render();
  // 폼 제출, 수정 취소, 새 구독 버튼에 이벤트를 연결합니다.
  document.querySelector("#subscriptionForm").addEventListener("submit", handleSubmit);
  document.querySelector("#cancelEditButton").addEventListener("click", ui.resetForm);
  document.querySelector("#focusFormButton").addEventListener("click", () => {
    document.querySelector("#formPanel").scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelector("#name").focus();
  });
}

// 스크립트가 HTML보다 먼저 실행되어도, HTML 해석이 끝난 뒤 init을 실행합니다.
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

// 현재 subscriptions 배열을 사용해 화면의 세 영역을 모두 갱신합니다.
function render() {
  ui.renderSummary(subscriptions);
  ui.renderSubscriptions(subscriptions, { onEdit: beginEdit, onDelete: deleteSubscription });
  ui.renderCategories(subscriptions);
}

// 폼을 제출했을 때 새 구독을 만들거나 기존 구독을 수정합니다.
function handleSubmit(event) {
  // 브라우저의 기본 새로고침 제출을 막고 자바스크립트로 처리합니다.
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  // hidden input에 id가 있으면 수정, 없으면 새 구독입니다.
  const id = form.get("subscriptionId") || document.querySelector("#subscriptionId").value;
  const subscription = {
    id: id || `sub_${Date.now()}`,
    name: String(form.get("name")).trim(),
    amount: Number(form.get("amount")),
    cycle: String(form.get("cycle")),
    nextPaymentDate: String(form.get("nextPaymentDate")),
    category: String(form.get("category")),
    paymentMethod: String(form.get("paymentMethod")),
    autoRenew: document.querySelector("#autoRenew").checked
  };
  // 필수값과 금액을 확인합니다. 잘못된 데이터는 저장하지 않습니다.
  if (!subscription.name || !Number.isFinite(subscription.amount) || subscription.amount < 0 || !subscription.nextPaymentDate) return;
  const index = subscriptions.findIndex(item => item.id === subscription.id);
  // 기존 id를 찾지 못하면 추가하고, 찾으면 같은 위치의 데이터를 교체합니다.
  if (index === -1) subscriptions.push(subscription);
  else subscriptions[index] = subscription;
  saveSubscriptions();
  render();
  ui.resetForm();
  showToast(index === -1 ? "구독을 추가했어요." : "구독 정보를 수정했어요.");
}

// 수정 버튼을 눌렀을 때 폼을 수정 모드로 바꿉니다.
function beginEdit(subscription) {
  ui.fillForm(subscription);
  document.querySelector("#formPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector("#name").focus();
}

// 삭제 버튼을 눌렀을 때 사용자의 확인 후 해당 구독을 제거합니다.
function deleteSubscription(id) {
  const subscription = subscriptions.find(item => item.id === id);
  if (!subscription || !window.confirm(`'${subscription.name}' 구독을 삭제할까요?`)) return;
  subscriptions = subscriptions.filter(item => item.id !== id);
  saveSubscriptions();
  render();
  showToast("구독을 삭제했어요.");
}

// localStorage에 저장된 문자열을 자바스크립트 배열로 복원합니다.
function loadSubscriptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item => item && item.name && item.nextPaymentDate) : [];
  } catch (error) {
    // 저장값이 깨졌거나 읽을 수 없을 때 콘솔에 원인을 남깁니다.
    console.error("구독 데이터를 불러오지 못했습니다.", error);
    return [];
  }
}

// 현재 배열 전체를 JSON 문자열로 바꾸어 localStorage에 저장합니다.
function saveSubscriptions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

// 추가/수정/삭제 결과를 잠깐 보여주는 알림입니다.
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  // 이전 알림 타이머가 있으면 취소해 메시지가 너무 빨리 사라지지 않게 합니다.
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
