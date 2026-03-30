新增角色「凜空」(Riku)
VRM 檔案：public/models/riku.vrm
參考 Yukirin-VRoid-ThreeJS-Guide.md 第十章多角色系統

在 CHARACTERS 設定加上：
{
  riku: {
    id: 'riku',
    name: '凜空',
    nameEN: 'Riku',
    vrmPath: '/models/riku.vrm',
    fallbackImage: '/images/riku-neutral.png',
    themeColor: '#c94a4a',    // 紅色系，配他的運動外套
    accentColor: '#a8a8b8',   // 銀灰色，配他的髮色
    personality: '溫柔可靠、偶爾耍帥、像學長一樣照顧人',
    defaultMood: 'happy',
  }
}

使用者第一次進入 Insight 時顯示角色選擇畫面：
「選一個夥伴陪你探索」
左邊雪凜（揮手）右邊凜空（揮手）
選完之後存到 user profile，之後都用那個角色
可以在設定頁面隨時切換