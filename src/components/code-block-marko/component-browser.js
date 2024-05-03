import { getComponentForEl } from "marko/components";
import localStorageUtil from "../../utils/localstorage";

export default {
  changeSyntax() {
    const header = getComponentForEl(document.querySelector(".site-header"));
    const beforeScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const beforePosition = this.el.offsetTop;

    header.pause();

    if (localStorageUtil.get("syntax") === "concise") {
      localStorageUtil.set("syntax", "html");
      document.body.classList.remove("concise");
    } else {
      localStorageUtil.set("syntax", "concise");
      document.body.classList.add("concise");
    }

    const afterPosition = this.el.offsetTop;
    const afterScroll = beforeScroll - beforePosition + afterPosition;

    document.documentElement.scrollTop = afterScroll;
    document.body.scrollTop = afterScroll;

    setTimeout(() => header.resume());
  },
};
