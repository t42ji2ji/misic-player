/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn', 'lyrics', 'showlyrics'];
elms.forEach(function (elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function (playlist) {
  this.playlist = playlist;
  this.index = 0;
  console.log(lyrics.innerHTML);
  // Display the title of the first track.
  track.innerHTML = '1. ' + playlist[0].title;
  lyrics.innerHTML = playlist[0].lyric;

  // Setup the playlist display.
  playlist.forEach(function (song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    div.onclick = function () {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['./audio/' + data.file + '.mp3'],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function () {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function () {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          self.skip('next');
        },
        onpause: function () {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function () {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onseek: function () {
          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    track.innerHTML = (index + 1) + '. ' + data.title;
    lyrics.innerHTML = data.lyric;

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function (direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function (index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function (val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function (per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function () {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function () {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function () {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function () {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function (secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([{
    title: '魏如萱-買你',
    file: 'buy_you',
    lyric: `你總是說 我想回家 然後轉身 淡淡的笑 </br>
      你總是說 好累好忙 什麼時候 我們可以聊一聊 </br>
      </br>
      ㄟ 可不可以買你的不快樂 </br>
      只是想陪你吃飯 看你笑笑 聽你最近 好不好 </br>
      ㄟ 可不可以買你的不快樂 </br>
      我們一起坐車 一起散步 一起看電影 好不好 </br>
      </br>
      你都不說 都不理我 然後轉身 淡淡的笑 </br>
      你總問我 你還好嗎 什麼時候 我們可以變更好 </br>
      </br>
      ㄟ 可不可以買你一個鐘頭 </br>
      只是想關心你呀 要你知道 還有我在 好不好 </br>
      ㄟ 可不可以買你的不快樂 </br>
      我們一起唱歌 一起牽手 一起聽音樂 </br>
      ㄟ 可不可以買你一個鐘頭 </br>
      只是想關心你呀 要你知道 還有我在 好不好 </br>
      ㄟ 可不可以買你的不快樂 </br>
      </br>
      我們一起唱歌 一起牽手 一起聽音樂 好不好 </br>
      把你的 不快樂 賣給我 然後抱一下 好不好 </br>`,
    howl: null
  },
  {
    title: '艾怡良-如煙',
    file: 'smoke',
    lyric: `我坐在床前 望著窗外 回憶滿天 </br>
生命是華麗錯覺 時間是賊 偷走一切 </br>
七歲的那一年 抓住那隻蟬 以為能抓住夏天 </br>
十七歲的那年 吻過他的臉 就以為和他能永遠 </br>

有沒有那麼一種永遠 永遠不改變</br>
擁抱過的美麗都 再也不破碎</br>
讓險峻歲月不能在臉上撒野 讓生離和死別都遙遠
有誰能聽見</br>

我坐在床前 轉過頭看 誰在沉睡 那一張蒼老的臉</br>
好像是我 緊閉雙眼</br>
曾經是愛我的 和我深愛的 都圍繞在我身邊</br>
帶不走的那些 遺憾和眷戀 就化成最後一滴淚</br>
</br>
有沒有那麼一滴眼淚 能洗掉後悔</br>
化成大雨降落在 回不去的街</br>
再給我一次機會 將故事改寫</br>
還欠了他一生的 一句抱歉</br>
</br>
有沒有那麼一個世界 永遠不天黑</br>
星星太陽萬物都 聽我的指揮</br>
月亮不忙著圓缺 春天不走遠</br>
樹梢緊緊擁抱著樹葉 有誰能聽見</br>
</br>
耳際 眼前 此生重演 是我來自漆黑 而又回歸漆黑</br>
人間 瞬間 天地之間 下次我 又是誰</br>
有沒有那麼一朵玫瑰 永遠不凋謝</br>
永遠驕傲和完美 永遠不妥協</br>
爲何人生最後會像一張紙屑 還不如一片花瓣曾經鮮豔</br>
</br>
有沒有那麼一張書籤 停止那一天</br>
最單純的笑臉和 最美那一年</br>
書包裡面裝滿了蛋糕和汽水</br>
雙眼只有無猜和無邪 讓我們無法無天</br>
</br>
有沒有那麼一首詩篇 找不到句點</br>
青春永遠定居在 我們的歲月</br>
男孩和女孩都有吉他和舞鞋</br>
笑忘人間的苦痛 只有甜美</br>
</br>
有沒有那麼一個明天 重頭活一遍</br>
讓我再次感受曾 揮霍的昨天</br>
無論生存或生活 我都不浪費 不讓故事這麼的後悔</br>
</br>
有誰能聽見 我不要告別</br>
我坐在床前 看著指尖 已經如煙</br>`,
    howl: null
  },
  {
    title: '張懸-我想妳要走了',
    file: 'I_think_you_should_go',
    lyric: `我盤旋在寂寞上空</br>
眼看著雲起雨落</br>
情緒就要降落</br>
情緒就要降落</br>
</br>
也許在夢的出口</br>
平安擁抱了感動</br>
一瞬間才明白</br>
一瞬間才明白</br>
</br>
你要告別了</br>
你把話說好了</br>
你要告別了</br>
你會快樂</br>
</br>
也許在夢的出口</br>
平安擁抱了感動</br>
一瞬間才明白</br>
你說要睡得心滿意足的枕頭</br>
Wooh~</br>
Wooh~</br>
</br>
你要告別了</br>
故事都說完了</br>
你要告別了</br>
你會快樂</br>
你會快樂</br>
你會...</br>`,
    howl: null
  },
  {
    title: '梁文音-我們都別哭',
    file: 'dont_cry',
    lyric: `當葉子隨著風離開了樹</br>
變成花的禮物</br>
那只是你啟程了旅途</br>
不是結束</br>
</br>
時光比預料中來得殘酷</br>
愛得愈深愈匆促</br>
教人不得不學會祝福</br>
你先走的 那一步</br>
</br>
Hmm 我們都別哭</br>
傷心會浪費你的 呵護</br>
愛 微笑著回顧</br>
有你那段路 短暫卻幸福</br>
</br>
當陽光帶走了露珠</br>
我的眼眶起了霧</br>
看不見 可是我真實感觸</br>
你輕撫 我皮膚</br>
</br>
Hmm 我們都別哭</br>
傷心會浪費你的 呵護</br>
愛 微笑著回顧</br>
有你那段路 短暫卻幸福</br>
</br>
不帶一絲哀傷緬懷</br>
比淡忘更需要勇敢</br>
把回憶隨身攜帶</br>
我相信 是愛</br>
</br>
Hmm 我們都別哭</br>
你要到更好的地方 居住</br>
愛 再見面那天</br>
我們再散步 一整個下午</br>
</br>
看一個人從生命淡出</br>
不哭 因為 很愛</br>`,
    howl: null
  },
  {
    title: 'ColdPlay-Fix You',
    file: 'fix_you',
    lyric: `When you try your best but you don't succeed</br>
When you get what you want but not what you need</br>
When you feel so tired but you can't sleep</br>
Stuck in reverse</br>
</br>
When the tears come streaming down your face</br>
'Cause you lose something you can't replace</br>
When you love someone but it goes to waste</br>
What could it be worse?</br>
</br>
Lights will guide you home</br>
And ignite your bones</br>
And I will try to fix you</br>
</br>
But high up above or down below</br>
When you are too in love to let it show</br>
Oh but if you never try you'll never know</br>
Just what you're worth</br>
</br>
Lights will guide you home</br>
And ignite your bones</br>
And I will try to fix you</br>
</br>
Tears come streaming down your face</br>
When you lose something you cannot replace</br>
oh and tears come streaming down your face</br>
And I</br>
</br>
Tears streaming down your face</br>
I promise you I will learn from all my mistakes</br>
oh and the tears streaming down your face</br>
And I</br>
</br>
Lights will guide you home</br>
And ignite your bones</br>
And I will try to fix you</br>`,
    howl: null
  },
  {
    title: '好樂團-蒸發',
    file: 'evaporation',
    lyric: `走在探訪你的路上  我不帶任何一束花</br>
我只是覺得累了 就走著走著 來到你的方向</br>
你會說我又在遊蕩  快回到該待的地方</br>
我就不想  就像你離開時一樣不爽</br>
 </br>
你就像是蒸發  從我眼前蒸發</br>
從約好見面的地方蒸發</br>
或許這樣比較不會痛苦吧</br>
你就像是蒸發 從我腦中蒸發</br>
從我摸得到的地方蒸發</br>
可生活還是得繼續啊</br>
 </br>
走在沒有你的路上 我不說任何一句話</br>
我只是覺得煩了 就走著走著，自顧自的流浪</br>
你會說我一再憂傷 別戀著消逝的以往</br>
我就不想 就像你離開時一樣不爽</br>
 </br>
你就像是蒸發  從我眼前蒸發</br>
從約好見面的地方蒸發</br>
或許這樣比較不會痛苦吧</br>
你就像是蒸發 從我腦中蒸發</br>
從我摸得到的地方蒸發</br>
可生活還是得繼續啊</br>
 </br>
這城市這麼大 我卻見不到你啊</br>
這城市這麼大 我卻見不到你啊</br>
我失去了你 也丟失了我</br>
我想說的話 都埋在心臟 你聽見了嗎？</br>
 </br>
你就像是蒸發  從我眼前蒸發</br>
從約好見面的地方蒸發</br>
或許這樣比較不會痛苦吧</br>
你就像是蒸發 從我腦中蒸發</br>
從我摸得到的地方蒸發</br>
可生活還是得繼續啊</br>`,
    howl: null
  },
  {
    title: '五月天-我不願讓你一個人',
    file: 'you_wont_alone',
    lyric: `你說呢 明知你不在 還是會問</br>
空氣 卻不能代替你 出聲</br>
習慣 像永不癒合 的固執傷痕</br>
一思念就撕裂靈魂</br>
</br>
把相片 讓你能保存 多洗一本</br>
毛衣 也為你準備多 一層</br>
但是 你孤單時刻 安慰的體溫</br>
怎麼為你多留一份</br>
</br>
我不願讓你一個人 一個人在人海浮沉</br>
我不願你獨自走過 風雨的 時分</br>
我不願讓你一個人 承受這世界的殘忍</br>
我不願眼淚陪你到 永恆</br>
</br>
你走後 愛情的遺跡 像是空城</br>
遺落你杯子手套和 笑聲</br>
最後 你只帶走你 脆弱和單純</br>
和我最放不下的人</br>
也許未來 你會找到 懂你疼你 更好的人</br>
下段旅程 你一定要 更幸福豐盛</br>
</br>
我不願讓你一個人 一個人在人海浮沉</br>
我不願你獨自走過 風雨的 時分</br>
我不願讓你一個人 承受這世界的殘忍</br>
我不願眼淚陪你到 永恆</br>
</br>
你說呢 明知你不在 還是會問</br>
只因 習慣你滿足的 眼神</br>
只是 我最後一個 奢求的可能</br>
只求你有快樂人生</br>
</br>
只求命運 帶你去一段 全新的旅程</br>
往幸福的天涯飛奔</br>
別回頭就往前飛奔</br>
請忘了我還 一個人</br>
`,
    howl: null
  },


]);

// Bind our player controls.
showlyrics.addEventListener('click', function () {
  console.log(lyrics.style.display);
  var display = (lyrics.style.display === 'block' || lyrics.style.display === '') ? 'none' : 'block';

  setTimeout(function () {
    lyrics.style.display = display;
  }, (display === 'block') ? 0 : 500);

  lyrics.classList.add((display === 'block') ? 'fadein' : 'fadeout')
  lyrics.classList.remove((display !== 'block') ? 'fadein' : 'fadeout')

});
playBtn.addEventListener('click', function () {
  player.play();
});
pauseBtn.addEventListener('click', function () {
  player.pause();
});
prevBtn.addEventListener('click', function () {
  player.skip('prev');
});
nextBtn.addEventListener('click', function () {
  player.skip('next');
});
waveform.addEventListener('click', function (event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function () {
  player.togglePlaylist();
});
playlist.addEventListener('click', function () {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function () {
  player.toggleVolume();
});
volume.addEventListener('click', function () {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function (event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function () {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function () {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function () {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function () {
  window.sliderDown = false;
});

var move = function (event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function () {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();