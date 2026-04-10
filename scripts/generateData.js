import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const exams = ['CGL', 'CPO', 'CHSL'];
const levels = ['Prelims', 'Mains'];
const years = Array.from({ length: 11 }, (_, i) => 2015 + i);

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid(prefix, st, i) { return `${prefix}_${st.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 6)}_${i}`; }

const englishSubtopics = {
  'Reading Comprehension': [
    { q: "In the passage, the word 'benevolent' most closely means:", o: { A: "Kind and generous", B: "Strict and harsh", C: "Indifferent", D: "Arrogant" }, c: "A" },
    { q: "What is the central idea of the passage?", o: { A: "Importance of education", B: "Value of money", C: "Role of technology", D: "Impact of war" }, c: "A" },
    { q: "The author's tone in the passage can best be described as:", o: { A: "Satirical", B: "Optimistic", C: "Pessimistic", D: "Neutral" }, c: "B" },
    { q: "According to the passage, what is the main cause of environmental degradation?", o: { A: "Industrialization", B: "Agriculture", C: "Tourism", D: "Mining" }, c: "A" },
    { q: "The phrase 'turn over a new leaf' in the passage means:", o: { A: "Start fresh", B: "Read a book", C: "Plant trees", D: "Change pages" }, c: "A" },
  ],
  'Cloze Test': [
    { q: "The government has _____ several measures to control inflation.", o: { A: "taken", B: "took", C: "taking", D: "take" }, c: "A" },
    { q: "She _____ the competition with flying colours.", o: { A: "cleared", B: "clear", C: "clearing", D: "clears" }, c: "A" },
    { q: "The economy is _____ signs of recovery.", o: { A: "showing", B: "shown", C: "show", D: "showed" }, c: "A" },
    { q: "Despite the challenges, the team _____ to deliver results.", o: { A: "managed", B: "manage", C: "managing", D: "manages" }, c: "A" },
    { q: "The project was completed _____ schedule.", o: { A: "ahead of", B: "behind of", C: "front of", D: "before of" }, c: "A" },
  ],
  'Error Spotting': [
    { q: "Find the error: (A) He is / (B) one of the best player / (C) in the team / (D) No error", o: { A: "A", B: "B", C: "C", D: "D" }, c: "B", exp: "'player' should be 'players' after 'one of the'" },
    { q: "Find the error: (A) Each of the boys / (B) have / (C) done their work / (D) No error", o: { A: "A", B: "B", C: "C", D: "D" }, c: "B", exp: "'have' should be 'has' with 'each'" },
    { q: "Find the error: (A) The furniture / (B) in the room / (C) are very old / (D) No error", o: { A: "A", B: "B", C: "C", D: "D" }, c: "C", exp: "'are' should be 'is' - furniture is uncountable" },
    { q: "Find the error: (A) He told to me / (B) that he would / (C) not come tomorrow / (D) No error", o: { A: "A", B: "B", C: "C", D: "D" }, c: "A", exp: "'told to me' should be 'told me'" },
    { q: "Find the error: (A) Neither Ram / (B) nor his friends / (C) was present / (D) No error", o: { A: "A", B: "B", C: "C", D: "D" }, c: "C", exp: "'was' should be 'were' as 'friends' is plural" },
  ],
  'Sentence Improvement': [
    { q: "He has been working here since four years. Replace the underlined part:", o: { A: "for four years", B: "from four years", C: "till four years", D: "No improvement" }, c: "A" },
    { q: "She prefers reading than writing. Replace the underlined:", o: { A: "reading to writing", B: "reading over writing", C: "to read than write", D: "No improvement" }, c: "A" },
    { q: "I am knowing him for years. Replace the underlined:", o: { A: "have known", B: "know", C: "was knowing", D: "No improvement" }, c: "A" },
    { q: "He is more taller than his brother. Replace:", o: { A: "taller", B: "most taller", C: "tallest", D: "No improvement" }, c: "A" },
    { q: "The sceneries here are very beautiful. Replace:", o: { A: "scenery here is", B: "sceneries here is", C: "scenario here are", D: "No improvement" }, c: "A" },
  ],
  'Fill in the Blanks': [
    { q: "He is _____ honest man.", o: { A: "an", B: "a", C: "the", D: "no article" }, c: "A" },
    { q: "She has _____ interest in music.", o: { A: "keen", B: "deep", C: "sharp", D: "high" }, c: "A" },
    { q: "The news _____ true.", o: { A: "is", B: "are", C: "were", D: "have been" }, c: "A" },
    { q: "I look forward _____ meeting you.", o: { A: "to", B: "for", C: "at", D: "in" }, c: "A" },
    { q: "He abstained _____ voting.", o: { A: "from", B: "to", C: "for", D: "against" }, c: "A" },
  ],
  'Para Jumbles': [
    { q: "Arrange: P-The sun rose Q-Birds began to sing R-It was a beautiful morning S-People came out of their homes", o: { A: "RPQS", B: "RQPS", C: "PQRS", D: "QPRS" }, c: "A" },
    { q: "Arrange: P-Education is important Q-It helps in development R-Every child deserves it S-Government should invest more", o: { A: "PRQS", B: "PQRS", C: "RPSQ", D: "QPRS" }, c: "A" },
    { q: "Arrange: P-He went to market Q-He bought vegetables R-He returned home S-He cooked dinner", o: { A: "PQRS", B: "QPSR", C: "PRQS", D: "RSPQ" }, c: "A" },
    { q: "Arrange: P-India is diverse Q-It has many languages R-Unity in diversity is its strength S-People live in harmony", o: { A: "PQSR", B: "QPRS", C: "PRQS", D: "PQRS" }, c: "A" },
    { q: "Arrange: P-Exercise is beneficial Q-It keeps body fit R-Mental health also improves S-Everyone should exercise daily", o: { A: "PQRS", B: "PRQS", C: "SQPR", D: "QPRS" }, c: "A" },
  ],
  'Idioms & Phrases': [
    { q: "Meaning of 'A bolt from the blue':", o: { A: "A sudden shock", B: "A blue bolt", C: "Lightning", D: "A blue sky" }, c: "A" },
    { q: "Meaning of 'To burn the midnight oil':", o: { A: "To work late at night", B: "To waste oil", C: "To set fire", D: "To sleep late" }, c: "A" },
    { q: "Meaning of 'To hit the nail on the head':", o: { A: "To say exactly right thing", B: "To use a hammer", C: "To build something", D: "To hurt someone" }, c: "A" },
    { q: "Meaning of 'A white elephant':", o: { A: "A costly but useless possession", B: "An albino elephant", C: "A rare animal", D: "A gift" }, c: "A" },
    { q: "Meaning of 'To cry over spilt milk':", o: { A: "To regret past mistakes uselessly", B: "To clean a mess", C: "To be sad", D: "To waste food" }, c: "A" },
  ],
  'One Word Substitution': [
    { q: "One who knows everything:", o: { A: "Omniscient", B: "Omnipotent", C: "Omnivore", D: "Omnipresent" }, c: "A" },
    { q: "A person who walks in sleep:", o: { A: "Somnambulist", B: "Insomniac", C: "Hypnotist", D: "Narcissist" }, c: "A" },
    { q: "Government by the rich:", o: { A: "Plutocracy", B: "Democracy", C: "Aristocracy", D: "Monarchy" }, c: "A" },
    { q: "One who eats human flesh:", o: { A: "Cannibal", B: "Carnivore", C: "Herbivore", D: "Omnivore" }, c: "A" },
    { q: "One who speaks many languages:", o: { A: "Polyglot", B: "Linguist", C: "Bilingual", D: "Translator" }, c: "A" },
  ],
  'Synonyms': [
    { q: "Synonym of 'Abundant':", o: { A: "Plentiful", B: "Scarce", C: "Limited", D: "Rare" }, c: "A" },
    { q: "Synonym of 'Benevolent':", o: { A: "Kind", B: "Cruel", C: "Strict", D: "Harsh" }, c: "A" },
    { q: "Synonym of 'Candid':", o: { A: "Frank", B: "Secretive", C: "Diplomatic", D: "Cunning" }, c: "A" },
    { q: "Synonym of 'Diligent':", o: { A: "Hardworking", B: "Lazy", C: "Careless", D: "Idle" }, c: "A" },
    { q: "Synonym of 'Exquisite':", o: { A: "Beautiful", B: "Ugly", C: "Plain", D: "Simple" }, c: "A" },
  ],
  'Antonyms': [
    { q: "Antonym of 'Brave':", o: { A: "Cowardly", B: "Bold", C: "Valiant", D: "Heroic" }, c: "A" },
    { q: "Antonym of 'Ancient':", o: { A: "Modern", B: "Old", C: "Antique", D: "Archaic" }, c: "A" },
    { q: "Antonym of 'Abundant':", o: { A: "Scarce", B: "Plentiful", C: "Ample", D: "Copious" }, c: "A" },
    { q: "Antonym of 'Transparent':", o: { A: "Opaque", B: "Clear", C: "Visible", D: "Obvious" }, c: "A" },
    { q: "Antonym of 'Optimistic':", o: { A: "Pessimistic", B: "Hopeful", C: "Positive", D: "Cheerful" }, c: "A" },
  ],
  'Spelling Correction': [
    { q: "Choose the correctly spelt word:", o: { A: "Accommodation", B: "Accomodation", C: "Acommodation", D: "Acomodation" }, c: "A" },
    { q: "Choose the correctly spelt word:", o: { A: "Bureaucracy", B: "Burocracy", C: "Beauracracy", D: "Beurocracy" }, c: "A" },
    { q: "Choose the correctly spelt word:", o: { A: "Miscellaneous", B: "Miscellanious", C: "Miscellanous", D: "Miscelaneous" }, c: "A" },
    { q: "Choose the correctly spelt word:", o: { A: "Conscientious", B: "Conscientous", C: "Conscentious", D: "Consciencious" }, c: "A" },
    { q: "Choose the correctly spelt word:", o: { A: "Occurrence", B: "Occurence", C: "Ocurrence", D: "Occurrance" }, c: "A" },
  ],
  'Active Passive Voice': [
    { q: "Change to passive: 'She writes a letter.'", o: { A: "A letter is written by her", B: "A letter was written by her", C: "A letter has been written", D: "A letter will be written" }, c: "A" },
    { q: "Change to passive: 'They are playing cricket.'", o: { A: "Cricket is being played by them", B: "Cricket was being played", C: "Cricket has been played", D: "Cricket is played" }, c: "A" },
    { q: "Change to active: 'The book was read by him.'", o: { A: "He read the book", B: "He reads the book", C: "He was reading the book", D: "He has read the book" }, c: "A" },
    { q: "Change to passive: 'The teacher taught the students.'", o: { A: "The students were taught by the teacher", B: "The students are taught", C: "The students have been taught", D: "Students will be taught" }, c: "A" },
    { q: "Change to passive: 'Who broke the window?'", o: { A: "By whom was the window broken?", B: "Who was the window broken by?", C: "The window was broken by who?", D: "Was the window broken?" }, c: "A" },
  ],
  'Direct Indirect Speech': [
    { q: "Change to indirect: He said, 'I am going home.'", o: { A: "He said that he was going home", B: "He said that I am going home", C: "He said that he is going home", D: "He told that he was going home" }, c: "A" },
    { q: "Change to indirect: She said, 'I will come tomorrow.'", o: { A: "She said that she would come the next day", B: "She said that she will come tomorrow", C: "She said she would come tomorrow", D: "She told she will come" }, c: "A" },
    { q: "Change to indirect: He said to me, 'Please help me.'", o: { A: "He requested me to help him", B: "He said me to help him", C: "He told me please help me", D: "He asked me to help him" }, c: "A" },
    { q: "Change to indirect: 'Where are you going?' she asked.", o: { A: "She asked where I was going", B: "She asked where are you going", C: "She asked where I am going", D: "She told where was I going" }, c: "A" },
    { q: "Change to indirect: The teacher said, 'The earth revolves around the sun.'", o: { A: "The teacher said that the earth revolves around the sun", B: "The teacher said the earth revolved around the sun", C: "The teacher told the earth revolves", D: "The teacher said earth will revolve" }, c: "A" },
  ],
};

