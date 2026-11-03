// Switch site features on or off. A feature that is off is not shown and its code is never loaded.
export const features = {
  // Sections
  reviews: true, // parents' reviews: sent from the site, shown after the teacher approves them by email
  levelTest: true, // "How good is my child's English?" placement test for parents
  parentsCorner: true, // tips for parents (Persian/English)
  worksheets: true, // printable worksheets (inside the parents' corner)

  // Learning playground (activities open in a window)
  speak: true, // "Say it!" speaking practice with the microphone
  wordOfTheDay: true, // a new word every day with a streak
  sentenceBuilder: true, // put the words in the right order
  stories: true, // read-along stories with highlighted words
  memory: true, // memory match: picture ↔ word
  wordSearch: true, // find the hidden words
  hangman: true, // guess the word before the balloons fly away
  seasonal: true, // Nowruz, Yalda, Halloween, Christmas word packs
  stickerBook: true, // collected stickers and a printable certificate
  profiles: true, // "Who's playing?": separate progress for each child on the same device

  // Tools for the teacher (not linked from the site's menus)
  brandTool: true, // /brand: put the logo on photos and other material
};

export type Feature = keyof typeof features;
