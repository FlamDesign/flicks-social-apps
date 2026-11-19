/* The Ordinary — "Hair or skin?" Branched Flick by Flam.
   Usage: <script src="https://flamdesign.github.io/flicks-social-apps/the-ordinary-hair-or-skin/tag.js"
                  data-width="300" data-height="250" data-clicktag="%%CLICK_URL_ESC%%"></script>
   The script renders the ad in an iframe right where the tag sits. data-clicktag is optional. */
(function () {
  var me = document.currentScript; if (!me) return;
  var base = me.src.replace(/tag\.js(\?.*)?$/, "");
  var w = parseInt(me.getAttribute("data-width") || "300", 10), h = parseInt(me.getAttribute("data-height") || "300", 10);
  var ct = me.getAttribute("data-clicktag");
  var f = document.createElement("iframe");
  f.src = base + "ad.html" + (ct ? "?clickTAG=" + encodeURIComponent(ct) : "");
  f.width = w; f.height = h; f.title = "The Ordinary — advertisement";
  f.setAttribute("scrolling", "no"); f.setAttribute("frameborder", "0");
  f.setAttribute("allow", "autoplay; fullscreen");
  f.style.cssText = "border:0;display:block;overflow:hidden;width:" + w + "px;height:" + h + "px;max-width:100%";
  me.parentNode.insertBefore(f, me.nextSibling);
})();
