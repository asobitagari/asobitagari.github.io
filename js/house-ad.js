// 記事上の広告枠が埋まらなかったら、自前バナーに切り替える。
//
// 忍者AdMax は広告がないと、他社へ順に回したあと「中身が空の 728x90 の枠」を残す。
// 枠の中の同一オリジンのフレームをたどり、目に見える大きさの画像や外部フレームがあれば
// 広告が出たとみなす。WAIT_MS 待っても見つからなければ、枠を隠してバナーを出す。
// 広告ブロックなどでスクリプトが読めなかった場合も、同じくバナーになる。
// バナーの候補（.house-item）が複数あれば、ページを開くたびにランダムで 1 つ選ぶ。
(function () {
  var WAIT_MS = 6000;
  var POLL_MS = 500;
  var MIN_W = 50;
  var MIN_H = 30;
  var MEDIA = 'img,video,canvas,svg,object,embed';

  function big(el) {
    var r = el.getBoundingClientRect();
    return r.width >= MIN_W && r.height >= MIN_H;
  }

  // root（要素か document）の中に、表示中の広告らしきものがあるか
  function hasAd(root, depth) {
    if (depth > 8) return false;
    var media = root.querySelectorAll(MEDIA);
    for (var i = 0; i < media.length; i++) {
      if (big(media[i])) return true;
    }
    var frames = root.querySelectorAll('iframe');
    for (var j = 0; j < frames.length; j++) {
      var f = frames[j];
      if (!big(f)) continue;
      var doc = null;
      try {
        doc = f.contentDocument;
      } catch (e) {
        doc = null;
      }
      // 中が見られない外部フレームが表示されている = 広告が入っている
      if (!doc) return true;
      if (doc.body && hasAd(doc, depth + 1)) return true;
    }
    return false;
  }

  function watch(box) {
    var slot = box.querySelector('.top-ad-slot');
    var items = box.querySelectorAll('.house-item');
    if (!slot || items.length === 0) return;
    var start = Date.now();
    (function check() {
      if (hasAd(slot, 0)) return; // 広告が出たので何もしない
      if (Date.now() - start < WAIT_MS) {
        setTimeout(check, POLL_MS);
        return;
      }
      slot.hidden = true;
      show(items[Math.floor(Math.random() * items.length)]);
    })();
  }

  // 候補のうち 1 つを表示し、その画像だけ読み込む
  function show(item) {
    var imgs = item.querySelectorAll('img[data-src]');
    for (var i = 0; i < imgs.length; i++) imgs[i].src = imgs[i].getAttribute('data-src');
    item.hidden = false;
  }

  function init() {
    var boxes = document.querySelectorAll('[data-house-ad]');
    for (var i = 0; i < boxes.length; i++) watch(boxes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
