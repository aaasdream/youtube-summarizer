document.addEventListener('DOMContentLoaded', function() {
  // 載入已儲存的設定
  chrome.storage.sync.get(['apiKey', 'prompt'], function(result) {
    if(result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if(result.prompt) {
      document.getElementById('prompt').value = result.prompt;
    }
  });

  // 儲存設定
  document.getElementById('save').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const prompt = document.getElementById('prompt').value;

    chrome.storage.sync.set({
      apiKey: apiKey,
      prompt: prompt
    }, function() {
      alert('設定已儲存!');
    });
  });
}); 