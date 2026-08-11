import { Recipe, Guide } from '../types';

export const recipes: Recipe[] = [
  {
    id: 'spray-multiuso',
    title: 'Spray Multiuso Aceto & Limone',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1¼ tazza d\'acqua (distillata o filtrata)',
      '½ tazza di aceto bianco',
      '10-15 gocce di olio essenziale di limone',
      'Uso: Spruzzare su superfici rigide, banconi, e piastrelle. Asciugare con panno in microfibra.'
    ]
  },
  {
    id: 'sink-scrub-abrasivo',
    title: 'Scrub Abrasivo Bicarbonato',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '2 tazze di bicarbonato di sodio',
      '20 gocce di olio essenziale al limone o tea tree',
      'Sapone di Castiglia (da aggiungere al momento)',
      'Uso: Cospargere nel lavandino, aggiungere qualche goccia di sapone, strofinare e risciacquare.'
    ]
  },
  {
    id: 'detergente-vetri-menta',
    title: 'Detergente Vetri all\'Alcol e Menta',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1½ tazza d\'acqua',
      '1½ cucchiaio di aceto bianco',
      '1½ cucchiaio di alcool etilico (rubbing alcohol)',
      '3 gocce di olio essenziale alla menta piperita',
      'Uso: Spruzzare su vetri e specchi per una pulizia senza aloni.'
    ]
  },
  {
    id: 'lucidante-acciaio',
    title: 'Detergente & Lucidante Acciaio',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      'Acqua in un flacone spray',
      'Qualche goccia di detersivo per piatti (per pulire)',
      'Olio d\'oliva o olio minerale (per lucidare)',
      'Uso: Pulire prima con acqua saponata. Asciugare. Applicare una goccia d\'olio su un panno e lucidare seguendo le venature dell\'acciaio.'
    ]
  },
  {
    id: 'polvere-materasso',
    title: 'Polvere Rinfrescante Bicarbonato & Lavanda',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1 tazza di bicarbonato di sodio',
      '10-15 gocce di olio essenziale di lavanda',
      'Uso: Cospargere su tappeti o materassi. Lasciare agire per 15-30 minuti, quindi aspirare accuratamente.'
    ]
  },
  {
    id: 'detergente-parquet',
    title: 'Detergente Parquet & Laminato',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '1 tazza d\'acqua calda',
      '½ tazza di aceto bianco',
      '1-2 gocce di detersivo per piatti delicato',
      '5 gocce di olio essenziale (opzionale)',
      'Uso: Inumidire leggermente il panno in microfibra. Non bagnare eccessivamente il legno.'
    ]
  },
  {
    id: 'pasta-fughe',
    title: 'Pasta Pulizia Fughe Bicarbonato & Perossido',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '½ tazza di bicarbonato di sodio',
      '¼ tazza di perossido di idrogeno (acqua ossigenata al 3%)',
      '1 cucchiaino di sapone per piatti',
      'Uso: Applicare sulle fughe, lasciare agire 5-10 minuti, strofinare con uno spazzolino e risciacquare.'
    ]
  },
  {
    id: 'sbiancante-bucato',
    title: 'Sbiancante Bucato Fai-da-Te',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '½ tazza di perossido di idrogeno (acqua ossigenata)',
      '½ tazza di bicarbonato di sodio (aggiunto al lavaggio)',
      'Uso: Aggiungere direttamente nel cestello o nella vaschetta per rinfrescare i bianchi senza candeggina.'
    ]
  },
  {
    id: 'nutriente-pelle',
    title: 'Nutriente Pelle e Divani',
    category: 'Detergenti Fai-da-te',
    ingredients: [
      '¼ tazza di olio d\'oliva o olio di lino',
      '½ tazza di aceto bianco',
      'Uso: Agitare bene. Spruzzare su un panno morbido, strofinare sulla pelle e rimuovere l\'eccesso con un panno asciutto.'
    ]
  }
];