function generateSubjectData(subject, subtopics, prefix) {
  const questions = [];
  for (const [st, templates] of Object.entries(subtopics)) {
    for (let i = 0; i < 25; i++) {
      const template = templates[i % templates.length];
      const variation = i >= templates.length ? ` (Variation ${Math.floor(i / templates.length) + 1})` : '';
      questions.push({
        id: uid(prefix, st, i + 1),
        subject,
        subtopic: st,
        exam: pick(exams),
        level: pick(levels),
        year: pick(years),
        question: template.q + variation,
        options: template.o,
        correct: template.c,
        explanation: template.exp || `The correct answer is ${template.c}: ${template.o[template.c]}.`,
      });
    }
  }
  return questions;
}

const gkSubtopics = {
  'History': [
    { q: "The Battle of Plassey was fought in which year?", o: { A: "1757", B: "1764", C: "1857", D: "1947" }, c: "A" },
    { q: "Who was the founder of the Maurya dynasty?", o: { A: "Chandragupta Maurya", B: "Ashoka", C: "Bindusara", D: "Chanakya" }, c: "A" },
    { q: "The Quit India Movement was launched in which year?", o: { A: "1942", B: "1940", C: "1945", D: "1947" }, c: "A" },
    { q: "Who is known as the 'Iron Man of India'?", o: { A: "Sardar Vallabhbhai Patel", B: "Jawaharlal Nehru", C: "Subhas Chandra Bose", D: "Bhagat Singh" }, c: "A" },
    { q: "The Treaty of Versailles was signed in which year?", o: { A: "1919", B: "1918", C: "1920", D: "1921" }, c: "A" },
  ],
  'Geography': [
    { q: "Which is the longest river in India?", o: { A: "Ganga", B: "Godavari", C: "Brahmaputra", D: "Yamuna" }, c: "A" },
    { q: "The Tropic of Cancer passes through how many Indian states?", o: { A: "8", B: "6", C: "7", D: "9" }, c: "A" },
    { q: "Which is the smallest continent by area?", o: { A: "Australia", B: "Europe", C: "Antarctica", D: "South America" }, c: "A" },
    { q: "The Chilka Lake is located in which state?", o: { A: "Odisha", B: "Tamil Nadu", C: "Kerala", D: "Andhra Pradesh" }, c: "A" },
    { q: "Which ocean is the deepest?", o: { A: "Pacific", B: "Atlantic", C: "Indian", D: "Arctic" }, c: "A" },
  ],
  'Polity': [
    { q: "How many fundamental rights are there in the Indian Constitution?", o: { A: "6", B: "7", C: "8", D: "5" }, c: "A" },
    { q: "Who is the head of the state in India?", o: { A: "President", B: "Prime Minister", C: "Chief Justice", D: "Speaker" }, c: "A" },
    { q: "Article 370 was related to which state?", o: { A: "Jammu & Kashmir", B: "Punjab", C: "Assam", D: "Nagaland" }, c: "A" },
    { q: "The Panchayati Raj system was introduced by which constitutional amendment?", o: { A: "73rd", B: "74th", C: "42nd", D: "44th" }, c: "A" },
    { q: "Who appoints the Chief Justice of India?", o: { A: "President", B: "Prime Minister", C: "Parliament", D: "Law Minister" }, c: "A" },
  ],
  'Economy': [
    { q: "Which body controls monetary policy in India?", o: { A: "RBI", B: "SEBI", C: "Finance Ministry", D: "NITI Aayog" }, c: "A" },
    { q: "GST was implemented in India in which year?", o: { A: "2017", B: "2016", C: "2018", D: "2015" }, c: "A" },
    { q: "What does GDP stand for?", o: { A: "Gross Domestic Product", B: "Gross Domestic Price", C: "General Domestic Product", D: "Gross Development Product" }, c: "A" },
    { q: "Which Five Year Plan focused on Agriculture for the first time?", o: { A: "First", B: "Second", C: "Third", D: "Fourth" }, c: "A" },
    { q: "NABARD was established in which year?", o: { A: "1982", B: "1980", C: "1985", D: "1990" }, c: "A" },
  ],
  'Science & Technology': [
    { q: "Which planet is known as the Red Planet?", o: { A: "Mars", B: "Jupiter", C: "Venus", D: "Saturn" }, c: "A" },
    { q: "What is the chemical formula of common salt?", o: { A: "NaCl", B: "KCl", C: "CaCl2", D: "MgCl2" }, c: "A" },
    { q: "Who invented the telephone?", o: { A: "Alexander Graham Bell", B: "Thomas Edison", C: "Nikola Tesla", D: "Guglielmo Marconi" }, c: "A" },
    { q: "What is the speed of light in vacuum?", o: { A: "3 × 10⁸ m/s", B: "3 × 10⁶ m/s", C: "3 × 10¹⁰ m/s", D: "3 × 10⁴ m/s" }, c: "A" },
    { q: "DNA stands for:", o: { A: "Deoxyribonucleic Acid", B: "Dinitrogen Acid", C: "Deoxyribose Nucleotide Acid", D: "Dynamic Nucleic Acid" }, c: "A" },
  ],
  'Biology': [
    { q: "The powerhouse of the cell is:", o: { A: "Mitochondria", B: "Nucleus", C: "Ribosome", D: "Golgi body" }, c: "A" },
    { q: "Which vitamin is produced by sunlight?", o: { A: "Vitamin D", B: "Vitamin C", C: "Vitamin A", D: "Vitamin B" }, c: "A" },
    { q: "The largest organ of the human body is:", o: { A: "Skin", B: "Liver", C: "Heart", D: "Brain" }, c: "A" },
    { q: "Photosynthesis takes place in which part of the plant?", o: { A: "Leaves", B: "Roots", C: "Stem", D: "Flowers" }, c: "A" },
    { q: "Which blood group is known as the universal donor?", o: { A: "O negative", B: "AB positive", C: "A positive", D: "B negative" }, c: "A" },
  ],
  'Physics': [
    { q: "The SI unit of force is:", o: { A: "Newton", B: "Joule", C: "Watt", D: "Pascal" }, c: "A" },
    { q: "Who proposed the three laws of motion?", o: { A: "Isaac Newton", B: "Albert Einstein", C: "Galileo Galilei", D: "Archimedes" }, c: "A" },
    { q: "The unit of electrical resistance is:", o: { A: "Ohm", B: "Volt", C: "Ampere", D: "Watt" }, c: "A" },
    { q: "Sound travels fastest in which medium?", o: { A: "Solids", B: "Liquids", C: "Gases", D: "Vacuum" }, c: "A" },
    { q: "The phenomenon of splitting of light into its component colors is called:", o: { A: "Dispersion", B: "Refraction", C: "Reflection", D: "Diffraction" }, c: "A" },
  ],
  'Chemistry': [
    { q: "The pH value of pure water is:", o: { A: "7", B: "6", C: "8", D: "0" }, c: "A" },
    { q: "Which gas is known as laughing gas?", o: { A: "Nitrous oxide", B: "Carbon dioxide", C: "Nitrogen", D: "Oxygen" }, c: "A" },
    { q: "The hardest naturally occurring substance is:", o: { A: "Diamond", B: "Graphite", C: "Quartz", D: "Ruby" }, c: "A" },
    { q: "What is the chemical symbol for Gold?", o: { A: "Au", B: "Ag", C: "Fe", D: "Cu" }, c: "A" },
    { q: "Rust is composed of:", o: { A: "Iron oxide", B: "Iron carbonate", C: "Iron sulphide", D: "Iron chloride" }, c: "A" },
  ],
  'Current Affairs': [
    { q: "Which country hosted the G20 Summit in 2023?", o: { A: "India", B: "Indonesia", C: "Italy", D: "Japan" }, c: "A" },
    { q: "The Paris Agreement is related to:", o: { A: "Climate Change", B: "Trade", C: "Nuclear Weapons", D: "Human Rights" }, c: "A" },
    { q: "ISRO's Chandrayaan-3 landed on which part of the Moon?", o: { A: "South Pole", B: "North Pole", C: "Equator", D: "Far side" }, c: "A" },
    { q: "Which country has the largest population in the world as of 2023?", o: { A: "India", B: "China", C: "USA", D: "Indonesia" }, c: "A" },
    { q: "The headquarters of WHO is located in:", o: { A: "Geneva", B: "New York", C: "London", D: "Paris" }, c: "A" },
  ],
  'Sports': [
    { q: "The term 'Grand Slam' is associated with which sport?", o: { A: "Tennis", B: "Cricket", C: "Football", D: "Hockey" }, c: "A" },
    { q: "Who has won the most Olympic gold medals?", o: { A: "Michael Phelps", B: "Usain Bolt", C: "Carl Lewis", D: "Mark Spitz" }, c: "A" },
    { q: "FIFA World Cup 2022 was held in:", o: { A: "Qatar", B: "Russia", C: "Brazil", D: "France" }, c: "A" },
    { q: "Dronacharya Award is given for excellence in:", o: { A: "Coaching in sports", B: "Playing sports", C: "Sports journalism", D: "Sports administration" }, c: "A" },
    { q: "The national sport of Canada is:", o: { A: "Lacrosse", B: "Ice Hockey", C: "Baseball", D: "Basketball" }, c: "A" },
  ],
  'Books & Authors': [
    { q: "Who wrote 'Wings of Fire'?", o: { A: "APJ Abdul Kalam", B: "Jawaharlal Nehru", C: "Mahatma Gandhi", D: "Rabindranath Tagore" }, c: "A" },
    { q: "'The Discovery of India' was written by:", o: { A: "Jawaharlal Nehru", B: "Mahatma Gandhi", C: "Subhas Bose", D: "BR Ambedkar" }, c: "A" },
    { q: "Who is the author of 'My Experiments with Truth'?", o: { A: "Mahatma Gandhi", B: "Jawaharlal Nehru", C: "Rabindranath Tagore", D: "Sarojini Naidu" }, c: "A" },
    { q: "'Gitanjali' was written by:", o: { A: "Rabindranath Tagore", B: "Bankim Chandra", C: "Premchand", D: "Sarat Chandra" }, c: "A" },
    { q: "Who wrote 'A Brief History of Time'?", o: { A: "Stephen Hawking", B: "Albert Einstein", C: "Isaac Newton", D: "Carl Sagan" }, c: "A" },
  ],
  'Awards & Honours': [
    { q: "The Nobel Prize was instituted in which year?", o: { A: "1901", B: "1900", C: "1895", D: "1910" }, c: "A" },
    { q: "The highest civilian award in India is:", o: { A: "Bharat Ratna", B: "Padma Vibhushan", C: "Padma Bhushan", D: "Padma Shri" }, c: "A" },
    { q: "Who was the first Indian to win the Nobel Prize?", o: { A: "Rabindranath Tagore", B: "CV Raman", C: "Mother Teresa", D: "Amartya Sen" }, c: "A" },
    { q: "The Arjuna Award is given for:", o: { A: "Outstanding sports performance", B: "Bravery", C: "Literature", D: "Science" }, c: "A" },
    { q: "Booker Prize is associated with:", o: { A: "Literature", B: "Peace", C: "Science", D: "Music" }, c: "A" },
  ],
  'Important Days': [
    { q: "World Environment Day is celebrated on:", o: { A: "June 5", B: "March 22", C: "April 22", D: "May 1" }, c: "A" },
    { q: "International Women's Day is observed on:", o: { A: "March 8", B: "March 21", C: "August 15", D: "January 26" }, c: "A" },
    { q: "Republic Day of India is celebrated on:", o: { A: "January 26", B: "August 15", C: "October 2", D: "November 14" }, c: "A" },
    { q: "World Health Day is observed on:", o: { A: "April 7", B: "May 1", C: "June 5", D: "October 24" }, c: "A" },
    { q: "Teachers' Day in India is celebrated on:", o: { A: "September 5", B: "November 14", C: "October 2", D: "January 15" }, c: "A" },
  ],
};

