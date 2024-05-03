export default {
  onMount() {
    const value = this.getEl("version").value;
    const valuev6 = value.startsWith("/docs/v6");
    const valuev5 = !valuev6 && value.startsWith("/docs");
    const update = (this.v6 && !valuev6) || (!this.v6 && !valuev5);
    if (update) {
      window.location.href = value;
    }
  }
  switchVersion(e) {
    window.location.href = e.target.value;
  }
};
