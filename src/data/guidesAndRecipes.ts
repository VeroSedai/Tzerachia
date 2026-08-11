import { Recipe, Guide } from '../types';

export const recipes: Recipe[] = [
  {
    id: 'spray-multiuso',
    title: 'Spray Multiuso (All-Purpose Cleaner)',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1¼ tazza d\'acqua',
      '½ tazza di aceto bianco',
      '10 gocce di olio essenziale (limone/eucalipto)',
      'Uso: superfici generali, banconi, piastrelle'
    ]
  },
  {
    id: 'detergente-marmo-granito',
    title: 'Detergente Marmo & Granito',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1½ tazza d\'acqua',
      '3 cucchiai di alcool etilico',
      '1 cucchiaino di sapone di Castiglia (o detersivo piatti)',
      'Uso: pietra naturale'
    ]
  },
  {
    id: 'sink-scrub',
    title: 'Sink Scrub per Lavandini',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '2 tazze di bicarbonato di sodio',
      '20 gocce di olio essenziale di limone o garofano',
      'Sapone per piatti (al momento)',
      'Uso: pulizia profonda e lucidatura lavelli'
    ]
  },
  {
    id: 'detergente-vetri',
    title: 'Detergente Vetri e Specchi',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1½ tazza d\'acqua',
      '1½ cucchiaio di aceto bianco',
      '1½ cucchiaio di alcool etilico',
      '3 gocce di olio essenziale',
      'Uso: vetri senza aloni'
    ]
  },
  {
    id: 'spray-antimuffa',
    title: 'Spray Disinfettante Antimuffa',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1 tazza d\'acqua',
      '½ tazza di acqua ossigenata (hydrogen peroxide 3%)',
      '20 gocce di Tea Tree oil',
      'Uso: fughe piastrelle, box doccia'
    ]
  },
  {
    id: 'detergente-sanitari',
    title: 'Detergente Profondo per Sanitari & Bagno',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1 tazza di bicarbonato',
      '½ tazza di sapone di Castiglia liquido',
      '½ tazza d\'acqua',
      '2 cucchiai di aceto bianco',
      'Uso: vasca, doccia, sanitari'
    ]
  },
  {
    id: 'lucidante-acciaio',
    title: 'Lucidante Acciaio Inox',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '2 cucchiai di olio d\'oliva o olio di cocco liquido',
      'Qualche goccia di succo di limone su panno in microfibra',
      'Uso: elettrodomestici in acciaio'
    ]
  }
];