export const guides: Guide[] = [
  {
    id: 'lavastoviglie-deep',
    title: 'Pulizia Profonda Lavastoviglie',
    category: 'Cucina',
    duration: '20 min',
    steps: [
      { step: 1, description: 'Rimuovi il cestello inferiore per accedere al filtro.' },
      { step: 2, description: 'Estrai il filtro e lavalo nel lavandino con acqua calda e sapone per piatti usando uno spazzolino.' },
      { step: 3, description: 'Rimetti il filtro in posizione.' },
      { step: 4, description: 'Versa 1 tazza di aceto bianco in una ciotola posizionata sul cestello superiore.' },
      { step: 5, description: 'Avvia un ciclo di lavaggio ad alta temperatura a vuoto.' },
      { step: 6, description: 'Asciuga i bordi esterni e le guarnizioni con un panno umido.' }
    ]
  },
  {
    id: 'lavatrice-sanitize',
    title: 'Igienizzazione Lavatrice',
    category: 'Lavanderia',
    duration: '15 min + Ciclo',
    steps: [
      { step: 1, description: 'Pulisci la guarnizione in gomma dell\'oblò con panno in microfibra e spray multiuso, rimuovendo sporco e capelli.' },
      { step: 2, description: 'Estrai il cassetto dei detersivi, lavalo nel lavandino e asciugalo.' },
      { step: 3, description: 'Pulisci l\'alloggiamento del cassetto con uno spazzolino.' },
      { step: 4, description: 'Versa 2 tazze di aceto bianco direttamente nel cestello vuoto.' },
      { step: 5, description: 'Avvia il ciclo di lavaggio più caldo e lungo (es. Cotone 90° o ciclo Pulizia Cestello).' },
      { step: 6, description: 'Lascia lo sportello aperto per far asciugare completamente l\'interno.' }
    ]
  },
  {
    id: 'forno-revival',
    title: 'Pulizia Forno e Piano Cottura',
    category: 'Cucina',
    duration: '40 min',
    steps: [
      { step: 1, description: 'Rimuovi le griglie dal forno e mettile a bagno in acqua calda e detersivo piatti.' },
      { step: 2, description: 'Prepara una pasta densa con bicarbonato di sodio e poca acqua.' },
      { step: 3, description: 'Spalma la pasta all\'interno del forno (evitando le serpentine) e sul vetro. Lascia agire 20-30 minuti.' },
      { step: 4, description: 'Spruzza dell\'aceto bianco sulla pasta di bicarbonato per farla frizzare e sciogliere il grasso.' },
      { step: 5, description: 'Rimuovi la pasta con una spugna umida, risciacquando frequentemente.' },
      { step: 6, description: 'Pulisci il piano cottura con spray multiuso o pasta di bicarbonato per le macchie ostinate.' },
      { step: 7, description: 'Asciuga e reinserisci le griglie pulite.' }
    ]
  },
  {
    id: 'microonde-vapore',
    title: 'Metodo Vapore Limone per Microonde',
    category: 'Cucina',
    duration: '10 min',
    steps: [
      { step: 1, description: 'Riempi una ciotola di vetro adatta al microonde con 1 tazza d\'acqua e fette di mezzo limone (o 2 cucchiai di aceto).' },
      { step: 2, description: 'Avvia il microonde alla massima potenza per 3-5 minuti, fino a far bollire l\'acqua.' },
      { step: 3, description: 'Lascia lo sportello chiuso per altri 5 minuti per permettere al vapore di ammorbidire lo sporco.' },
      { step: 4, description: 'Apri lo sportello con attenzione e rimuovi la ciotola usando un guanto da forno.' },
      { step: 5, description: 'Estrai il piatto rotante e lavalo nel lavandino.' },
      { step: 6, description: 'Passa l\'interno del microonde con un panno in microfibra asciutto o leggermente umido. Lo sporco verrà via facilmente.' }
    ]
  },
  {
    id: 'materasso-sanitize',
    title: 'Igienizzazione e Rotazione Materasso',
    category: 'Tessili & Divani',
    duration: '30 min',
    steps: [
      { step: 1, description: 'Rimuovi tutte le lenzuola, coperte e coprimaterasso per lavarli.' },
      { step: 2, description: 'Passa l\'aspirapolvere su tutta la superficie del materasso usando la bocchetta per imbottiti.' },
      { step: 3, description: 'Cospargi uniformemente la Polvere Rinfrescante Bicarbonato & Lavanda sul materasso.' },
      { step: 4, description: 'Lascia agire la polvere per 15-30 minuti per assorbire odori e umidità.' },
      { step: 5, description: 'Aspira accuratamente tutta la polvere dal materasso.' },
      { step: 6, description: 'Ruota il materasso di 180 gradi (testa-piedi) per un\'usura uniforme.' }
    ]
  },
  {
    id: 'battiscopa-quick',
    title: 'Pulizia Rapida Battiscopa e Porte',
    category: 'Altro',
    duration: '15 min',
    steps: [
      { step: 1, description: 'Passa l\'aspirapolvere con la spazzola lungo tutti i battiscopa per rimuovere la polvere superficiale.' },
      { step: 2, description: 'Prepara un secchio con acqua calda e 2 gocce di detersivo per piatti.' },
      { step: 3, description: 'Inumidisci un panno in microfibra nella soluzione e strizzalo bene.' },
      { step: 4, description: 'Passa il panno sui battiscopa per rimuovere segni neri e sporco ostinato.' },
      { step: 5, description: 'Con lo stesso panno, pulisci maniglie delle porte, cornici e interruttori della luce.' }
    ]
  },
  {
    id: 'frigorifero-deep',
    title: 'Organizzazione e Pulizia Frigorifero',
    category: 'Cucina',
    duration: '30 min',
    steps: [
      { step: 1, description: 'Svuota completamente un ripiano alla volta o l\'intero frigorifero se hai spazio sui banconi.' },
      { step: 2, description: 'Elimina i cibi scaduti o avariati.' },
      { step: 3, description: 'Rimuovi i cassetti estraibili e lavali nel lavandino con acqua tiepida e sapone.' },
      { step: 4, description: 'Spruzza lo Spray Multiuso (o acqua e aceto) sui ripiani interni e asciuga con microfibra.' },
      { step: 5, description: 'Pulisci le guarnizioni delle porte con uno spazzolino.' },
      { step: 6, description: 'Rimetti il cibo in modo logico (es. carne in basso, latticini al centro) e reinserisci i cassetti puliti.' }
    ]
  },
  {
    id: 'macchina-caffe',
    title: 'Decalcificazione Macchina del Caffè',
    category: 'Cucina',
    duration: '20 min',
    steps: [
      { step: 1, description: 'Rimuovi il filtro del caffè usato e svuota la caraffa.' },
      { step: 2, description: 'Riempi il serbatoio con metà acqua fredda e metà aceto bianco.' },
      { step: 3, description: 'Avvia il ciclo di infusione e fermalo a metà. Lascia riposare per 30 minuti per sciogliere il calcare.' },
      { step: 4, description: 'Riaccendi la macchina e fai terminare il ciclo.' },
      { step: 5, description: 'Svuota la caraffa e sciacquala.' },
      { step: 6, description: 'Esegui 2 o 3 cicli completi di infusione utilizzando solo acqua fresca e pulita per rimuovere ogni traccia di aceto.' }
    ]
  },
  {
    id: 'filtri-aria',
    title: 'Filtri Aria e Bocchette (Mensile)',
    category: 'Altro',
    duration: '15 min',
    steps: [
      { step: 1, description: 'Spegni l\'impianto di condizionamento o riscaldamento.' },
      { step: 2, description: 'Usa l\'aspirapolvere con accessorio a spazzola per rimuovere la polvere dalle grate e bocchette di ventilazione.' },
      { step: 3, description: 'Apri il pannello principale per accedere ai filtri dell\'aria.' },
      { step: 4, description: 'Sostituisci il filtro usa e getta con uno nuovo (o lava quello riutilizzabile e fallo asciugare completamente).' },
      { step: 5, description: 'Rimetti il coperchio, accendi l\'impianto e segna la data per il prossimo mese.' }
    ]
  },
  {
    id: 'lampadari-ventilatori',
    title: 'Lampadari e Ventilatori a Soffitto',
    category: 'Altro',
    duration: '15 min',
    steps: [
      { step: 1, description: 'Assicurati che l\'interruttore della luce e del ventilatore sia spento e fermo.' },
      { step: 2, description: 'Prepara una scala stabile sotto il lampadario o ventilatore.' },
      { step: 3, description: 'Usa un piumino allungabile in microfibra o la tecnica della "federa" (infila una vecchia federa sulla pala del ventilatore e tira per catturare la polvere senza farla cadere a terra).' },
      { step: 4, description: 'Spruzza un panno in microfibra con detergente multiuso e pulisci la struttura del lampadario e le lampadine (a freddo).' },
      { step: 5, description: 'Passa l\'aspirapolvere a terra per raccogliere l\'eventuale polvere caduta.' }
    ]
  },
  {
    id: 'muri-interruttori',
    title: 'Muri e Interruttori',
    category: 'Altro',
    duration: '10 min',
    steps: [
      { step: 1, description: 'Prepara un panno in microfibra pulito e leggermente umido con acqua.' },
      { step: 2, description: 'Per i muri: passa delicatamente il panno sulle macchie visibili (ditate, segni neri). Usa una gomma magica per i segni ostinati.' },
      { step: 3, description: 'Per gli interruttori: spruzza il disinfettante o detergente sul panno (MAI direttamente sull\'interruttore per evitare cortocircuiti).' },
      { step: 4, description: 'Strofina accuratamente tutte le placchette degli interruttori di casa.' }
    ]
  },
  {
    id: 'routine-15-express',
    title: 'Routine 15 Minuti Express',
    category: 'Speed Cleaning',
    duration: '15 min',
    steps: [
      { step: 1, description: 'Quick sweep: spazza rapidamente i pavimenti delle stanze principali.' },
      { step: 2, description: 'Surface wipe: passa un panno in microfibra con spray multiuso sulle superfici a vista.' },
      { step: 3, description: 'Clutter clear: raccogli rapidamente in un cestino gli oggetti fuori posto per liberare spazio.' }
    ]
  },
  {
    id: 'ospiti-inattesi',
    title: 'Pulizia Ospiti Inattesi (10 Min)',
    category: 'Speed Cleaning',
    duration: '10 min',
    steps: [
      { step: 1, description: 'Quick bathroom wipe: pulisci velocemente lavandino, specchio e WC con salviette o spray.' },
      { step: 2, description: 'Entryway tidy: riordina giacche e scarpe all\'ingresso per un aspetto accogliente.' },
      { step: 3, description: 'Trash removal: butta l\'immondizia visibile e cambia i sacchetti pieni.' }
    ]
  },
  {
    id: 'igienizzazione-quotidiana-bagno',
    title: 'Igienizzazione Quotidiana Bagno',
    category: 'Bagno',
    duration: '5 min',
    steps: [
      { step: 1, description: 'Toilet bowl: pulisci rapidamente l\'interno del WC con lo scopino.' },
      { step: 2, description: 'Sink touch-up: passa una spugna o salvietta sul lavandino e rimuovi tracce di dentifricio.' },
      { step: 3, description: 'Mirror: pulisci eventuali schizzi dallo specchio con il detergente vetri.' }
    ]
  },
  {
    id: 'pulizia-profonda-doccia',
    title: 'Pulizia Profonda Doccia & Piastrelle',
    category: 'Bagno',
    duration: '20 min',
    steps: [
      { step: 1, description: 'Soap scum removal: applica la pasta di bicarbonato o sgrassatore e strofina i residui di sapone dai vetri e pareti.' },
      { step: 2, description: 'Glass squeegee: risciacqua e usa un tergivetri per asciugare perfettamente le pareti del box doccia senza lasciare aloni.' },
      { step: 3, description: 'Grout scrubbing: strofina energicamente le fughe con uno spazzolino e acqua ossigenata per sbiancarle.' }
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
