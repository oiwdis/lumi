export interface Word {
  target: string;    // word in target language
  english: string;   // English meaning
  hint?: string;     // pronunciation (pinyin / romaji)
}

export interface Topic {
  id: string;
  emoji: string;
  title: string;
  words: Word[];
}

export const TOPICS: Record<string, Topic[]> = {
  'en-es': [
    {
      id: 'greetings', emoji: '👋', title: 'Greetings',
      words: [
        { target: 'Hola', english: 'Hello' },
        { target: 'Adiós', english: 'Goodbye' },
        { target: 'Gracias', english: 'Thank you' },
        { target: 'Por favor', english: 'Please' },
        { target: 'Buenos días', english: 'Good morning' },
      ],
    },
    {
      id: 'numbers', emoji: '🔢', title: 'Numbers 1–5',
      words: [
        { target: 'Uno', english: 'One' },
        { target: 'Dos', english: 'Two' },
        { target: 'Tres', english: 'Three' },
        { target: 'Cuatro', english: 'Four' },
        { target: 'Cinco', english: 'Five' },
      ],
    },
    {
      id: 'colors', emoji: '🎨', title: 'Colors',
      words: [
        { target: 'Rojo', english: 'Red' },
        { target: 'Azul', english: 'Blue' },
        { target: 'Verde', english: 'Green' },
        { target: 'Amarillo', english: 'Yellow' },
        { target: 'Negro', english: 'Black' },
      ],
    },
    {
      id: 'family', emoji: '👨‍👩‍👧', title: 'Family',
      words: [
        { target: 'Mamá', english: 'Mom' },
        { target: 'Papá', english: 'Dad' },
        { target: 'Hermano', english: 'Brother' },
        { target: 'Hermana', english: 'Sister' },
        { target: 'Amigo', english: 'Friend' },
      ],
    },
    {
      id: 'food', emoji: '🍽️', title: 'Food & Drink',
      words: [
        { target: 'Agua', english: 'Water' },
        { target: 'Pan', english: 'Bread' },
        { target: 'Leche', english: 'Milk' },
        { target: 'Manzana', english: 'Apple' },
        { target: 'Café', english: 'Coffee' },
      ],
    },
  ],
  'en-fr': [
    {
      id: 'greetings', emoji: '👋', title: 'Greetings',
      words: [
        { target: 'Bonjour', english: 'Hello' },
        { target: 'Au revoir', english: 'Goodbye' },
        { target: 'Merci', english: 'Thank you' },
        { target: "S'il vous plaît", english: 'Please' },
        { target: 'Bonsoir', english: 'Good evening' },
      ],
    },
    {
      id: 'numbers', emoji: '🔢', title: 'Numbers 1–5',
      words: [
        { target: 'Un', english: 'One' },
        { target: 'Deux', english: 'Two' },
        { target: 'Trois', english: 'Three' },
        { target: 'Quatre', english: 'Four' },
        { target: 'Cinq', english: 'Five' },
      ],
    },
    {
      id: 'colors', emoji: '🎨', title: 'Colors',
      words: [
        { target: 'Rouge', english: 'Red' },
        { target: 'Bleu', english: 'Blue' },
        { target: 'Vert', english: 'Green' },
        { target: 'Jaune', english: 'Yellow' },
        { target: 'Noir', english: 'Black' },
      ],
    },
    {
      id: 'family', emoji: '👨‍👩‍👧', title: 'Family',
      words: [
        { target: 'Mère', english: 'Mother' },
        { target: 'Père', english: 'Father' },
        { target: 'Frère', english: 'Brother' },
        { target: 'Sœur', english: 'Sister' },
        { target: 'Ami', english: 'Friend' },
      ],
    },
    {
      id: 'food', emoji: '🍽️', title: 'Food & Drink',
      words: [
        { target: 'Eau', english: 'Water' },
        { target: 'Pain', english: 'Bread' },
        { target: 'Lait', english: 'Milk' },
        { target: 'Pomme', english: 'Apple' },
        { target: 'Café', english: 'Coffee' },
      ],
    },
  ],
  'en-zh': [
    {
      id: 'greetings', emoji: '👋', title: 'Greetings',
      words: [
        { target: '你好', english: 'Hello', hint: 'nǐ hǎo' },
        { target: '再见', english: 'Goodbye', hint: 'zài jiàn' },
        { target: '谢谢', english: 'Thank you', hint: 'xiè xie' },
        { target: '请', english: 'Please', hint: 'qǐng' },
        { target: '早上好', english: 'Good morning', hint: 'zǎo shàng hǎo' },
      ],
    },
    {
      id: 'numbers', emoji: '🔢', title: 'Numbers 1–5',
      words: [
        { target: '一', english: 'One', hint: 'yī' },
        { target: '二', english: 'Two', hint: 'èr' },
        { target: '三', english: 'Three', hint: 'sān' },
        { target: '四', english: 'Four', hint: 'sì' },
        { target: '五', english: 'Five', hint: 'wǔ' },
      ],
    },
    {
      id: 'colors', emoji: '🎨', title: 'Colors',
      words: [
        { target: '红色', english: 'Red', hint: 'hóng sè' },
        { target: '蓝色', english: 'Blue', hint: 'lán sè' },
        { target: '绿色', english: 'Green', hint: 'lǜ sè' },
        { target: '黄色', english: 'Yellow', hint: 'huáng sè' },
        { target: '黑色', english: 'Black', hint: 'hēi sè' },
      ],
    },
    {
      id: 'family', emoji: '👨‍👩‍👧', title: 'Family',
      words: [
        { target: '妈妈', english: 'Mom', hint: 'māma' },
        { target: '爸爸', english: 'Dad', hint: 'bàba' },
        { target: '哥哥', english: 'Older brother', hint: 'gēge' },
        { target: '姐姐', english: 'Older sister', hint: 'jiějie' },
        { target: '朋友', english: 'Friend', hint: 'péngyǒu' },
      ],
    },
    {
      id: 'food', emoji: '🍽️', title: 'Food & Drink',
      words: [
        { target: '水', english: 'Water', hint: 'shuǐ' },
        { target: '面包', english: 'Bread', hint: 'miàn bāo' },
        { target: '牛奶', english: 'Milk', hint: 'niú nǎi' },
        { target: '苹果', english: 'Apple', hint: 'píng guǒ' },
        { target: '咖啡', english: 'Coffee', hint: 'kā fēi' },
      ],
    },
  ],
  'en-ja': [
    {
      id: 'greetings', emoji: '👋', title: 'Greetings',
      words: [
        { target: 'こんにちは', english: 'Hello', hint: 'konnichiwa' },
        { target: 'さようなら', english: 'Goodbye', hint: 'sayōnara' },
        { target: 'ありがとう', english: 'Thank you', hint: 'arigatō' },
        { target: 'おねがいします', english: 'Please', hint: 'onegaishimasu' },
        { target: 'おはようございます', english: 'Good morning', hint: 'ohayō gozaimasu' },
      ],
    },
    {
      id: 'numbers', emoji: '🔢', title: 'Numbers 1–5',
      words: [
        { target: 'いち', english: 'One', hint: 'ichi' },
        { target: 'に', english: 'Two', hint: 'ni' },
        { target: 'さん', english: 'Three', hint: 'san' },
        { target: 'し', english: 'Four', hint: 'shi' },
        { target: 'ご', english: 'Five', hint: 'go' },
      ],
    },
    {
      id: 'colors', emoji: '🎨', title: 'Colors',
      words: [
        { target: 'あか', english: 'Red', hint: 'aka' },
        { target: 'あお', english: 'Blue', hint: 'ao' },
        { target: 'みどり', english: 'Green', hint: 'midori' },
        { target: 'きいろ', english: 'Yellow', hint: 'kiiro' },
        { target: 'くろ', english: 'Black', hint: 'kuro' },
      ],
    },
    {
      id: 'family', emoji: '👨‍👩‍👧', title: 'Family',
      words: [
        { target: 'おかあさん', english: 'Mother', hint: 'okāsan' },
        { target: 'おとうさん', english: 'Father', hint: 'otōsan' },
        { target: 'おにいさん', english: 'Older brother', hint: 'oniisan' },
        { target: 'おねえさん', english: 'Older sister', hint: 'onēsan' },
        { target: 'ともだち', english: 'Friend', hint: 'tomodachi' },
      ],
    },
    {
      id: 'food', emoji: '🍽️', title: 'Food & Drink',
      words: [
        { target: 'みず', english: 'Water', hint: 'mizu' },
        { target: 'パン', english: 'Bread', hint: 'pan' },
        { target: 'ぎゅうにゅう', english: 'Milk', hint: 'gyūnyū' },
        { target: 'りんご', english: 'Apple', hint: 'ringo' },
        { target: 'コーヒー', english: 'Coffee', hint: 'kōhī' },
      ],
    },
  ],
};
