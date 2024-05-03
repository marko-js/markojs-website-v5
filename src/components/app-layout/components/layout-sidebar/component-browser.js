import siteHeaderEvents from "../layout-header/events";
var forEach = [].forEach;
var filter = [].filter;
var slice = [].slice;
var siteHeaderComponent;

export default {
  onMount() {
    this.preventOverscroll();
    this.listenForHeaderChanges();
    this.initScrollSpy();
  },

  initScrollSpy() {
    var headersSelector = [1, 2, 3, 4, 5, 6]
      .map((n) => ".doc-content h" + n)
      .join(",");
    var headers = slice.call(document.querySelectorAll(headersSelector));
    var waiting = false;

    headers.length &&
      this.subscribeTo(window).on("scroll", () => {
        if (!waiting) {
          waiting = true;
          setTimeout(() => {
            var threshold = window.innerHeight / 3;
            var closestHeader;
            var closestTop;

            headers.map((header) => {
              var top = header.getBoundingClientRect().top;
              if (
                closestTop == null ||
                (top < threshold && Math.abs(top) < Math.abs(closestTop))
              ) {
                closestTop = top;
                closestHeader = header;
              }
            });

            var anchor = closestHeader.id;
            var anchorEl =
              this.el.querySelector('a[href="#' + anchor + '"]') ||
              this.el.querySelector("a.selected");
            var targetAnchor = anchorEl;
            var childList = targetAnchor.nextSibling;

            if (childList) {
              forEach.call(childList.querySelectorAll("a[href^=\\#]"), (a) =>
                a.classList.remove("selected")
              );
            }

            while (targetAnchor) {
              var parentList = targetAnchor.closest("ul");
              var siblings =
                parentList &&
                filter.call(
                  parentList.querySelectorAll(":scope > li > a[href^=\\#]"),
                  (a) => a !== targetAnchor
                );
              siblings &&
                siblings.forEach((a) => a.classList.remove("selected"));
              targetAnchor.classList.add("selected");
              targetAnchor = parentList && parentList.previousElementSibling;
            }

            this.scrollAnchorIntoView(anchorEl);

            waiting = false;
          }, 50);
        }
      });
  },

  listenForHeaderChanges() {
    forEach.call(this.el.querySelectorAll("a[href^=\\#]"), (a) => {
      this.subscribeTo(a).on("click", () => {
        siteHeaderComponent.hide();
        siteHeaderComponent.pause();
        siteHeaderComponent.resume();
        this.hide();
      });
    });

    // handles nested selected links
    var selectedLink = slice.call(this.el.querySelectorAll("a.selected")).pop();

    selectedLink &&
      this.subscribeTo(selectedLink).on("click", (e) => {
        window.scrollTo(0, 0);
        siteHeaderComponent.reset();
        e.preventDefault();
      });

    this.subscribeTo(siteHeaderEvents)
      .on("reset", () => {
        this.el.classList.remove("no-header");
        this.el.classList.remove("fixed");
        setTimeout(() => this.el.classList.remove("transition"), 0);
      })
      .on("fix", () => {
        this.el.classList.remove("no-header");
        this.el.classList.add("fixed");
        setTimeout(() => this.el.classList.add("transition"), 0);
      })
      .on("hide", () => {
        this.el.classList.add("no-header");
        this.el.classList.add("fixed");
        setTimeout(() => this.el.classList.add("transition"), 0);
      })
      .on("toggle-menu", () => {
        if (this.el.classList.contains("show")) {
          this.el.classList.remove("show");
          document.body.style.overflow = "";
        } else {
          this.el.classList.add("show");
        }
      })
      .on("create", (_siteHeaderComponent) => {
        siteHeaderComponent = _siteHeaderComponent;

        if (window.pageYOffset > siteHeaderComponent.el.offsetHeight) {
          this.el.classList.add("no-header");
          this.el.classList.add("fixed");
        }
      });
  },

  preventOverscroll() {
    var sidebar = this.getEl("sidebar");
    this.subscribeTo(document.body).on("wheel", (e) => {
      var delta = e.deltaY;
      var scrollTarget = sidebar.scrollTop + delta;
      var topY = 0;
      var bottomY = sidebar.scrollHeight - sidebar.offsetHeight;
      var atTop = scrollTarget <= topY;
      var atBottom = scrollTarget >= bottomY;

      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        if (e.target === sidebar || sidebar.contains(e.target)) {
          if (atTop && sidebar.scrollTop != topY) {
            sidebar.scrollTop = topY;
          } else if (atBottom && sidebar.scrollTop != bottomY) {
            sidebar.scrollTop = bottomY;
          }
          e.preventDefault();
        }
      }
    });
  },

  scrollAnchorIntoView(anchorEl) {
    var sidebar = this.getEl("sidebar");
    var anchorTop = anchorEl.offsetTop;
    var sidebarScrollTop = sidebar.scrollTop;
    var sidebarHeight = sidebar.offsetHeight;
    var sidebarScrollBottom = sidebarScrollTop + sidebarHeight;

    var targetList = anchorEl.closest("li");
    var parentList;

    while (true) {
      parentList = targetList.parentNode.closest("ul");
      if (parentList && parentList.offsetHeight < sidebarHeight) {
        targetList = parentList;
      } else {
        break;
      }
    }

    var targetTop = targetList.offsetTop;
    var targetHeight = targetList.offsetHeight;
    var targetBottom = targetTop + targetHeight;
    var targetIsFullyVisible =
      targetTop > sidebarScrollTop && targetBottom < sidebarScrollBottom;

    if (!targetIsFullyVisible) {
      sidebar.scrollTop = targetTop + targetHeight / 2 - sidebarHeight / 2;
    }
  },

  hide() {
    this.el.classList.remove("show");
    document.body.style.overflow = "";
  },
};
