var siteHeaderEvents = require("../layout-header/events");
var { filter } = [];
var siteHeaderComponent;

module.exports = {
  onMount() {
    this.listenForHeaderChanges();
    this.initScrollSpy();
  },

  initScrollSpy() {
    var headers = [...document.querySelectorAll(".doc-content .heading")];
    var waiting = false;
    if (!headers.length) { return; }

    this.subscribeTo(window).on("scroll", () => {
      if (waiting) { return; }

      waiting = true;
      setTimeout(() => {
        var threshold = window.innerHeight / 3;
        var closestHeader;
        var closestTop;

        headers.map(header => {
          var { top } = header.getBoundingClientRect();
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
          childList.querySelectorAll("a[href^='#']").forEach(a =>
            a.classList.remove("selected")
          );
        }

        while (targetAnchor) {
          var parentList = targetAnchor.closest("ol");
          var siblings =
            parentList &&
            filter.call(
              parentList.querySelectorAll(":scope > li > a[href^='#']"),
              a => a !== targetAnchor
            );
          siblings && siblings.forEach(a => a.classList.remove("selected"));
          targetAnchor.classList.add("selected");
          targetAnchor = parentList && parentList.previousElementSibling;
        }

        this.scrollAnchorIntoView(anchorEl);

        waiting = false;
      }, 50);
    });
  },

  listenForHeaderChanges() {
    this.el.querySelectorAll("a[href^='#']").forEach(a => {
      this.subscribeTo(a).on("click", () => {
        siteHeaderComponent.hide();
        siteHeaderComponent.pause();
        siteHeaderComponent.resume();
        this.hide();
      });
    });

    // handles nested selected links
    var selectedLink = [...this.el.querySelectorAll("a.selected")].pop();

    selectedLink &&
      this.subscribeTo(selectedLink).on("click", e => {
        window.scrollTo(0, 0);
        siteHeaderComponent.reset();
        e.preventDefault();
      });

    this.subscribeTo(siteHeaderEvents)
      .on("reset", () => {
        this.el.classList.remove("no-header", "fixed");
        setTimeout(() => this.el.classList.remove("transition"), 0);
      })
      .on("fix", () => {
        this.el.classList.remove("no-header");
        this.el.classList.add("fixed");
        setTimeout(() => this.el.classList.add("transition"), 0);
      })
      .on("hide", () => {
        this.el.classList.add("no-header", "fixed");
        setTimeout(() => this.el.classList.add("transition"), 0);
      })
      .on("toggle-menu", () => {
        this.el.classList.toggle("show");
      })
      .on("create", siteHeaderComponent => {
        if (window.pageYOffset > siteHeaderComponent.el.offsetHeight) {
          this.el.classList.add("no-header", "fixed");
        }
      });
  },

  scrollAnchorIntoView(anchorEl) {
    var sidebar = this.getEl("sidebar");
    var sidebarScrollTop = sidebar.scrollTop;
    var sidebarHeight = sidebar.offsetHeight;
    var sidebarScrollBottom = sidebarScrollTop + sidebarHeight;

    var targetList = anchorEl.closest("li");
    var parentList;

    while (true) {
      parentList = targetList.parentNode.closest("ol");
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
  }
};
