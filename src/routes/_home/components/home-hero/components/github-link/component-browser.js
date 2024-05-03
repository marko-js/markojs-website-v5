var url = "https://api.github.com/repos/marko-js/marko";

export default {
  onMount() {
    fetch(url)
      .then((response) => response.json())
      .then((repo) => {
        if (repo.stargazers_count) {
          this.getEl("star-count").innerHTML =
            repo.stargazers_count.toLocaleString();
        }
      });
  },
};
