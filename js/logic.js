// 구독 데이터(subscription) 예시
//{
//  "id": "sub_1",
//  "name": "넷플릭스",
//  "amount": 13500,
//  "cycle": "monthly", //"monthly" 또는 "yearly"//  
//  "nextPaymentDate": "2024-06-15"
//  "category": "영상",
//  "paymentMethod": "카드", // "카드", "계좌이체", "휴대폰결제" 중 하나
//  "autoRenew": true // 자동 결제 여부
//}


// 카드별로 묶어 { 카드사: 월합계 } 형태로 반환한다.
function getMonthlyAmountByCard(subscriptions) {
    const cardTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = getMonthlyAmount(subscription);
        if (cardTotals[subscription.paymentMethod]) {
            cardTotals[subscription.paymentMethod] += monthlyAmount;
        } else {
            cardTotals[subscription.paymentMethod] = monthlyAmount;
        }
    }
    return cardTotals;
}

// 구독 1건을 받아 월 기준 금액으로 환산해 반환한다.
// cycle이 "yearly"면 12로 나누고, 원 단위로 반올림한다.
function getMonthlyAmount(subscription) {
    if (subscription.cycle === "yearly") {
        return Math.round(subscription.amount / 12);
    }
    return subscription.amount;
}

// 구독 데이터 배열을 받아 월 기준 금액으로 환산한 총합을 반환한다.
function getTotalMonthlyAmount(subscriptions) {
    let total = 0;
    for (const subscription of subscriptions) {
        total += getMonthlyAmount(subscription);
    }
    return total;
}

// 구독 목록 배열을 받아 연간 지출 합계를 반환한다.
// 월 합계에 12를 곱해서 계산한다.
function getTotalYearlyAmount(subscriptions) {
    const totalMonthly = getTotalMonthlyAmount(subscriptions);
    return totalMonthly * 12;
}

// 오늘 날짜와 결제 예정일을 받아 남은 일수를 반환한다.
// 두 값 모두 "YYYY-MM-DD" 형식의 문자열이다.
// 시각은 무시하고 날짜만 비교. 오늘이면 0, 지난 날짜면 음수.
function getDaysUntilNextPayment(today, nextPaymentDate) {
    const todayDate = new Date(today);
    const paymentDate = new Date(nextPaymentDate);
    const timeDiff = paymentDate - todayDate;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

// 결제일이 N일 이내로 임박한 항목만 반환한다. 지난 것은 제외
function getSubscriptionsDueSoon(subscriptions, today, days) {
    return subscriptions.filter(subscription => {
        const daysUntilPayment = getDaysUntilNextPayment(today, subscription.nextPaymentDate);
        return daysUntilPayment >= 0 && daysUntilPayment <= days;
    });
}

// 카테고리별로 묶어 { 카테고리: 월합계 } 형태로 반환한다. 
// 예: { "영상": 13500, "음악": 10900 }

function getMonthlyAmountByCategory(subscriptions) {
    const categoryTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = getMonthlyAmount(subscription);
        if (categoryTotals[subscription.category]) {
            categoryTotals[subscription.category] += monthlyAmount;
        } else {
            categoryTotals[subscription.category] = monthlyAmount;
        }
    }
    return categoryTotals;
}

// 결제수단별로 묶어 { 결제수단: 월합계 } 형태로 반환한다.
function getMonthlyAmountByPaymentMethod(subscriptions) {
    const paymentMethodTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = getMonthlyAmount(subscription);
        if (paymentMethodTotals[subscription.paymentMethod]) {
            paymentMethodTotals[subscription.paymentMethod] += monthlyAmount;
        } else {
            paymentMethodTotals[subscription.paymentMethod] = monthlyAmount;
        }
    }
    return paymentMethodTotals;
}