const reasoningSubtopics = {
  'Analogy': [
    { q: "Doctor : Hospital :: Teacher : ?", o: { A: "School", B: "Court", C: "Office", D: "Factory" }, c: "A" },
    { q: "Pen : Writer :: Brush : ?", o: { A: "Painter", B: "Teacher", C: "Dancer", D: "Singer" }, c: "A" },
    { q: "Bird : Nest :: Horse : ?", o: { A: "Stable", B: "Kennel", C: "Den", D: "Burrow" }, c: "A" },
    { q: "Mango : Fruit :: Carrot : ?", o: { A: "Vegetable", B: "Root", C: "Plant", D: "Leaf" }, c: "A" },
    { q: "Eye : See :: Ear : ?", o: { A: "Hear", B: "Taste", C: "Smell", D: "Touch" }, c: "A" },
  ],
  'Classification': [
    { q: "Find the odd one out: Rose, Lotus, Jasmine, Dog", o: { A: "Dog", B: "Rose", C: "Lotus", D: "Jasmine" }, c: "A" },
    { q: "Find the odd one out: 2, 5, 10, 17, 23, 37", o: { A: "23", B: "5", C: "10", D: "37" }, c: "A" },
    { q: "Find the odd one out: Mercury, Venus, Moon, Mars", o: { A: "Moon", B: "Mercury", C: "Venus", D: "Mars" }, c: "A" },
    { q: "Find the odd one out: Shirt, Trouser, Sweater, Table", o: { A: "Table", B: "Shirt", C: "Trouser", D: "Sweater" }, c: "A" },
    { q: "Find the odd one out: January, March, June, July", o: { A: "June", B: "January", C: "March", D: "July" }, c: "A", exp: "June has 30 days, rest have 31." },
  ],
  'Series': [
    { q: "Find the next: 2, 6, 12, 20, 30, ?", o: { A: "42", B: "40", C: "38", D: "44" }, c: "A" },
    { q: "Find the next: 3, 9, 27, 81, ?", o: { A: "243", B: "162", C: "200", D: "189" }, c: "A" },
    { q: "Find the missing: 1, 4, 9, 16, ?, 36", o: { A: "25", B: "20", C: "24", D: "28" }, c: "A" },
    { q: "Find the next: A, C, F, J, ?", o: { A: "O", B: "N", C: "M", D: "L" }, c: "A" },
    { q: "Find the next: 2, 3, 5, 8, 13, ?", o: { A: "21", B: "18", C: "20", D: "19" }, c: "A" },
  ],
  'Coding-Decoding': [
    { q: "If APPLE is coded as ELPPA, how is MANGO coded?", o: { A: "OGNAM", B: "OGANM", C: "NAMGO", D: "GOMAN" }, c: "A" },
    { q: "If CAT = 24, DOG = 26, then BAT = ?", o: { A: "23", B: "25", C: "22", D: "27" }, c: "A" },
    { q: "In a code, COMPUTER is written as RFUVQNPC. How is MEDICINE written?", o: { A: "EOJDJEFM", B: "FDJDJENM", C: "GFEJDFON", D: "NFEJDJEM" }, c: "A" },
    { q: "If RED is coded as 6, GREEN as 10, then BLUE is coded as:", o: { A: "8", B: "6", C: "10", D: "12" }, c: "A" },
    { q: "If in a code '1' means '+', '2' means '-', then 8 1 5 2 3 = ?", o: { A: "10", B: "8", C: "12", D: "6" }, c: "A" },
  ],
  'Blood Relations': [
    { q: "Pointing to a photo, A says 'He is the son of the only son of my grandfather.' Who is the person in the photo to A?", o: { A: "Brother", B: "Father", C: "Uncle", D: "Cousin" }, c: "A" },
    { q: "If A is B's sister, C is B's mother, D is C's father, E is D's mother, then how is A related to D?", o: { A: "Granddaughter", B: "Daughter", C: "Grandmother", D: "Grandfather" }, c: "A" },
    { q: "P is the mother of Q. R is the father of Q. R has three sons. S is S's brother. How is P related to S?", o: { A: "Mother", B: "Sister", C: "Aunt", D: "Cousin" }, c: "A" },
    { q: "A's father is B's son. B has only two children. C is B's daughter. How is A related to C?", o: { A: "Grandson/Granddaughter", B: "Nephew/Niece", C: "Son/Daughter", D: "Cannot determine" }, c: "A" },
    { q: "If X is the husband of Y and Y is the sister of Z, then X is the _____ of Z.", o: { A: "Brother-in-law", B: "Brother", C: "Father", D: "Uncle" }, c: "A" },
  ],
  'Direction Sense': [
    { q: "A man walks 5 km North, then 3 km East, then 5 km South. How far is he from start?", o: { A: "3 km", B: "5 km", C: "8 km", D: "13 km" }, c: "A" },
    { q: "Facing North, I turn 90° clockwise. Which direction am I facing?", o: { A: "East", B: "West", C: "South", D: "North" }, c: "A" },
    { q: "A walks 10m South, turns left, walks 5m. In which direction is he from start?", o: { A: "South-East", B: "South-West", C: "North-East", D: "North-West" }, c: "A" },
    { q: "If you face West and turn 135° anti-clockwise, which direction do you face?", o: { A: "South-East", B: "North-East", C: "South-West", D: "North-West" }, c: "A" },
    { q: "P walks 6km East, then 8km North. What is the shortest distance from start?", o: { A: "10 km", B: "14 km", C: "12 km", D: "8 km" }, c: "A" },
  ],
  'Syllogism': [
    { q: "All dogs are animals. All animals are living beings. Conclusion: All dogs are living beings.", o: { A: "True", B: "False", C: "Cannot determine", D: "Partially true" }, c: "A" },
    { q: "Some cats are dogs. All dogs are animals. Conclusion: Some cats are animals.", o: { A: "True", B: "False", C: "Cannot determine", D: "None" }, c: "A" },
    { q: "No fish is a bird. All sparrows are birds. Conclusion: No sparrow is a fish.", o: { A: "True", B: "False", C: "Uncertain", D: "Partially true" }, c: "A" },
    { q: "All roses are flowers. Some flowers are red. Conclusion: Some roses are red.", o: { A: "Does not follow", B: "Follows", C: "Uncertain", D: "True" }, c: "A" },
    { q: "All pens are pencils. No pencil is eraser. Conclusion: No pen is eraser.", o: { A: "True", B: "False", C: "Cannot determine", D: "Maybe" }, c: "A" },
  ],
  'Puzzles': [
    { q: "5 friends sit in a row. A is to the left of B. C is to the right of D. E is between A and C. Who is in the middle?", o: { A: "E", B: "A", C: "B", D: "C" }, c: "A" },
    { q: "In a family of 6, there are 2 couples. B is wife of A. D is father of F. C is unmarried sister of A. How is F related to A?", o: { A: "Niece/Nephew", B: "Son", C: "Daughter", D: "Brother" }, c: "A" },
    { q: "If 1st Jan 2023 is Sunday, what day is 1st Mar 2023?", o: { A: "Wednesday", B: "Thursday", C: "Friday", D: "Saturday" }, c: "A" },
    { q: "A clock shows 3:15. What is the angle between hour and minute hands?", o: { A: "7.5°", B: "0°", C: "15°", D: "22.5°" }, c: "A" },
    { q: "How many triangles are there in a figure divided by 3 lines from one vertex?", o: { A: "6", B: "4", C: "3", D: "8" }, c: "A" },
  ],
  'Seating Arrangement': [
    { q: "8 persons sit around a circular table. A sits opposite B. C sits to the right of A. Who sits opposite C?", o: { A: "The person to left of B", B: "A", C: "B", D: "Cannot determine" }, c: "A" },
    { q: "In a row of 10, P is 4th from left and Q is 6th from right. How many persons between them?", o: { A: "0", B: "1", C: "2", D: "3" }, c: "A" },
    { q: "6 friends sit in a line. A is 3rd from left. B is to the immediate right of A. C is at one end. Who is at position 4?", o: { A: "B", B: "C", C: "D", D: "A" }, c: "A" },
    { q: "In a circular arrangement, if A faces center and B is to A's left, B faces:", o: { A: "Center", B: "Outside", C: "Left", D: "Right" }, c: "A" },
    { q: "In a row, X is 7th from left and 12th from right. Total persons in the row:", o: { A: "18", B: "19", C: "17", D: "20" }, c: "A" },
  ],
  'Matrix': [
    { q: "In a matrix, find the number that replaces ?: [2,4,8], [3,9,27], [5,25,?]", o: { A: "125", B: "100", C: "75", D: "150" }, c: "A" },
    { q: "In the matrix [1,8,27], [64,125,?], find the missing number:", o: { A: "216", B: "196", C: "256", D: "343" }, c: "A" },
    { q: "Matrix: [2,3,5], [4,5,9], [6,7,?]. Find ?:", o: { A: "13", B: "14", C: "11", D: "15" }, c: "A" },
    { q: "In a 3×3 matrix, each row sums to 15. If first row is [2,7,6], second is [9,5,1], find third row middle:", o: { A: "3", B: "4", C: "5", D: "8" }, c: "A" },
    { q: "Matrix: [4,16,64], [3,9,27], [7,49,?]. Find ?:", o: { A: "343", B: "256", C: "512", D: "125" }, c: "A" },
  ],
  'Venn Diagram': [
    { q: "In a class, 25 play cricket, 20 play football, 10 play both. How many play at least one sport?", o: { A: "35", B: "45", C: "55", D: "30" }, c: "A" },
    { q: "If 60% students pass in Maths, 70% in English, and 50% in both. What % fail in both?", o: { A: "20%", B: "30%", C: "10%", D: "40%" }, c: "A" },
    { q: "Which diagram represents the relationship: Dogs, Pets, Animals?", o: { A: "Dogs inside Pets inside Animals", B: "Three separate circles", C: "Dogs equals Animals", D: "All overlapping equally" }, c: "A" },
    { q: "In a group of 100, 60 like tea, 40 like coffee, 25 like both. How many like neither?", o: { A: "25", B: "35", C: "15", D: "20" }, c: "A" },
    { q: "Three sets A, B, C have 10, 12, 8 elements. A∩B=3, B∩C=4, A∩C=2, A∩B∩C=1. Find A∪B∪C:", o: { A: "22", B: "30", C: "25", D: "20" }, c: "A" },
  ],
  'Non-Verbal Reasoning': [
    { q: "Find the figure that completes the pattern: Square rotates 45° clockwise each step. Next?", o: { A: "Diamond shape", B: "Circle", C: "Triangle", D: "Hexagon" }, c: "A" },
    { q: "Which figure is the mirror image of 'b' when mirror is placed on the right?", o: { A: "d", B: "p", C: "q", D: "b" }, c: "A" },
    { q: "In a paper folding sequence, a circle is cut at the fold. When unfolded, how many circles appear?", o: { A: "2", B: "1", C: "4", D: "3" }, c: "A" },
    { q: "Which figure comes next in the series: ○, ○○, ○○○, ?", o: { A: "○○○○", B: "○○", C: "○○○○○", D: "○" }, c: "A" },
    { q: "A cube is painted red on all faces and cut into 27 smaller cubes. How many have exactly one face painted?", o: { A: "6", B: "8", C: "12", D: "1" }, c: "A" },
  ],
  'Mirror Image': [
    { q: "The mirror image of the word 'AMBULANCE' when mirror is in front is:", o: { A: "ECNALUBMA (reversed)", B: "AMBULANCE", C: "ECNALUMBA", D: "None" }, c: "A" },
    { q: "When a mirror is placed at the right side, the mirror image of 3:15 on a clock would show:", o: { A: "8:45", B: "9:45", C: "3:15", D: "12:45" }, c: "A" },
    { q: "The mirror image of number 218 when mirror is placed below:", o: { A: "218 (inverted)", B: "812", C: "281", D: "128" }, c: "A" },
    { q: "Which letter looks the same in its mirror image (vertical mirror)?", o: { A: "A", B: "B", C: "F", D: "G" }, c: "A" },
    { q: "If 'HELLO' is written and a mirror is placed on the right, the image reads:", o: { A: "OLLEH (reversed)", B: "HELLO", C: "OHELLL", D: "LEHOL" }, c: "A" },
  ],
  'Counting Figures': [
    { q: "How many triangles are there in a triangle divided by a line from apex to base?", o: { A: "3", B: "2", C: "4", D: "1" }, c: "A" },
    { q: "Count the number of squares in a 2×2 grid:", o: { A: "5", B: "4", C: "8", D: "9" }, c: "A" },
    { q: "How many straight lines are needed to draw the figure of a rectangle?", o: { A: "4", B: "3", C: "5", D: "6" }, c: "A" },
    { q: "In a figure made of 4 triangles sharing a common vertex, total triangles including combinations:", o: { A: "8", B: "4", C: "6", D: "10" }, c: "A" },
    { q: "Count rectangles in a 3×2 grid:", o: { A: "18", B: "12", C: "15", D: "24" }, c: "A" },
  ],
  'Mathematical Operations': [
    { q: "If '+' means '×', '-' means '÷', '×' means '-', '÷' means '+'. Find: 6 + 3 ÷ 12 × 4 - 2 = ?", o: { A: "24", B: "18", C: "12", D: "30" }, c: "A" },
    { q: "If '>' means '+', '<' means '-', '+' means '÷', '-' means '×'. Find: 12 - 5 > 3 < 1 + 2 = ?", o: { A: "62.5", B: "60", C: "65", D: "70" }, c: "A" },
    { q: "If P denotes '×', Q denotes '-', R denotes '÷', S denotes '+'. Find: 18 R 3 S 4 P 2 Q 5 = ?", o: { A: "9", B: "7", C: "11", D: "13" }, c: "A" },
    { q: "Which mathematical sign should replace ? : 5 ? 3 ? 8 = 23", o: { A: "× and +", B: "+ and ×", C: "- and +", D: "+ and -" }, c: "A" },
    { q: "If 2 * 3 = 13, 3 * 4 = 25, then 4 * 5 = ?", o: { A: "41", B: "36", C: "45", D: "29" }, c: "A" },
  ],
};

const englishData = generateSubjectData('English', englishSubtopics, 'e');
const gkData = generateSubjectData('GK', gkSubtopics, 'g');
const reasoningData = generateSubjectData('Reasoning', reasoningSubtopics, 'r');

const dataDir = path.join(__dirname, '..', 'src', 'data');

fs.writeFileSync(path.join(dataDir, 'english.json'), JSON.stringify(englishData, null, 2));
fs.writeFileSync(path.join(dataDir, 'gk.json'), JSON.stringify(gkData, null, 2));
fs.writeFileSync(path.join(dataDir, 'reasoning.json'), JSON.stringify(reasoningData, null, 2));

console.log(`Generated ${englishData.length} English questions`);
console.log(`Generated ${gkData.length} GK questions`);
console.log(`Generated ${reasoningData.length} Reasoning questions`);
