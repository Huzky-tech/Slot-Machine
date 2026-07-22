const spinbutton = document.getElementById('spin');
const reels = document.querySelectorAll('.reel');
const message = document.getElementById('message');
const slotmachine = document.querySelector('.slot-machine');
const coinsDisplay = document.getElementById('coins');
const streakDisplay = document.getElementById('streak');
const betAmountSelect = document.getElementById('betAmount');

const images = [
  './images/slot1.png',
  './images/slot2.png',
  './images/slot3.png',
  './images/slot4.png',
  './images/slot5.png',
  './images/slot6.png',
  './images/slot7.png',
  './images/slot8.png',
];

const payouts = {
  './images/slot1.png': { name: 'Diamond', coins: 500 },
  './images/slot2.png': { name: 'Emerald', coins: 350 },
  './images/slot3.png': { name: 'Gold Ingot', coins: 250 },
  './images/slot4.png': { name: 'Coal', coins: 100 },
  './images/slot5.png': { name: 'Iron Ingot', coins: 150 },
  './images/slot6.png': { name: 'Copper Ingot', coins: 75 },
  './images/slot7.png': { name: 'Netherite Scrap', coins: 750 },
  './images/slot8.png': { name: 'TNT', coins: 0, isTnt: true },
};

let coins = 1000;
let streak = 0;

let confettiInterval;

function InitializeReels() {
  reels.forEach((reel) => {
    reel.innerHTML = `<img src="${images[0]}" alt="default" />`;
  });
}

function spinReel(reel, duration) {
  let index = Math.floor(Math.random() * images.length);

  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = 100;

    const spin = setInterval(() => {
      index = (index + 1) % images.length;
      reel.innerHTML = `<img src="${images[index]}" alt="${images[index]}" />`;

      if (Date.now() - startTime >= duration) {
        clearInterval(spin);
        resolve(images[index]);
      }
    }, interval);
  });
}

function startConfetti() {
  stopConfetti();

  confettiInterval = setInterval(() => {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 1500);
  }, 200);
}

function stopConfetti() {
  clearInterval(confettiInterval);
  confettiInterval = undefined;
}

const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');

function openModal(title, body) {
  if (!resultModal) return;
  modalTitle.textContent = title;
  modalBody.textContent = body || '';
  resultModal.classList.add('show');
  resultModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!resultModal) return;
  resultModal.classList.remove('show');
  resultModal.setAttribute('aria-hidden', 'true');
}

closeModalBtn?.addEventListener('click', closeModal);
resultModal?.addEventListener('click', (e) => {
  if (e.target === resultModal) closeModal();
});

function updatePlayerInfo() {
  coinsDisplay.textContent = coins.toLocaleString();
  streakDisplay.textContent = streak;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function playRound() {
  const bet = Number(betAmountSelect?.value) || 10;
  const isLuckySpin = streak >= 5;

  
  const shouldShowModal = !autoSpinRunning;


  if (!isLuckySpin && coins < bet) {
    message.textContent = 'NOT ENOUGH COINS';
    message.className = 'loss';
    return false;
  }

  message.textContent = '';
  message.className = '';

  slotmachine.classList.remove('Loss', 'Win');
  stopConfetti();

  if (isLuckySpin) {
    streak = 0;
  } else {
    coins -= bet;
  }
  updatePlayerInfo();

  InitializeReels();

  const results = await Promise.all([
    spinReel(reels[0], 2000),
    spinReel(reels[1], 3000),
    spinReel(reels[2], 4000),
  ]);

  if (results[0] === results[1] && results[1] === results[2]) {
    const payout = payouts[results[0]];

    if (payout.isTnt) {
      const loss = Math.floor(coins * 0.2);
      coins -= loss;
      streak = 0;

      const modalTitleText = 'TNT!';
      const modalBodyText = `-${loss} COINS`;

      if (shouldShowModal) openModal(modalTitleText, modalBodyText);
      message.textContent = '';
      message.className = 'loss';
    } else {
      coins += payout.coins;
      streak += 1;

      const luckyLabel = isLuckySpin ? 'LUCKY SPIN! ' : '';
      const modalTitleText = `${payout.name.toUpperCase()}!`;
      const modalBodyText = `${luckyLabel}+${payout.coins} COINS`;

      message.textContent = '';
      message.className = 'win';
      if (shouldShowModal) openModal(modalTitleText, modalBodyText);
      startConfetti();
    }

    slotmachine.classList.add('Win');
  } else {
    const modalTitleText = isLuckySpin ? 'Lucky Spin Used' : 'Try Again';
    const modalBodyText = isLuckySpin ? 'TRY AGAIN — LUCKY SPIN WAS USED' : 'TRY AGAIN :<';

    message.textContent = '';
    message.className = 'loss';
    streak = 0;
    slotmachine.classList.add('Loss');

    if (shouldShowModal) openModal(modalTitleText, modalBodyText);
  }

  updatePlayerInfo();
  return true;
}

let autoSpinRunning = false;
let autoSpinTimer = null;

function getBet() {
  return Number(betAmountSelect?.value) || 10;
}

function computeAutoRoundsFromUI() {
 
  const base = 10;
  const extra = Math.min(15, Math.floor(streak / 2));
  return Math.min(25, base + extra);
}

async function startGame() {
 
  spinbutton.disabled = true;
  try {
    const completed = await playRound();
    if (!completed) return;
  } finally {
    spinbutton.disabled = false;
  }
}

async function startAutoSpin() {
  if (autoSpinRunning) return;
  autoSpinRunning = true;
  console.log('Auto spin START');
 
  spinbutton.disabled = true;
  
  closeModal();
 
  while (autoSpinRunning) {
    const rounds = computeAutoRoundsFromUI();

    for (let round = 0; round < rounds; round += 1) {
      if (!autoSpinRunning) break;

      const completed = await playRound();
      if (!completed) {
        autoSpinRunning = false;
        break;
      }
     
      await wait(450);
    }

    
  }

  autoSpinRunning = false;
  spinbutton.disabled = false;
}

function stopAutoSpin() {
  autoSpinRunning = false;
  if (autoSpinTimer) {
    clearTimeout(autoSpinTimer);
    autoSpinTimer = null;
  }
  spinbutton.disabled = false;
}

InitializeReels();
updatePlayerInfo();
spinbutton.addEventListener('click', startGame);


const autoSpinBtn = document.getElementById('autoSpinBtn');
if (autoSpinBtn) {
  autoSpinBtn.addEventListener('click', () => {
    if (autoSpinRunning) {
      stopAutoSpin();
      autoSpinBtn.textContent = 'Auto Spin';
    } else {
      startAutoSpin();
      autoSpinBtn.textContent = 'Stop Auto Spin';
     }
  });
}

const insertCoinsInput = document.getElementById('insertCoins');
const addCoinsBtn = document.getElementById('addCoins');

function addCoinsFromUI() {
  if (!insertCoinsInput || !addCoinsBtn) return;

  const amount = Number(insertCoinsInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    message.textContent = 'ENTER A VALID COIN AMOUNT';
    message.className = 'loss';
    return;
  }

  coins += Math.floor(amount);
  insertCoinsInput.value = '';
  message.textContent = '';
  message.className = '';
  updatePlayerInfo();
}

addCoinsBtn?.addEventListener('click', addCoinsFromUI);
insertCoinsInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addCoinsFromUI();
});