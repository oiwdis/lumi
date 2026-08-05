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
];
