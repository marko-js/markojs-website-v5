import siteHeaderEvents from "./events";

var classNames = {
  base: "headspace",
  fixed: "headspace--fixed",
  hidden: "headspace--hidden",
};
var debounce = (cb) => () => window.requestAnimationFrame(cb);
var tolerance = 3;

export default {
  onMount() {
    siteHeaderEvents.emit("create", this);
    var scrollLast = 0;
    var startOffset = this.getEl("header").offsetHeight;
    var bannerHeight = (this.getEl("banner") || { offsetHeight: 0 })
      .offsetHeight;

    var handleScroll = debounce(() => {
      var scrollCurrent = window.pageYOffset;

      if (scrollCurrent <= bannerHeight) {
        this.reset();
      } else if (!this.paused && scrollCurrent > startOffset) {
        var toleanceReached = Math.abs(scrollCurrent - scrollLast) >= tolerance;
        var scrollingDown = scrollCurrent > scrollLast;
        var wasAtTop = scrollLast <= startOffset;
        if (toleanceReached || (scrollingDown && wasAtTop)) {
          scrollCurrent > scrollLast ? this.hide() : this.fix();
        }
      }

      scrollLast = scrollCurrent;
    });

    handleScroll();
    window.addEventListener("scroll", handleScroll);
  },
  reset() {
    this.removeClass(classNames.fixed);
    this.removeClass(classNames.hidden);
    siteHeaderEvents.emit("reset");
  },
  fix() {
    this.addClass(classNames.fixed);
    this.removeClass(classNames.hidden);
    siteHeaderEvents.emit("fix");
  },
  hide() {
    this.addClass(classNames.hidden);
    siteHeaderEvents.emit("hide");
  },
  addClass(cls) {
    this.getEl("header").classList.add(cls);
  },
  removeClass(cls) {
    this.getEl("header").classList.remove(cls);
  },
  pause() {
    this.paused = true;
  },
  resume() {
    setTimeout(() =>
      window.requestAnimationFrame(() => {
        this.paused = false;
      })
    );
  },
  toggleMenu() {
    siteHeaderEvents.emit("toggle-menu");
  },
};
