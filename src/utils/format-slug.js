export default (name) => {
  return name
    .replace(/[^\w\d\s\.-]/g, "")
    .replace(/[\s\.]+/g, "-")
    .toLowerCase();
};
