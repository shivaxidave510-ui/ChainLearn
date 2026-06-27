/**
 * Block mining simulator — SHA-256 proof-of-work with chain immutability demo.
 */

const DIFFICULTY_PREFIX = '00';
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const block1 = {
  data: document.getElementById('block1Data'),
  prevHash: document.getElementById('block1PrevHash'),
  nonce: document.getElementById('block1Nonce'),
  hashEl: document.getElementById('block1Hash'),
  status: document.getElementById('block1Status'),
  panel: document.getElementById('block1Panel'),
  mineBtn: document.getElementById('mineBlock1'),
  mining: document.getElementById('mining1'),
  minedSnapshot: null,
};

const block2 = {
  data: document.getElementById('block2Data'),
  prevHash: document.getElementById('block2PrevHash'),
  nonce: document.getElementById('block2Nonce'),
  hashEl: document.getElementById('block2Hash'),
  status: document.getElementById('block2Status'),
  panel: document.getElementById('block2Panel'),
  mineBtn: document.getElementById('mineBlock2'),
  mining: document.getElementById('mining2'),
  minedSnapshot: null,
};

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function computeHash(data, prevHash, nonce) {
  return sha256(`${data}|${prevHash}|${nonce}`);
}

function setStatus(block, state) {
  block.status.className = `block-status ${state}`;
  block.panel.classList.remove('valid', 'invalid');

  if (state === 'valid') {
    block.status.textContent = 'Block Valid ✓';
    block.panel.classList.add('valid');
  } else if (state === 'invalid') {
    block.status.textContent = 'Block Invalid ✗';
    block.panel.classList.add('invalid');
  } else {
    block.status.textContent = 'Not Mined';
  }
}

async function mineBlock(block) {
  block.mineBtn.disabled = true;
  block.mining.classList.add('active');
  block.status.textContent = 'Mining…';

  const data = block.data.value;
  const prevHash = block.prevHash.value;
  let nonce = parseInt(block.nonce.value, 10) || 0;
  const batchSize = 500;

  while (true) {
    const hash = await computeHash(data, prevHash, nonce);

    if (hash.startsWith(DIFFICULTY_PREFIX)) {
      block.nonce.value = nonce;
      block.hashEl.textContent = hash;
      block.minedSnapshot = { data, prevHash, nonce, hash };
      setStatus(block, 'valid');
      block.mining.classList.remove('active');
      block.mineBtn.disabled = false;
      return hash;
    }

    nonce++;
    if (nonce % batchSize === 0) {
      block.nonce.value = nonce;
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

function invalidateBlock2() {
  block2.minedSnapshot = null;
  block2.hashEl.textContent = block2.minedSnapshot ? block2.minedSnapshot.hash : '—';
  block2.nonce.value = 0;
  setStatus(block2, 'invalid');
  block2.mineBtn.disabled = !block1.minedSnapshot;
}

async function checkBlock1Integrity() {
  if (!block1.minedSnapshot) return;

  const hash = await computeHash(
    block1.data.value,
    block1.prevHash.value,
    parseInt(block1.nonce.value, 10) || 0
  );
  block1.hashEl.textContent = hash;

  const tampered =
    block1.data.value !== block1.minedSnapshot.data ||
    hash !== block1.minedSnapshot.hash;

  if (tampered) {
    setStatus(block1, 'invalid');
    if (block2.minedSnapshot) {
      setStatus(block2, 'invalid');
    }
  } else {
    setStatus(block1, 'valid');
    block2.prevHash.value = block1.minedSnapshot.hash;
    if (block2.minedSnapshot) {
      await checkBlock2Integrity();
    }
  }
}

async function checkBlock2Integrity() {
  if (!block2.minedSnapshot || !block1.minedSnapshot) return;

  const hash = await computeHash(
    block2.data.value,
    block2.prevHash.value,
    parseInt(block2.nonce.value, 10) || 0
  );
  block2.hashEl.textContent = hash;

  const chainBroken = block2.prevHash.value !== block1.minedSnapshot.hash;
  const tampered =
    block2.data.value !== block2.minedSnapshot.data ||
    hash !== block2.minedSnapshot.hash;

  if (chainBroken || tampered || !hash.startsWith(DIFFICULTY_PREFIX)) {
    setStatus(block2, 'invalid');
  } else {
    setStatus(block2, 'valid');
  }
}

block1.mineBtn.addEventListener('click', async () => {
  block1.minedSnapshot = null;
  setStatus(block1, 'pending');
  const hash = await mineBlock(block1);
  block2.prevHash.value = hash;
  block2.mineBtn.disabled = false;

  if (block2.minedSnapshot) {
    await checkBlock2Integrity();
  }
});

block2.mineBtn.addEventListener('click', async () => {
  if (!block1.minedSnapshot) return;
  block2.prevHash.value = block1.minedSnapshot.hash;
  block2.minedSnapshot = null;
  setStatus(block2, 'pending');
  await mineBlock(block2);
});

block1.data.addEventListener('input', checkBlock1Integrity);

block2.data.addEventListener('input', () => {
  if (block2.minedSnapshot) checkBlock2Integrity();
});

block1.prevHash.value = GENESIS_HASH;
