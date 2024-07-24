module.exports = {
  onMount() {
    const value = this.getEl("version").value;
    const valuev6 = value.startsWith("/v6");
    const valuev5 = !valuev6 && value.startsWith("/");
    const update = (this.v6 && !valuev6) || (!this.v6 && !valuev5);
    if (update) {
      window.location.href = value;
    }
  },
  switchVersion(e) {
    window.location.href = e.target.value;
  },
};