export const guides: Guide[] = [
  {
    id: 'speed-cleaning',
    title: 'Speed Cleaning - Qualsiasi Stanza',
    category: 'Speed Cleaning',
    duration: '10-15 min',
    steps: [
      { step: 1, description: 'Imposta il timer a 10-15 minuti.' },
      { step: 2, description: 'Raccogli e getta la spazzatura visibile.' },
      { step: 3, description: 'Raccogli in un cestino gli oggetti fuori posto da riposizionare dopo.' },
      { step: 4, description: 'Spruzza e pulisci le superfici rigide dall\'alto verso il basso.' },
      { step: 5, description: 'Spolvera rapidamente i mobili.' },
      { step: 6, description: 'Passa aspirapolvere o scopa nelle zone di passaggio.' },
      { step: 7, description: 'Sistemare cuscini, coperte e asciugamani puliti.' }
    ]
  },
  {
    id: 'speed-organizing',
    title: 'Speed Organizing - Riordino Rapido',
    category: 'Speed Cleaning',
    steps: [
      { step: 1, description: 'Svuota completamente lo spazio (cassetto, cassettoniera o ripiano).' },
      { step: 2, description: 'Pulisci la superficie vuota con un panno umido.' },
      { step: 3, description: 'Separa gli oggetti in 4 contenitori: Cestina (Toss), Dona/Vendi (Donate), Sposta (Relocate), Tieni (Keep).' },
      { step: 4, description: 'Raggruppa gli oggetti "Tieni" per categoria omogenea.' },
      { step: 5, description: 'Riponi gli oggetti in modo ordinato usando divisori o contenitori.' }
    ]
  },
  {
    id: 'cucina-profonda',
    title: 'Pulizia Approfondita della Cucina & Elettrodomestici',
    category: 'Cucina',
    steps: [
      { step: 1, description: 'Sgombera e disinfetta i banconi da lavoro.' },
      { step: 2, description: 'Pulisci il forno microonde scaldando una ciotola con acqua e limone per 3 minuti e strofinando.' },
      { step: 3, description: 'Pulisci il frigorifero rimuovendo i cibi scaduti e passando i ripiani con spray multiuso.' },
      { step: 4, description: 'Disinfetta il lavello applicando il Sink Scrub e strofinando con spugna morbida.' },
      { step: 5, description: 'Pulisci gli elettrodomestici in acciaio con panno in microfibra.' },
      { step: 6, description: 'Passa l\'aspirapolvere e lava il pavimento.' }
    ]
  },
  {
    id: 'bagno-completa',
    title: 'Pulizia Completa del Bagno',
    category: 'Bagno',
    steps: [
      { step: 1, description: 'Spruzza il disinfettante su esterno del WC, lavandino e doccia/vasca.' },
      { step: 2, description: 'Versa il detergente specifico all\'interno della tazza del WC.' },
      { step: 3, description: 'Lascia agire per 10 minuti.' },
      { step: 4, description: 'Strofina l\'interno del WC con lo scopino e tira lo sciacquone.' },
      { step: 5, description: 'Pulisci vetri, specchi e rubinetteria con il detergente vetri.' },
      { step: 6, description: 'Pulisci le superfici esterne dei sanitari dall\'alto verso il basso.' },
      { step: 7, description: 'Svuota il cestino e lava il pavimento.' }
    ]
  },
  {
    id: 'igienizzazione-tessili',
    title: 'Igienizzazione Tessili, Cuscini & Materasso',
    category: 'Tessili & Divani',
    steps: [
      { step: 1, description: 'Rimuovi la biancheria e avvia un carico di lavatrice.' },
      { step: 2, description: 'Passa l\'aspirapolvere con bocchetta per imbottiti sul materasso o divano.' },
      { step: 3, description: 'Cospergi il bicarbonato sul materasso/divano e lascia agire 30 minuti per assorbire gli odori.' },
      { step: 4, description: 'Aspira accuratamente il bicarbonato residuo.' },
      { step: 5, description: 'Ruota il materasso di 180 gradi per garantirne un’usura uniforme.' }
    ]
  },
  {
    id: 'finestre-battiscopa',
    title: 'Pulizia Finestre e Battiscopa',
    category: 'Altro',
    steps: [
      { step: 1, description: 'Spolvera i telai delle finestre e i battiscopa con un panno catturapolvere.' },
      { step: 2, description: 'Spruzza il detergente vetri sui vetri e pulisci con panno in microfibra con movimenti a \'S\'.' },
      { step: 3, description: 'Ripassa i battiscopa con un panno umido caldo per rimuovere macchie accumulate.' }
    ]
  }
];

export const challengeData = (day: number) => {
  const isWeekend = day % 7 === 6 || day % 7 === 0;
  if (isWeekend) {
    return [
      {
        id: `c-${day}-main`,
        title: 'Recupero e Riposo',
        subtasks: [
          { id: `c-${day}-s1`, title: 'Svolgi solo i 5 Daily Tasks', completed: false },
          { id: `c-${day}-s2`, title: 'Riposati e goditi la casa pulita', completed: false }
        ]
      }
    ];
  }
  
  const focusAreas = ['Soggiorno', 'Cucina', 'Bagno', 'Stanza da Letto', 'Ingresso'];
  const focusIndex = (day - 1) % 5;
  const area = focusAreas[focusIndex];

  return [
    {
      id: `c-${day}-daily`,
      title: 'Completare i 5 Daily Tasks',
      subtasks: [
        { id: `c-${day}-d1`, title: 'Rifare i letti', completed: false },
        { id: `c-${day}-d2`, title: 'Controllare i pavimenti', completed: false },
        { id: `c-${day}-d3`, title: 'Pulire i banconi', completed: false },
        { id: `c-${day}-d4`, title: 'Riordinare (De-clutter)', completed: false },
        { id: `c-${day}-d5`, title: 'Fare il bucato', completed: false }
      ]
    },
    {
      id: `c-${day}-focus`,
      title: `Focus Area: ${area}`,
      subtasks: [
        { id: `c-${day}-f1`, title: 'Spolverare tutte le superfici', completed: false },
        { id: `c-${day}-f2`, title: 'Pulire i battiscopa', completed: false },
        { id: `c-${day}-f3`, title: 'Passare l\'aspirapolvere in ogni angolo', completed: false },
        { id: `c-${day}-f4`, title: 'Riordinare eventuali oggetti fuori posto', completed: false }
      ]
    }
  ];
};
