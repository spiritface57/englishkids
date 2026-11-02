// Original read-along stories, from very easy (level 1) to easy (level 5).
// Each page is 1–3 short sentences with an emoji picture. The glossary lists words as they appear in the text.

export type StoryPage = { emoji: string; text: string };
export type StoryQuestion = { q: string; options: string[]; answer: string };
export type Story = {
  id: string;
  level: number;
  emoji: string;
  title: string;
  fa: string;
  pages: StoryPage[];
  glossary: { en: string; fa: string }[];
  questions: StoryQuestion[];
};

export const stories: Story[] = [
  {
    id: 'red-ball',
    level: 1,
    emoji: '⚽',
    title: "Tom's Red Ball",
    fa: 'توپ قرمز تام',
    pages: [
      { emoji: '👦⚽', text: 'This is Tom. Tom has a red ball.' },
      { emoji: '🦶⚽', text: 'Tom kicks the ball. The ball goes up, up, up!' },
      { emoji: '🌳😮', text: 'Oh no! The ball is in the tree.' },
      { emoji: '🐦', text: 'A little bird sits on the ball. Tweet, tweet!' },
      { emoji: '🐶', text: 'Tom and his dog look up. The dog jumps, but the tree is very tall.' },
      { emoji: '🌬️🍃', text: 'Then the wind blows. Whoosh! The ball falls down.' },
      { emoji: '👦⚽😄', text: 'Tom is happy. He hugs his red ball.' },
    ],
    glossary: [
      { en: 'ball', fa: 'توپ' },
      { en: 'red', fa: 'قرمز' },
      { en: 'kicks', fa: 'شوت می‌کند' },
      { en: 'tree', fa: 'درخت' },
      { en: 'bird', fa: 'پرنده' },
      { en: 'dog', fa: 'سگ' },
      { en: 'tall', fa: 'بلند' },
      { en: 'wind', fa: 'باد' },
      { en: 'falls', fa: 'می‌افتد' },
      { en: 'happy', fa: 'خوشحال' },
      { en: 'hugs', fa: 'بغل می‌کند' },
    ],
    questions: [
      { q: "What color is Tom's ball?", options: ['red', 'blue', 'green'], answer: 'red' },
      { q: 'Where does the ball go?', options: ['in the tree', 'in the river', 'in a box'], answer: 'in the tree' },
      { q: 'What makes the ball fall down?', options: ['the wind', 'the dog', 'the bird'], answer: 'the wind' },
    ],
  },
  {
    id: 'hungry-cat',
    level: 2,
    emoji: '🐱',
    title: 'The Hungry Little Cat',
    fa: 'گربه‌ی کوچولوی گرسنه',
    pages: [
      { emoji: '🐱', text: 'Mimi is a little cat. She is very hungry.' },
      { emoji: '🐱🍽️', text: 'Mimi looks in the kitchen. Her bowl is empty.' },
      { emoji: '🐱🥕', text: 'She finds a carrot. Mimi does not like carrots!' },
      { emoji: '🐱🍞', text: 'She finds some bread. Mimi does not like bread!' },
      { emoji: '👧🥛', text: 'Then Sara comes in. She has a cup of milk.' },
      { emoji: '🐱🥛', text: 'Mimi drinks the milk. Yum, yum!' },
      { emoji: '🐱☀️😴', text: 'Now Mimi is not hungry. She sleeps in the sun.' },
    ],
    glossary: [
      { en: 'little', fa: 'کوچولو' },
      { en: 'cat', fa: 'گربه' },
      { en: 'hungry', fa: 'گرسنه' },
      { en: 'kitchen', fa: 'آشپزخانه' },
      { en: 'bowl', fa: 'کاسه' },
      { en: 'empty', fa: 'خالی' },
      { en: 'finds', fa: 'پیدا می‌کند' },
      { en: 'carrot', fa: 'هویج' },
      { en: 'carrots', fa: 'هویج‌ها' },
      { en: 'bread', fa: 'نان' },
      { en: 'milk', fa: 'شیر' },
      { en: 'drinks', fa: 'می‌نوشد' },
      { en: 'sleeps', fa: 'می‌خوابد' },
    ],
    questions: [
      { q: "What is the cat's name?", options: ['Mimi', 'Sara', 'Tom'], answer: 'Mimi' },
      { q: 'What does Mimi drink?', options: ['milk', 'water', 'juice'], answer: 'milk' },
      { q: 'Where does Mimi sleep?', options: ['in the sun', 'in a box', 'in the tree'], answer: 'in the sun' },
    ],
  },
  {
    id: 'rainy-park',
    level: 3,
    emoji: '🌧️',
    title: 'A Rainy Day at the Park',
    fa: 'یک روز بارانی در پارک',
    pages: [
      { emoji: '👦👧🌳', text: 'Ben and Lily went to the park. The sky was blue.' },
      { emoji: '🛝😄', text: 'They played on the slide. They ran on the green grass.' },
      { emoji: '☁️☁️', text: 'Then the sky was gray. Big clouds came.' },
      { emoji: '🌧️', text: 'Drip, drop! It started to rain.' },
      { emoji: '👩☂️', text: 'Mom opened a big yellow umbrella. They all stood under it.' },
      { emoji: '🐸💦', text: 'A small frog jumped in a puddle. Splash! Ben and Lily laughed.' },
      { emoji: '🌈', text: 'Soon the rain stopped. They saw a beautiful rainbow.' },
    ],
    glossary: [
      { en: 'park', fa: 'پارک' },
      { en: 'sky', fa: 'آسمان' },
      { en: 'played', fa: 'بازی کردند' },
      { en: 'slide', fa: 'سرسره' },
      { en: 'grass', fa: 'چمن' },
      { en: 'clouds', fa: 'ابرها' },
      { en: 'rain', fa: 'باران' },
      { en: 'umbrella', fa: 'چتر' },
      { en: 'frog', fa: 'قورباغه' },
      { en: 'puddle', fa: 'چاله‌ی آب' },
      { en: 'laughed', fa: 'خندیدند' },
      { en: 'rainbow', fa: 'رنگین‌کمان' },
    ],
    questions: [
      { q: 'Where did Ben and Lily go?', options: ['to the park', 'to school', 'to the zoo'], answer: 'to the park' },
      { q: 'What color was the umbrella?', options: ['yellow', 'red', 'blue'], answer: 'yellow' },
      { q: 'What did they see at the end?', options: ['a rainbow', 'a cat', 'a boat'], answer: 'a rainbow' },
    ],
  },
  {
    id: 'birthday-cake',
    level: 4,
    emoji: '🎂',
    title: "Lily's Birthday Cake",
    fa: 'کیک تولد لیلی',
    pages: [
      { emoji: '👧🎂', text: "Today is Lily's birthday. She is seven years old." },
      { emoji: '👩🥚🥛', text: 'Mom and Lily make a cake. They need eggs, milk and flour.' },
      { emoji: '🥣', text: 'Lily mixes everything in a big bowl. Mix, mix, mix!' },
      { emoji: '♨️⏰', text: 'The cake goes in the oven. They wait and wait.' },
      { emoji: '🍓🍫', text: 'Lily puts strawberries on the cake. It looks yummy!' },
      { emoji: '🎈🎁', text: 'Her friends come to the party. They bring presents.' },
      { emoji: '🕯️🎶', text: 'Everyone sings Happy Birthday. Lily blows out the candles.' },
      { emoji: '🍰😋', text: 'They all eat the cake. It is the best cake ever!' },
    ],
    glossary: [
      { en: 'birthday', fa: 'تولد' },
      { en: 'cake', fa: 'کیک' },
      { en: 'eggs', fa: 'تخم‌مرغ‌ها' },
      { en: 'flour', fa: 'آرد' },
      { en: 'mixes', fa: 'هم می‌زند' },
      { en: 'bowl', fa: 'کاسه' },
      { en: 'oven', fa: 'فِر' },
      { en: 'strawberries', fa: 'توت‌فرنگی‌ها' },
      { en: 'yummy', fa: 'خوشمزه' },
      { en: 'friends', fa: 'دوستان' },
      { en: 'presents', fa: 'هدیه‌ها' },
      { en: 'candles', fa: 'شمع‌ها' },
    ],
    questions: [
      { q: 'How old is Lily?', options: ['seven', 'five', 'ten'], answer: 'seven' },
      {
        q: 'What does Lily put on the cake?',
        options: ['strawberries', 'carrots', 'bananas'],
        answer: 'strawberries',
      },
      { q: 'What does Lily blow out?', options: ['the candles', 'the balloons', 'the lights'], answer: 'the candles' },
    ],
  },
  {
    id: 'brave-boat',
    level: 5,
    emoji: '⛵',
    title: 'The Brave Little Boat',
    fa: 'قایق کوچولوی شجاع',
    pages: [
      { emoji: '⛵🌊', text: 'There was a little red boat. It lived by the sea.' },
      { emoji: '🚢⛵', text: 'The big ships went far away. The little boat stayed near the beach.' },
      { emoji: '🐟😢', text: 'One day, the boat met a little fish. The fish was lost. It could not find its family.' },
      { emoji: '⛵🐟', text: 'The boat wanted to help. Come with me, said the boat.' },
      { emoji: '🌬️🌊', text: 'The wind was strong and the waves were big. The boat was scared, but it did not stop.' },
      { emoji: '🏝️🐠🐠', text: "At last, they saw a small island. The fish's family was there!" },
      { emoji: '🐟💙', text: 'The little fish was very happy. Thank you, little boat!' },
      { emoji: '⛵⭐', text: 'Now the little boat is not scared of big waves. It is a brave boat!' },
    ],
    glossary: [
      { en: 'boat', fa: 'قایق' },
      { en: 'sea', fa: 'دریا' },
      { en: 'ships', fa: 'کشتی‌ها' },
      { en: 'beach', fa: 'ساحل' },
      { en: 'fish', fa: 'ماهی' },
      { en: 'lost', fa: 'گم شده' },
      { en: 'family', fa: 'خانواده' },
      { en: 'help', fa: 'کمک کردن' },
      { en: 'strong', fa: 'قوی' },
      { en: 'waves', fa: 'موج‌ها' },
      { en: 'scared', fa: 'ترسیده' },
      { en: 'island', fa: 'جزیره' },
      { en: 'brave', fa: 'شجاع' },
    ],
    questions: [
      { q: 'What color was the boat?', options: ['red', 'green', 'blue'], answer: 'red' },
      { q: 'Who was lost?', options: ['a little fish', 'a big ship', 'a bird'], answer: 'a little fish' },
      {
        q: "Where was the fish's family?",
        options: ['near a small island', 'on the beach', 'in the sky'],
        answer: 'near a small island',
      },
    ],
  },
];
