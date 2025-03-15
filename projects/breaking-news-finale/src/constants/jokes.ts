// Array of newspaper-themed jokes
export const NEWSPAPER_JOKES = [
  {
    setup: "Why don't newspapers play poker?",
    punchline: "Too many editors are afraid of a full house!"
  },
  {
    setup: "What's black and white and read all over?",
    punchline: "A newspaper with a sunburn!"
  },
  {
    setup: "Did you hear about the journalist who was cold?",
    punchline: "He wrapped himself in the headlines!"
  },
  {
    setup: "Why was the newspaper reporter fired?",
    punchline: "He kept making up stories!"
  },
  {
    setup: "What do you call a newspaper that sings?",
    punchline: "A-choir-er!"
  },
  {
    setup: "Why did the newspaper go to school?",
    punchline: "To improve its circulation!"
  },
  {
    setup: "What's a newspaper's favorite drink?",
    punchline: "Scoops!"
  },
  {
    setup: "How does a newspaper say goodbye?",
    punchline: "Fine print!"
  },
  {
    setup: "What did the headline say to the photo?",
    punchline: "I'm just trying to capture your good side!"
  },
  {
    setup: "Why was the editor always calm during a crisis?",
    punchline: "He had good deadline management!"
  },
  {
    setup: "What's a newspaper's favorite game?",
    punchline: "Scoop ball!"
  },
  {
    setup: "Why did the newspaper cross the road?",
    punchline: "To get the scoop on the other side!"
  },
  {
    setup: "What do you call a newspaper that delivers to the ocean?",
    punchline: "Current events!"
  },
  {
    setup: "How do newspapers stay cool?",
    punchline: "They have many fans!"
  },
  {
    setup: "What's a newspaper's favorite dessert?",
    punchline: "A scoop of ice cream with extra sprinkles of truth!"
  }
];

// Function to get a random joke
export const getRandomJoke = () => {
  const randomIndex = Math.floor(Math.random() * NEWSPAPER_JOKES.length);
  return NEWSPAPER_JOKES[randomIndex];
}; 