const DEFAULT_TEMPLATE = `// デフォルトテンプレート
sound.playSynth(
{
  type: 'triangle',
  duration: 0.15,
  volume: 0.1,
  freqStart: 600,
  freqEnd: 1200
}
);`;

// --- 状態管理 ---
let soundInstance = null;
let savedHistory = [];
let isLocalStorageAvailable = true;

try {
  const testKey = '__storage_test__';
  localStorage.setItem(testKey, testKey);
  localStorage.removeItem(testKey);
} catch (e) {
  isLocalStorageAvailable = false;
}

// --- DOM ---
const editor = document.getElementById('editor');
const btnEval = document.getElementById('btn-eval');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const presetSelect = document.getElementById('preset-select');
const historySelect = document.getElementById('history-select');
const consoleLog = document.getElementById('console-log');
const audioStatus = document.getElementById('audio-status');

// --- ユーティリティ関数 ---
function printConsole(message, type = 'info') {
  const span = document.createElement('span');
  span.className = `log-${type}`;
  span.textContent = `[${new Date().toLocaleTimeString()}] ${message}\n`;
  consoleLog.appendChild(span);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

function initSound() {
  if (!soundInstance) {
    try {
      // sound.jsに定義されているSoundクラスのインスタンス化
      if (typeof Sound !== 'undefined') {
        soundInstance = new Sound();
        printConsole("Sound クラスのインスタンスを生成しました。", "info");
        updateAudioStatus();
      } else {
        printConsole("エラー: sound.js 内で Sound クラスが見つかりません。", "error");
      }
    } catch (e) {
      printConsole(`サウンドエンジンの初期化に失敗しました: ${e.message}`, "error");
    }
  }
}

function updateAudioStatus() {
  if (soundInstance && soundInstance.ctx) {
    const state = soundInstance.ctx.state;
    audioStatus.textContent = `AudioContext: ${state}`;
    if (state === 'running') {
      audioStatus.className = "status-badge active";
    } else {
      audioStatus.className = "status-badge";
    }
  }
}

// ブラウザの制限解除（ユーザー操作起点のレジューム）
function resumeAudioContext() {
  if (soundInstance && soundInstance.ctx && soundInstance.ctx.state === 'suspended') {
    soundInstance.ctx.resume().then(() => {
      updateAudioStatus();
    });
  }
}

// デバウンス処理（自動保存用）
function debounce(func, timeout = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// --- 永続化ロジック ---
const autoSaveCode = debounce(() => {
  if (!isLocalStorageAvailable) return;
  localStorage.setItem('current_code', editor.value);
});

function loadHistory() {
  if (!isLocalStorageAvailable) return;
  const historyData = localStorage.getItem('saved_history');
  if (historyData) {
    try {
      savedHistory = JSON.parse(historyData);
      renderHistorySelect();
    } catch (e) {
      savedHistory = [];
    }
  }
}

function renderHistorySelect() {
  // 最初のオプション以外をクリア
  historySelect.innerHTML = '<option value="">-- 保存した履歴 --</option>';
  savedHistory.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = item.title || `履歴 ${index + 1}`;
    historySelect.appendChild(opt);
  });
}

// ---  コアロジック (Eval / Stop) ---
function executeEval() {
  const code = editor.value.trim();
  if (!code) {
    // 無効操作：空欄の時は何も実行せずエラーも出さない
    return;
  }
  initSound();
  resumeAudioContext();
  // eval実行のコンテキスト内に sound インスタンスをバインド
  const sound = soundInstance;
  try {
    // evalの実行
    eval(code);
    printConsole("Success: コードを実行しました。", "success");
    updateAudioStatus();
  } catch (error) {
    // 構文エラーやsound.js内のバリデーションエラーをキャッチ
    printConsole(`Error: ${error.message}`, "error");
  }
}

function executeStop() {
  initSound();
  if (soundInstance) {
    try {
      // 仕様：AudioContextを再生成、または既存ノードをディスコネクトし強制消音
      // もし sound.js 側に独自のstop/clearメソッドが用意されていればそれを呼ぶ設計でも可
      if (typeof soundInstance.stop === 'function') {
        soundInstance.stop();
      } else if (soundInstance.ctx) {
        // 既存のAudioContextをクローズして再生成するフォールバック
        soundInstance.ctx.close().then(() => {
          if (typeof Sound !== 'undefined') {
            soundInstance = new Sound();
            updateAudioStatus();
          }
        });
      }
      printConsole("再生を停止し、オーディオ状態をリセットしました。", "info");
    } catch (e) {
      printConsole(`停止処理中にエラーが発生しました: ${e.message}`, "error");
    }
  }
}

// --- イベントリスナー設定 ---

btnEval.addEventListener('click', executeEval);
btnStop.addEventListener('click', executeStop);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    executeEval();
  }
});

// 自動保存（入力変更時）
editor.addEventListener('input', autoSaveCode);

// プリセット変更
presetSelect.addEventListener('change', (e) => {
  const presetId = e.target.value;
  if (!presetId) return;

  editor.value = SoundData[presetId].code;
  autoSaveCode();
  printConsole(`プリセット「${SoundData[presetId].title}」を展開しました。`, "info");
});

// お気に入り保存（明示的保存）
btnSave.addEventListener('click', () => {
  const code = editor.value.trim();
  if (!code) {
    alert("空のコードは保存できません。");
    return;
  }

  const title = prompt("このコードのタイトルを入力してください:", `カスタム効果音_${new Date().toLocaleDateString()}`);
  if (title === null) return; // キャンセル

  const historyItem = {
    id: `custom_${Date.now()}`,
    title: title || `無題のカスタム音`,
    code: code
  };

  savedHistory.push(historyItem);
  
  if (isLocalStorageAvailable) {
    localStorage.setItem('saved_history', JSON.stringify(savedHistory));
  }
  renderHistorySelect();
  printConsole(`履歴に「${historyItem.title}」を保存しました。`, "success");
});

// 履歴呼び出し
historySelect.addEventListener('change', (e) => {
  const index = e.target.value;
  if (index === "") return;

  const selected = savedHistory[index];
  editor.value = selected.code;
  autoSaveCode();
  printConsole(`履歴「${selected.title}」を読み込みました。`, "info");
});


// --- 起動時初期化フロー ---
window.addEventListener('DOMContentLoaded', () => {
  // 1. サウンドエンジンの初期化試行
  initSound();

  // 2. コードの復元
  let initialCode = DEFAULT_TEMPLATE;
  if (isLocalStorageAvailable) {
    const savedCode = localStorage.getItem('current_code');
    if (savedCode !== null) {
      initialCode = savedCode;
    }
    loadHistory();
  }
  editor.value = initialCode;

  const sndlist = Object.keys(SoundData);
  sndlist.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = SoundData[item].title || item;
    presetSelect.appendChild(opt);
  });

  printConsole("AudioEval が起動しました。コードを入力して Eval を押してください。", "info");
});
