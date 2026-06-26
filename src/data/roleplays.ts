import type { RolePlay } from '../types';

export const rolePlays: RolePlay[] = [
  // ─── en-es ───────────────────────────────────────────────────────────────
  {
    id: 'en-es-rp1',
    courseId: 'en-es',
    scenario: 'You\'re at a restaurant in Madrid. The waiter is taking your order.',
    emoji: '🍽️',
    npcName: 'Waiter',
    npcEmoji: '🧑‍🍳',
    turns: [
      {
        npc: '¡Buenas noches! ¿Qué van a tomar?',
        npcTranslation: 'Good evening! What will you have?',
        choices: [
          { text: 'Quiero la paella, por favor.', translation: 'I\'d like the paella, please.', correct: true, feedback: '¡Excelente elección! La paella está muy buena hoy.' },
          { text: 'Me gusta la pizza.', translation: 'I like pizza.', correct: false, feedback: 'Close! Use "Quiero" (I want) to order, not "Me gusta" (I like).' },
          { text: 'Yo soy americano.', translation: 'I am American.', correct: false, feedback: 'That\'s off-topic — you told the waiter your nationality instead of ordering!' },
        ],
      },
      {
        npc: '¿Y para beber?',
        npcTranslation: 'And to drink?',
        choices: [
          { text: 'Agua sin gas, por favor.', translation: 'Still water, please.', correct: true, feedback: 'Perfecto. "Sin gas" means still, "con gas" means sparkling!' },
          { text: 'Quiero agua frío.', translation: 'I want cold water.', correct: false, feedback: 'Almost! "Agua" is feminine, so say "agua fría" (not frío).' },
          { text: 'No tengo sed.', translation: 'I\'m not thirsty.', correct: false, feedback: 'That works, but it\'s a bit abrupt! Usually you\'d still order something.' },
        ],
      },
      {
        npc: '¿Necesita algo más?',
        npcTranslation: 'Do you need anything else?',
        choices: [
          { text: 'No, gracias. ¿Me trae la cuenta, por favor?', translation: 'No thanks. Could you bring the check please?', correct: true, feedback: '¡Muy bien! "¿Me trae...?" is a polite way to ask "Can you bring me...?"' },
          { text: 'Sí, quiero más paella.', translation: 'Yes, I want more paella.', correct: true, feedback: 'Also correct — asking for more food is totally fine!' },
          { text: 'Gracias y adiós.', translation: 'Thanks and goodbye.', correct: false, feedback: 'A bit abrupt to say goodbye before paying! Use this after you\'ve settled the bill.' },
        ],
      },
    ],
  },
  {
    id: 'en-es-rp2',
    courseId: 'en-es',
    scenario: 'You\'re lost in Barcelona. You need to ask someone for directions to the metro.',
    emoji: '🗺️',
    npcName: 'Local',
    npcEmoji: '🧑',
    turns: [
      {
        npc: '¡Hola! ¿Puedo ayudarte?',
        npcTranslation: 'Hi! Can I help you?',
        choices: [
          { text: 'Sí, por favor. ¿Dónde está el metro?', translation: 'Yes, please. Where is the metro?', correct: true, feedback: 'Perfect! "¿Dónde está...?" is the key phrase for asking locations.' },
          { text: 'Estoy perdido. ¿Hablas inglés?', translation: 'I\'m lost. Do you speak English?', correct: false, feedback: 'Understandable, but you\'re learning Spanish — try to ask in Spanish!' },
          { text: 'Busco un restaurante bueno.', translation: 'I\'m looking for a good restaurant.', correct: false, feedback: 'You were supposed to ask about the metro, not a restaurant!' },
        ],
      },
      {
        npc: 'El metro está a dos calles. Gira a la izquierda en el semáforo.',
        npcTranslation: 'The metro is two blocks away. Turn left at the traffic light.',
        choices: [
          { text: 'Entiendo. ¿Cuánto tiempo se tarda?', translation: 'I understand. How long does it take?', correct: true, feedback: '"¿Cuánto tiempo se tarda?" — a very useful phrase for travel!' },
          { text: 'Gracias, ¿y el autobús?', translation: 'Thanks, and the bus?', correct: true, feedback: 'Also a natural follow-up — great thinking!' },
          { text: 'No entiendo nada.', translation: 'I don\'t understand anything.', correct: false, feedback: 'Try to work with what you know — you could say "¿Puede repetir?" (Can you repeat?)' },
        ],
      },
      {
        npc: 'Unos cinco minutos caminando. ¡No tiene pérdida!',
        npcTranslation: 'About five minutes walking. You can\'t miss it!',
        choices: [
          { text: 'Muchas gracias. ¡Que tenga un buen día!', translation: 'Thank you very much. Have a great day!', correct: true, feedback: '"¡Que tenga un buen día!" — a warm farewell. Excellent Spanish!' },
          { text: 'Ok, bye.', translation: 'Ok, bye.', correct: false, feedback: 'Stay in Spanish! Try "¡Gracias y hasta luego!"' },
          { text: 'Gracias, adiós.', translation: 'Thanks, goodbye.', correct: true, feedback: 'Simple and polite — works perfectly!' },
        ],
      },
    ],
  },

  // ─── en-zh ───────────────────────────────────────────────────────────────
  {
    id: 'en-zh-rp1',
    courseId: 'en-zh',
    scenario: 'You\'re at a noodle restaurant in Beijing. The owner is taking your order.',
    emoji: '🍜',
    npcName: 'Restaurant owner',
    npcEmoji: '👩‍🍳',
    turns: [
      {
        npc: '你好！想吃什么？',
        npcTranslation: 'Hello! What would you like to eat?',
        choices: [
          { text: '我要一碗牛肉面，谢谢。', translation: 'I\'d like a bowl of beef noodles, thank you.', correct: true, feedback: '好的！"我要" means "I want/I\'d like" — perfect for ordering.' },
          { text: '我喜欢面条。', translation: 'I like noodles.', correct: false, feedback: '"我喜欢" (I like) expresses preference, not an order. Use "我要" to actually order.' },
          { text: '你好吗？', translation: 'How are you?', correct: false, feedback: 'That\'s a greeting, not an order! The owner is waiting for your food choice.' },
        ],
      },
      {
        npc: '要辣的还是不辣的？',
        npcTranslation: 'Spicy or not spicy?',
        choices: [
          { text: '不辣的，谢谢。', translation: 'Not spicy, thank you.', correct: true, feedback: '好的！ "不辣" (not spicy) — a very useful phrase at Chinese restaurants!' },
          { text: '有一点辣，可以吗？', translation: 'A little spicy, is that okay?', correct: true, feedback: 'Perfect! "有一点" (a little) + "可以吗？" (is that okay?) — very natural Chinese.' },
          { text: '我不知道。', translation: 'I don\'t know.', correct: false, feedback: 'It\'s okay to not know, but try to make a choice! "不辣" (not spicy) is a safe bet.' },
        ],
      },
      {
        npc: '还要点别的吗？',
        npcTranslation: 'Would you like to order anything else?',
        choices: [
          { text: '再来一杯茶，谢谢。', translation: 'One more cup of tea please, thank you.', correct: true, feedback: '"再来" means "one more" — a very handy phrase for restaurants!' },
          { text: '够了，谢谢。', translation: 'That\'s enough, thank you.', correct: true, feedback: '"够了" (enough/that\'s sufficient) — polite and natural!' },
          { text: '钱在哪里？', translation: 'Where is the money?', correct: false, feedback: 'Haha — you asked about money, not food! Try "不用了，谢谢" (No need, thank you).' },
        ],
      },
    ],
  },
  {
    id: 'en-zh-rp2',
    courseId: 'en-zh',
    scenario: 'You\'re buying a high-speed train ticket at Shanghai station.',
    emoji: '🚄',
    npcName: 'Ticket agent',
    npcEmoji: '🧑‍💼',
    turns: [
      {
        npc: '您好，去哪里？',
        npcTranslation: 'Hello, where are you going?',
        choices: [
          { text: '我要去北京，一张票，谢谢。', translation: 'I want to go to Beijing, one ticket, please.', correct: true, feedback: '好的！Clear and direct — exactly what\'s needed at a ticket window.' },
          { text: '北京很漂亮。', translation: 'Beijing is very beautiful.', correct: false, feedback: 'That\'s a nice comment, but the agent needs to know your destination and ticket count!' },
          { text: '我不知道。', translation: 'I don\'t know.', correct: false, feedback: 'The agent is waiting for your destination! Try "我要去..." (I want to go to...)' },
        ],
      },
      {
        npc: '要几号的车？我们有上午十点和下午三点。',
        npcTranslation: 'Which train? We have 10 AM and 3 PM.',
        choices: [
          { text: '上午十点的，请。', translation: 'The 10 AM one, please.', correct: true, feedback: '"上午" (morning) + time + "的" — a very natural way to specify trains or flights.' },
          { text: '早上比较好。', translation: 'Morning is better.', correct: false, feedback: 'Close, but a bit vague. Be specific: "上午十点的，请" to confirm which train.' },
          { text: '我要下午的票。', translation: 'I want an afternoon ticket.', correct: true, feedback: 'Also works! "我要...的票" is a great sentence pattern for buying tickets.' },
        ],
      },
      {
        npc: '二等座还是一等座？',
        npcTranslation: 'Second class or first class?',
        choices: [
          { text: '二等座，请。多少钱？', translation: 'Second class please. How much is it?', correct: true, feedback: 'Perfect! "多少钱？" (how much?) is one of the most useful phrases in Chinese.' },
          { text: '最便宜的。', translation: 'The cheapest one.', correct: true, feedback: '"最便宜的" (the cheapest one) — practical and perfectly natural Chinese!' },
          { text: '我有钱。', translation: 'I have money.', correct: false, feedback: 'That\'s... reassuring, but the agent needs to know which class you want, not your financial status!' },
        ],
      },
    ],
  },

  // ─── es-en ───────────────────────────────────────────────────────────────
  {
    id: 'es-en-rp1',
    courseId: 'es-en',
    scenario: 'Estás en un restaurante en Nueva York. El camarero está tomando tu pedido.',
    emoji: '🍽️',
    npcName: 'Waiter',
    npcEmoji: '🧑‍🍳',
    turns: [
      {
        npc: 'Good evening! What can I get for you?',
        npcTranslation: '¡Buenas noches! ¿Qué le traigo?',
        choices: [
          { text: 'I\'d like the burger, please.', translation: 'Quisiera la hamburguesa, por favor.', correct: true, feedback: '"I\'d like" (quisiería) is more polite than "I want" for ordering in restaurants.' },
          { text: 'I like hamburgers very much.', translation: 'Me gustan mucho las hamburguesas.', correct: false, feedback: 'That expresses preference, not an order! Use "I\'d like" or "I\'ll have" to actually order.' },
          { text: 'Yes, hello.', translation: 'Sí, hola.', correct: false, feedback: 'You need to order something — the waiter is waiting!' },
        ],
      },
      {
        npc: 'How would you like your burger? Rare, medium, or well done?',
        npcTranslation: '¿Cómo quiere la hamburguesa? ¿Poco hecha, al punto, o bien hecha?',
        choices: [
          { text: 'Medium, please.', translation: 'Al punto, por favor.', correct: true, feedback: 'Perfect! "Medium" means the burger is cooked through but still slightly pink inside.' },
          { text: 'I don\'t understand.', translation: 'No entiendo.', correct: false, feedback: 'Try to guess from context! "Rare" = undercooked, "well done" = fully cooked. Pick one!' },
          { text: 'Well done, thank you.', translation: 'Bien hecha, gracias.', correct: true, feedback: 'Great! "Well done" is perfectly natural — and "thank you" shows great manners.' },
        ],
      },
      {
        npc: 'Can I get you anything to drink?',
        npcTranslation: '¿Le traigo algo de beber?',
        choices: [
          { text: 'A glass of water, please.', translation: 'Un vaso de agua, por favor.', correct: true, feedback: 'Excellent! Simple, clear, and polite. "A glass of..." is very useful.' },
          { text: 'I want water.', translation: 'Quiero agua.', correct: false, feedback: 'Grammatically fine, but sounds a bit abrupt. "I\'d like" or "Could I have" is more natural.' },
          { text: 'No, I\'m not thirsty, thanks.', translation: 'No, no tengo sed, gracias.', correct: true, feedback: 'Perfectly natural — declining politely with "thanks" is great English!' },
        ],
      },
    ],
  },
  {
    id: 'es-en-rp2',
    courseId: 'es-en',
    scenario: 'Estás en Londres y estás perdido. Necesitas preguntar por el metro.',
    emoji: '🗺️',
    npcName: 'Local',
    npcEmoji: '🧑',
    turns: [
      {
        npc: 'Hi there! You look a bit lost. Can I help?',
        npcTranslation: '¡Hola! Parece que estás un poco perdido. ¿Puedo ayudarte?',
        choices: [
          { text: 'Yes please! Where is the nearest tube station?', translation: 'Sí, por favor. ¿Dónde está la estación de metro más cercana?', correct: true, feedback: '"Tube" is the British word for metro/subway. "Nearest" means "más cercana" — great vocabulary!' },
          { text: 'I am lost. I want metro.', translation: 'Estoy perdido. Quiero el metro.', correct: false, feedback: 'Understood, but sounds unnatural. Try: "Could you tell me where the nearest tube station is?"' },
          { text: 'No thank you.', translation: 'No, gracias.', correct: false, feedback: 'But you ARE lost! Accept the help — "Yes please!" is the right move.' },
        ],
      },
      {
        npc: 'Sure! Go straight ahead, then take the second left. It\'s about a five-minute walk.',
        npcTranslation: 'Claro. Sigue recto, luego toma la segunda calle a la izquierda. Son unos cinco minutos a pie.',
        choices: [
          { text: 'Got it! So I go straight and then turn left at the second street?', translation: '¡Entendido! ¿Entonces sigo recto y luego giro a la izquierda en la segunda calle?', correct: true, feedback: 'Brilliant! Confirming directions by repeating them back shows great communication skills.' },
          { text: 'I don\'t understand. Please repeat.', translation: 'No entiendo. Por favor, repite.', correct: false, feedback: '"Could you repeat that please?" is more natural. But "Please repeat" is understandable!' },
          { text: 'Thank you very much!', translation: 'Muchas gracias.', correct: true, feedback: 'Simple and polite! Though you could also confirm you understood the directions.' },
        ],
      },
      {
        npc: 'That\'s right! You\'ll see the big red sign. Can\'t miss it!',
        npcTranslation: '¡Exacto! Verás el gran letrero rojo. ¡No tiene pérdida!',
        choices: [
          { text: 'Wonderful, thank you so much for your help!', translation: '¡Estupendo, muchas gracias por tu ayuda!', correct: true, feedback: '"Wonderful" sounds very natural here — expressing genuine gratitude is great English!' },
          { text: 'OK bye.', translation: 'Ok, adiós.', correct: false, feedback: 'A bit abrupt! Try: "Great, thanks so much!" before leaving.' },
          { text: 'I see. Thank you, have a good day!', translation: 'Entiendo. Gracias, ¡que tengas un buen día!', correct: true, feedback: '"Have a good day!" is a warm farewell — perfect English!' },
        ],
      },
    ],
  },

  // ─── zh-en ───────────────────────────────────────────────────────────────
  {
    id: 'zh-en-rp1',
    courseId: 'zh-en',
    scenario: '你在伦敦的咖啡馆。咖啡师正在帮你点单。',
    emoji: '☕',
    npcName: 'Barista',
    npcEmoji: '☕',
    turns: [
      {
        npc: 'Hi! What can I get you today?',
        npcTranslation: '你好！今天想喝什么？',
        choices: [
          { text: 'Can I have a medium latte, please?', translation: '我可以要一杯中杯拿铁吗？', correct: true, feedback: '"Can I have...?" is the most natural way to order in English cafés. Perfect!' },
          { text: 'I want coffee.', translation: '我要咖啡。', correct: false, feedback: 'Grammatically correct but sounds blunt. "I\'d like..." or "Can I have...?" is more natural.' },
          { text: 'What is a latte?', translation: '拿铁是什么？', correct: false, feedback: 'A reasonable question if you\'re unsure, but you already know what a latte is! Try ordering directly.' },
        ],
      },
      {
        npc: 'Sure! What size would you like — small, medium, or large?',
        npcTranslation: '当然！您要什么尺寸？小杯、中杯还是大杯？',
        choices: [
          { text: 'Medium, please.', translation: '中杯，谢谢。', correct: true, feedback: 'Perfect! Short, clear, polite. The "please" makes it sound very natural.' },
          { text: 'Not too big, not too small.', translation: '不太大，不太小。', correct: false, feedback: 'Cute, but vague! The barista needs a specific size. Just say "medium, please."' },
          { text: 'Give me large.', translation: '给我大杯。', correct: false, feedback: '"Give me" sounds demanding. Try "I\'ll have a large, please" or "Large, please."' },
        ],
      },
      {
        npc: 'That\'ll be £3.50. Would you like to pay by card or cash?',
        npcTranslation: '一共3.50英镑。您刷卡还是付现金？',
        choices: [
          { text: 'By card, please.', translation: '刷卡，谢谢。', correct: true, feedback: '"By card" — very natural! You could also say "I\'ll pay by card."' },
          { text: 'I pay with card.', translation: '我用卡付款。', correct: false, feedback: 'Understandable, but more natural to say "I\'ll pay by card" or just "Card, please."' },
          { text: 'Here you are.', translation: '给您。', correct: true, feedback: '"Here you are" — perfect when handing over cash or a card. Very natural English!' },
        ],
      },
    ],
  },
  {
    id: 'zh-en-rp2',
    courseId: 'zh-en',
    scenario: '你在纽约需要向陌生人问路，找到中央公园。',
    emoji: '🌳',
    npcName: 'New Yorker',
    npcEmoji: '🗽',
    turns: [
      {
        npc: 'Hey, you need help?',
        npcTranslation: '嘿，你需要帮助吗？',
        choices: [
          { text: 'Yes! Could you tell me how to get to Central Park?', translation: '是的！你能告诉我怎么去中央公园吗？', correct: true, feedback: '"Could you tell me how to get to...?" — a very polite and natural way to ask for directions.' },
          { text: 'Where is Central Park?', translation: '中央公园在哪里？', correct: true, feedback: 'Direct and clear! This works perfectly well too.' },
          { text: 'I am looking for a park.', translation: '我在找一个公园。', correct: false, feedback: 'Too vague! Be specific: "I\'m looking for Central Park. Do you know where it is?"' },
        ],
      },
      {
        npc: 'Central Park? Yeah sure. Walk three blocks north, then you\'ll see it on your right.',
        npcTranslation: '中央公园？当然。往北走三个街区，然后你会在右边看到它。',
        choices: [
          { text: 'Sorry, which direction is north from here?', translation: '对不起，从这里哪边是北？', correct: true, feedback: 'Great follow-up! It\'s completely natural to ask for clarification. "Which direction is...?" is very useful.' },
          { text: 'I understand. North three blocks. Thank you!', translation: '我明白了。往北走三个街区。谢谢！', correct: true, feedback: 'Excellent! Confirming directions and thanking them — natural and friendly.' },
          { text: 'What is north?', translation: '"North"是什么意思？', correct: false, feedback: 'If you\'re unsure, ask: "Could you point me in the right direction?" Or just follow where they point!' },
        ],
      },
      {
        npc: 'No problem! Enjoy the park — it\'s beautiful today.',
        npcTranslation: '没问题！好好享受公园，今天很美。',
        choices: [
          { text: 'Thanks so much! Have a great day!', translation: '非常感谢！祝你有个美好的一天！', correct: true, feedback: '"Thanks so much!" + "Have a great day!" — the perfect friendly New York farewell!' },
          { text: 'Yes, beautiful. Goodbye.', translation: '是的，很美。再见。', correct: false, feedback: 'A bit flat. Try "It really is! Thank you so much!" to sound more warm and natural.' },
          { text: 'Thank you, I will enjoy it!', translation: '谢谢，我会好好享受的！', correct: true, feedback: 'Enthusiastic and natural — great English!' },
        ],
      },
    ],
  },
];
