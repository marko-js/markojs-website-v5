let taglineStatements = [
  // "Render HTML like you mean it",
  "It's like HTML and JS had a perfect baby that grew up to be awesome",
  "Yes, you can copy and paste HTML from StackOverflow",
  "Server-side rendering + Client-side rendering = <b>Awesomorphic</b>",
  "Bringing back progressive HTML rendering to the masses",
];

for (let i = 0; i < taglineStatements.length; i++) {
  taglineStatements[
    i
  ] = `<span class="home-fade-in">${taglineStatements[i]}</span>`;
}

export default {
  onMount() {
    const header = this.getEl("tagline");
    const originalMessage = header.innerHTML;
    const originalFadeIn = `<span class="home-fade-in">${originalMessage}</span>`;

    let currentTaglineIndex = 0;

    setInterval(() => {
      header.classList.remove("home-fade-in");
      header.classList.add("home-fade-out");

      setTimeout(() => {
        header.classList.remove("home-fade-out");

        const tagline = taglineStatements[currentTaglineIndex];

        if (currentTaglineIndex === taglineStatements.length) {
          header.innerHTML = originalFadeIn;
          currentTaglineIndex = 0;
        } else {
          header.innerHTML = tagline;
          currentTaglineIndex++;
        }
      }, 500);
    }, 6000);
  },
};
