// 背景腳本主要用於處理擴充功能的生命週期和事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Subtitle Downloader installed');
}); 