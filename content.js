// 等待YouTube播放器載入
function waitForElement(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// 建立字幕下載按鈕
function createSubtitleButton() {
  const button = document.createElement('button');
  button.innerHTML = '📝'; // 使用emoji作為按鈕圖示
  button.className = 'ytp-subtitle-download-btn';
  button.title = '總結字幕';
  button.addEventListener('click', async () => {
    // 檢查否有設定 API Key
    const hasApiKey = await checkApiKey();
    if (!hasApiKey) {
      showError('請先設定 API Key');
      return;
    }
    
    handleSubtitleDownload();
  });
  return button;
}

// 處理字幕下載
async function handleSubtitleDownload() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return;

  try {
    // 顯示載入中
    const loading = showLoading();

    // 取得影片資訊
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // 解析字幕資訊
    const captionTracks = extractCaptionTracks(html);
    
    if (!captionTracks || captionTracks.length === 0) {
      showError('此影片沒有任何字幕');
      return;
    }

    // 優先選擇中文或英文字幕
    let selectedTrack = captionTracks.find(track => 
      track.languageCode === 'zh-TW' || 
      track.languageCode === 'zh-CN' ||
      track.languageCode === 'en'
    );

    // 如果沒有中英文字幕，使用第一個可用的字幕
    if (!selectedTrack) {
      selectedTrack = captionTracks[0];
    }

    // 取得字幕內容
    const subtitles = await fetchSubtitles(selectedTrack.baseUrl);
    
    // 將字幕內容轉換為純文字
    const subtitleText = subtitles.map(sub => sub.content).join('\n');

    // 使用 Gemini API 處理字幕
    const summary = await processCaptions(subtitleText);
    if (summary) {
      showSummary(summary);
    }

  } catch (error) {
    console.error('Error processing subtitles:', error);
    showError('處理字幕時發生錯誤: ' + error.message);
  } finally {
    // 移除載入中提示
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
      loading.remove();
    }
  }
}

// 從YouTube頁面提取字幕軌道資訊
function extractCaptionTracks(html) {
  const ytInitialPlayerResponse = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/)?.[1];
  if (!ytInitialPlayerResponse) return null;

  try {
    const data = JSON.parse(ytInitialPlayerResponse);
    return data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  } catch (error) {
    console.error('Error parsing caption tracks:', error);
    return null;
  }
}

// 取得字幕內容
async function fetchSubtitles(baseUrl) {
  const response = await fetch(baseUrl);
  const xml = await response.text();
  return parseSubtitleXML(xml);
}

// 解析字幕XML
function parseSubtitleXML(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const texts = doc.getElementsByTagName('text');
  
  return Array.from(texts).map(text => ({
    start: parseFloat(text.getAttribute('start')),
    duration: parseFloat(text.getAttribute('dur')),
    content: text.textContent
  }));
}

// 顯示字幕視窗
function showSubtitleWindow(subtitles) {
  const modal = document.createElement('div');
  modal.className = 'subtitle-modal';
  
  const content = document.createElement('div');
  content.className = 'subtitle-content';
  
  content.innerHTML = subtitles.map(sub => 
    `<p>[${formatTime(sub.start)}] ${sub.content}</p>`
  ).join('');
  
  modal.appendChild(content);
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'close-btn';
  closeBtn.onclick = () => modal.remove();
  
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

// 格式化時間
function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().substr(11, 8);
}

// 檢查是否有設定API Key
async function checkApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'prompt'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      if(!result.apiKey) {
        try {
          chrome.runtime.sendMessage({action: 'openSettings'});
        } catch (error) {
          console.error('Failed to send message:', error);
        }
        resolve(false);
      }
      resolve(true);
    });
  });
}

// 顯示loading
function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">正在處理字幕...</div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// 顯示錯誤
function showError(message) {
  const modal = document.createElement('div');
  modal.className = 'subtitle-modal';
  
  const content = document.createElement('div');
  content.className = 'error-message';
  content.textContent = message;
  
  modal.appendChild(content);
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'close-btn';
  closeBtn.onclick = () => modal.remove();
  
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

// 使用Gemini API處理字幕
async function processCaptions(captions) {
  const loading = showLoading();
  
  try {
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'prompt'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(result);
      });
    });

    if (!settings.apiKey) {
      throw new Error('未設定 API Key');
    }

    if (!captions || captions.length === 0) {
      throw new Error('無法取得字幕內容');
    }

    // 使用預設提示詞
    const prompt = settings.prompt || '這個字幕中有什麼值得一看的，整體的內容大綱是什麼，請用繁體中文回復';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\n\n${captions}`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('API Response:', data); // 用於調試
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('API 未返回任何結果');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('API 回應格式不完整');
    }
    
    const text = candidate.content.parts[0].text;
    if (!text) {
      throw new Error('API 回應中沒有文字內容');
    }

    return text;

  } catch (error) {
    console.error('處理字幕時發生錯誤:', error);
    console.error('Error details:', error.stack); // 添加更多錯誤信息
    showError(`處理字幕時發生錯誤: ${error.message}`);
    return null;
  } finally {
    loading.remove();
  }
}

// 顯示摘要結果
function showSummary(summary) {
  // 確保 marked 已載入
  if(typeof marked === 'undefined') {
    console.error('Marked.js not loaded');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'subtitle-modal';
  
  const content = document.createElement('div'); 
  content.className = 'subtitle-content';
  
  content.innerHTML = marked.parse(summary);
  
  modal.appendChild(content);
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'close-btn';
  closeBtn.onclick = () => modal.remove();
  
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

// 初始化按鈕事件
async function init() {
  try {
    // 等待播放器容器載入
    const playerContainer = await waitForElement('#above-the-fold');
    if (playerContainer) {
      // 創建按鈕
      const subtitleButton = createSubtitleButton();
      
      // 將按鈕添加到播放器容器
      playerContainer.style.position = 'relative'; // 確保相對定位
      playerContainer.appendChild(subtitleButton);
    }
  } catch (error) {
    console.error('初始化失敗:', error);
  }
}

// 確保擴充功能上下文有效才初始化
if (chrome.runtime && chrome.runtime.id) {
  init();
}