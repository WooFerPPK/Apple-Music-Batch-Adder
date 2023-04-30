(async () => {
  const similarity = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return (2 * dp[a.length][b.length]) / (a.length + b.length);
  };

  // Replace with your comma-separated list of songs
  const songs = "artist - song, artist - song, artist - song"; 
  const songList = songs.split(",").map(s => s.trim());

  // Set the match threshold
  const threshold = 0.9;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitForElement = async (selector) => {
    while (!document.querySelector(selector)) await delay(100);
    return document.querySelector(selector);
  };
  const navigateToSearchPage = async (song) => {
    history.pushState(null, "", `https://music.apple.com/ca/search?term=${encodeURIComponent(song.replace(/  /g, ', '))}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await delay(2000);
  };

  const searchAndAddSong = async (song) => {
    const [artist, title] = song.split(" - ").map(s => s.trim());
    await navigateToSearchPage(song);
    const songsSection = await waitForElement('[aria-label="Songs"]');

    const songElements = Array.from(songsSection.querySelectorAll('.track-lockup'));
    const findBestMatch = (best, current) => {
      const score = (el) => similarity(artist, el.querySelector('.track-lockup__subtitle').textContent.trim()) + similarity(title, el.querySelector('.track-lockup__title').textContent.trim());
      return score(current) > score(best) ? current : best;
    };
    const bestMatch = songElements.reduce(findBestMatch);

    const artistSimilarity = similarity(artist, bestMatch.querySelector('.track-lockup__subtitle').textContent.trim());
    const titleSimilarity = similarity(title, bestMatch.querySelector('.track-lockup__title').textContent.trim());

    if (artistSimilarity >= threshold && titleSimilarity >= threshold) {
      const addToLibraryButton = bestMatch.querySelector("button.add-to-library-button");
      if (addToLibraryButton) {
        addToLibraryButton.click();
        await delay(2000);
        console.log(`Added: ${artist} - ${title}`);
      } else {
        console.log(`Error: Add to library button not found for: ${artist} - ${title}`);
      }
    } else {
      console.log(`Best match added: ${artist} - ${title}`);
    }
  };

  for (const song of songList) await searchAndAddSong(song);
})();