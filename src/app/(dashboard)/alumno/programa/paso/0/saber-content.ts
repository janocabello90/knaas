export type LessonSection = {
  type: "heading" | "paragraph" | "quote" | "callout" | "list" | "warning" | "separator";
  content?: string;
  items?: string[]; // for list type
  icon?: "pin" | "bulb" | "warning" | "flag"; // for callout type
};

export type SaberLesson = {
  id: number;
  title: string;
  subtitle: string;
  readingTime: string;
  sections: LessonSection[];
};

export const SABER_LESSONS: SaberLesson[] = [
  {
    id: 0,
    title: "Bienvenido/a a ACTIVA",
    subtitle: "Todo lo que necesitas saber para empezar con el pie derecho",
    readingTime: "45-55 minutos",
    sections: [
      {
        type: "callout",
        content: "Esta lección es tu punto de partida. Léela con calma antes de arrancar cualquier paso del programa. Aquí encontrarás el mapa completo de lo que tienes por delante, cómo funciona la plataforma y por qué cada pieza está diseñada de la manera en que está.",
        icon: "pin"
      },
      {
        type: "heading",
        content: "1. Estás aquí. Esto ya importa."
      },
      {
        type: "paragraph",
        content: "La decisión que has tomado al unirte a ACTIVA es, en sí misma, un acto estratégico. La mayoría de los fisioterapeutas que montan su clínica aprenden sobre la marcha, a golpe de error, solos. Tú has decidido hacerlo de otra manera. Y eso, antes incluso de arrancar, ya te sitúa en una posición diferente."
      },
      {
        type: "paragraph",
        content: "Este programa es el resultado de más de 20 años gestionando clínicas, equivocándonos, aprendiendo, auditando más de 1.000 negocios de fisioterapia de todos los tamaños, y destilando todo ese conocimiento en un sistema que pueda ayudarte a construir —o transformar— tu clínica de una manera ordenada, con criterio y sin tener que inventarte el camino desde cero."
      },
      {
        type: "paragraph",
        content: "Pero antes de entrar en materia, quiero dejarte claras tres cosas que definen cómo funciona ACTIVA:"
      },
      {
        type: "paragraph",
        content: "Primero: no estamos aquí para decirte lo que tienes que hacer. Estamos aquí para darte el criterio, las herramientas y el acompañamiento para que seas tú quien tome las mejores decisiones para tu negocio específico. Tu clínica es tuya. Nuestro trabajo es que tengas el juicio y los recursos para llevarla donde quieres llevarla."
      },
      {
        type: "paragraph",
        content: "Segundo: el conocimiento sin implementación no sirve de nada. ACTIVA está diseñado desde el primer paso para que la acción sea inevitable. No es un curso que se lee y se archiva. Es un proceso que se vive, se aplica y se construye semana a semana."
      },
      {
        type: "paragraph",
        content: "Tercero: no estás solo. A lo largo de todo el programa tendrás mentoría, comunidad, acompañamiento de IA y soporte directo. La soledad del emprendedor es uno de los grandes frenos. Aquí eso no existe."
      },
      {
        type: "quote",
        content: "Soy fisio como tú. Y hubo un día en que yo estaba exactamente donde estás ahora. Lo que aprenderás aquí es lo que a mí me hubiera cambiado las cosas años antes."
      },
      {
        type: "heading",
        content: "2. Cómo aprende y crece un fisioempresario: la metodología SABER · DECIDIR · ACTIVA"
      },
      {
        type: "paragraph",
        content: "Cada paso del programa sigue siempre la misma secuencia. No es casualidad: es el ciclo que convierte el conocimiento en resultados reales. Entenderlo bien desde el principio te ayudará a sacar el máximo de cada semana."
      },
      {
        type: "heading",
        content: "① SABER — El contexto que te da criterio"
      },
      {
        type: "paragraph",
        content: "Cada paso arranca con una base teórica sólida: la lección principal —como esta que estás leyendo—, más los recursos y vídeos del Master MBA de Fisioreferentes que nuestra IA selecciona y recomienda específicamente para tu contexto y tu momento del programa."
      },
      {
        type: "paragraph",
        content: "Esto no es teoría por la teoría. Es el conocimiento mínimo necesario para que, cuando tomes una decisión, lo hagas con criterio propio y no por imitación o por intuición. La diferencia entre un fisioterapeuta que gestiona su clínica reactivamente y uno que lo hace estratégicamente es, exactamente, la calidad del conocimiento con el que lee cada situación."
      },
      {
        type: "callout",
        content: "En esta fase podrás apoyarte en la Academia IA para repasar conceptos, profundizar en los que más te interesan o aclarar dudas en el momento en que surjan, sin esperar a la siguiente sesión de mentoría.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "② DECIDIR — Tu negocio, tus decisiones, con acompañamiento"
      },
      {
        type: "paragraph",
        content: "Una vez tienes el contexto, llega la parte más importante: aplicarlo a tu situación concreta. En esta fase encontrarás ejercicios de decisión guiada, diseñados para que no solo entiendas los conceptos sino que los aterrices en tu clínica real."
      },
      {
        type: "paragraph",
        content: "Estos ejercicios están asistidos por el KNAAS FR (Knowledge as a Service), nuestra plataforma de inteligencia aplicada. El KNAAS no es un chatbot genérico: trabaja con el conocimiento acumulado de más de 1.000 clínicas auditadas, con la metodología de Fisioreferentes y con el contexto específico que tú vas introduciendo sobre tu negocio a lo largo del programa. El resultado son decisiones personalizadas, validadas al momento y a tu ritmo."
      },
      {
        type: "paragraph",
        content: "No te imponemos las respuestas. Te hacemos las preguntas correctas para que llegues tú a ellas."
      },
      {
        type: "callout",
        content: "Cuanto más contexto de tu negocio introduzcas en la plataforma, más personalizada y precisa será la experiencia. El KNAAS se vuelve más valioso con cada paso que completas.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "③ ACTIVA — Donde el conocimiento se convierte en resultados"
      },
      {
        type: "paragraph",
        content: "La última fase de cada paso es la acción. No acciones genéricas, sino las concretas que corresponden a tu situación, a tus decisiones del paso anterior y al momento del programa en que estás. Todo va acumulando."
      },
      {
        type: "paragraph",
        content: "En esta fase encontrarás los recursos accionables de alta implementación de cada paso: plantillas, herramientas, sistemas y guías que puedes llevar directamente a tu clínica. Además, el webinar de mentoría semanal sirve como cierre y acelerador de esta fase: resolvemos dudas, ajustamos lo que no encaja y validamos lo que sí."
      },
      {
        type: "paragraph",
        content: "En ACTIVA, la acción no es opcional ni voluntaria. Está inducida por el propio diseño del programa: cada paso construye sobre el anterior y el siguiente requiere que hayas completado el actual. No se puede avanzar sin aplicar."
      },
      {
        type: "paragraph",
        content: "Esta secuencia —Saber, Decidir, Activa— se repite en cada uno de los 14 pasos del programa. Con el tiempo, se convierte en un hábito de pensamiento que va mucho más allá del programa: es la manera en que un empresario bien formado enfrenta cualquier reto de su negocio."
      },
      {
        type: "heading",
        content: "3. El mapa completo: 4 módulos, 14 pasos de acción"
      },
      {
        type: "paragraph",
        content: "ACTIVA dura 4 meses y está organizado en 4 módulos que siguen una lógica muy concreta: primero construyes las bases estratégicas, luego defines con precisión a quién te diriges, después diseñas un servicio de alto valor para ese cliente, y por último construyes los sistemas para captarlo y venderlo. En ese orden y no en otro."
      },
      {
        type: "paragraph",
        content: "Cada semana se libera un nuevo paso. Esto no es arbitrario: está diseñado para que implementes cada bloque antes de pasar al siguiente. Un edificio bien construido necesita que los cimientos estén sólidos antes de subir el siguiente piso."
      },
      {
        type: "heading",
        content: "MÓDULO 1 · TU VENTAJA INJUSTA"
      },
      {
        type: "paragraph",
        content: "Este módulo es el fundamento de todo lo que viene. Aquí construyes la mirada estratégica, el diagnóstico objetivo de tu negocio y el rol empresarial que necesitas asumir. Sin este módulo, todo lo que viene después tendría pies de barro."
      },
      {
        type: "heading",
        content: "PASO 0 · CONSTRUYENDO TU CRITERIO ESTRATÉGICO"
      },
      {
        type: "callout",
        content: "¿Qué pasa si no sé nada de negocios, no me gusta o me abruma? Tranquilo, no lo necesitas al inicio. En este paso recibirás todo lo que necesitas para entender cómo funciona tu negocio de fisioterapia y adquirir la mirada estratégica que te dé confianza para tomar decisiones con criterio. Separando el grano de la paja, con 20 años de experiencia real en el sector.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "PASO 1 · DIAGNÓSTICO Y CONTROL DE TU NEGOCIO ACTUAL"
      },
      {
        type: "callout",
        content: "¿Y si no tengo ninguno, o no sé nada de números? Precisamente este paso es fundamental para ti. Encontrarás una herramienta guiada y perfeccionada tras analizar más de 1.000 clínicas de fisioterapia. Después del Paso 1 tendrás control absoluto sobre lo que pasa en tu negocio y recibirás un plan estratégico claro para crecer con control y rentabilidad.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "PASO 2 · CÓMO MONTAR UN NEGOCIO QUE VAYA CONTIGO Y QUE SEPAS LIDERAR"
      },
      {
        type: "callout",
        content: "Me gusta ser fisio, pero a veces me agota mi negocio. La mayoría nos montamos la clínica para hacer las cosas a nuestra manera, y con el tiempo nos damos cuenta de que lo que habíamos creado ya no va con nosotros. En este paso te guiaremos para que definas tu nuevo rol: dejas de ser solo fisio, pero tampoco puedes seguir siendo el hombre orquesta. Recibirás un plan para desarrollarte sin quemarte.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "PASO 3 · LO QUE HACE CRECER A UN BUEN NEGOCIO DE FISIOTERAPIA"
      },
      {
        type: "callout",
        content: "Cada vez tengo más pacientes, más equipo, pero no crece igual la cuenta bancaria. ¿Qué pasa? Eso es porque no estás entendiendo bien cómo crece realmente un buen negocio de fisioterapia. En este paso recibirás los motores de crecimiento de una clínica fisioreferente y las palancas que impulsarán no solo tu captación, sino también tus beneficios reales, sin necesidad de gastar en publicidad.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "MÓDULO 2 · DEFINE TU CLIENTE IDEAL"
      },
      {
        type: "paragraph",
        content: "Con las bases estratégicas sólidas, el segundo módulo se centra en una de las decisiones más importantes de cualquier negocio: definir exactamente a quién te diriges. Intentar servir a todo el mundo es la manera más segura de no destacar para nadie."
      },
      {
        type: "heading",
        content: "PASO 4 · CONOCE QUIÉN ES TU CLIENTE IDEAL (Y QUIÉN NO)"
      },
      {
        type: "callout",
        content: "¿Qué ocurre si no sé quién es mi cliente ideal, o si todos lo son? Piensa en un cliente que te encanta tratar y en una lesión que dominas. ¿Te imaginas que todos tus huecos se llenaran de gente como él o ella? Eso es exactamente lo que aprenderás e implementarás en este paso, de forma progresiva y sin asumir riesgos.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "PASO 5 · DEFINE EL PROBLEMA DE TU AVATAR CON CLARIDAD"
      },
      {
        type: "callout",
        content: "Mis pacientes vienen para recuperarse de una lesión. Tus pacientes no te compran para recuperarse de una lesión. Vienen",
        icon: "bulb"
      }
    ]
  },
  {
    id: 1,
    title: "La analogía del avión",
    subtitle: "Entendiendo tu negocio como un sistema",
    readingTime: "50-60 minutos",
    sections: [
      {
        type: "heading",
        content: "Por qué necesitamos una analogía"
      },
      {
        type: "paragraph",
        content: "Los negocios son sistemas complejos. Tienen muchas partes móviles, muchas variables interconectadas, y es muy fácil perderse en los detalles y perder de vista el conjunto. Cuando eso pasa, tomamos decisiones que optimizan una parte del sistema pero dañan otra. Ponemos un motor nuevo sin revisar las alas. Llenamos de combustible un avión que no puede despegar."
      },
      {
        type: "paragraph",
        content: "Necesitamos una imagen mental que nos permita ver el negocio como un todo coherente. Una imagen que cualquiera pueda entender y recordar, y que sirva de referencia constante cuando tengamos que tomar decisiones."
      },
      {
        type: "paragraph",
        content: "La imagen que vamos a usar es la de Donald Miller, uno de los grandes pensadores del desarrollo empresarial moderno: la analogía del avión."
      },
      {
        type: "paragraph",
        content: "Vamos a desarrollarla completamente, adaptándola a la realidad de una clínica de fisioterapia. Y te anticipo que cuando termines de leerla, nunca más volverás a ver tu negocio de la misma manera."
      },
      {
        type: "heading",
        content: "El avión: una máquina diseñada para un propósito"
      },
      {
        type: "paragraph",
        content: "Un avión es una máquina extraordinariamente compleja, pero se puede entender de manera relativamente simple si lo piensas como un sistema diseñado para un único propósito: llevar a personas desde un punto A hasta un punto B de manera segura, eficiente y repetible."
      },
      {
        type: "paragraph",
        content: "Para conseguir ese propósito, un avión tiene varios sistemas críticos que deben funcionar coordinadamente. Si cualquiera de ellos falla —o simplemente no rinde al nivel necesario—, el vuelo se ve comprometido. No importa lo perfectos que estén los demás sistemas. Un avión con un solo motor fallando está en problemas serios."
      },
      {
        type: "paragraph",
        content: "Tu clínica de fisioterapia es exactamente igual. Es una máquina diseñada para un propósito: crear valor para tus pacientes de manera que genere ingresos suficientes para que el negocio sea sostenible y rentable. Y para conseguirlo, tiene varios sistemas que deben funcionar coordinadamente."
      },
      {
        type: "paragraph",
        content: "Vamos a ver cada uno de ellos."
      },
      {
        type: "heading",
        content: "SISTEMA 1 — EL PILOTO: El liderazgo y la visión"
      },
      {
        type: "heading",
        content: "El piloto: tú como líder empresarial"
      },
      {
        type: "paragraph",
        content: "El piloto es la persona que está al mando del avión. No construye el avión, no fabrica el combustible, no diseña las rutas aéreas. Pero sin piloto, el avión más sofisticado del mundo no va a ningún sitio."
      },
      {
        type: "paragraph",
        content: "El piloto tiene tres responsabilidades fundamentales:"
      },
      {
        type: "paragraph",
        content: "Saber dónde está. En todo momento, el piloto tiene una imagen clara de la posición actual del avión: altitud, velocidad, combustible disponible, condiciones meteorológicas, posición respecto al destino. Sin esta información, no puede tomar buenas decisiones."
      },
      {
        type: "paragraph",
        content: "Saber adónde va. El piloto tiene un destino claro. No sale del aeropuerto \"a ver qué pasa\". Tiene un plan de vuelo con una ruta definida, tiempos estimados, puntos de referencia."
      },
      {
        type: "paragraph",
        content: "Saber cómo llegar. Cuando el tiempo cambia, cuando aparece turbulencia inesperada, cuando un sistema falla, el piloto tiene la formación y las herramientas para adaptar el plan y seguir volando hacia el destino."
      },
      {
        type: "paragraph",
        content: "En tu clínica, el piloto eres tú. Y estas tres responsabilidades se traducen en:"
      },
      {
        type: "list",
        items: [
          "Saber dónde está tu negocio: conocer tus números, tu posición competitiva, tus fortalezas y tus puntos débiles. Sin esta información, estás volando a ciegas.",
          "Saber adónde va tu negocio: tener una visión clara de lo que quieres construir, en qué plazo, con qué recursos. Sin destino, cualquier viento es el equivocado.",
          "Saber cómo llegar: tener la formación estratégica, las herramientas de gestión y la capacidad de tomar decisiones cuando el entorno cambia."
        ]
      },
      {
        type: "warning",
        content: "El error más común: El 80% de los dueños de clínica trabajan DENTRO del avión —atendiendo pacientes, gestionando el día a día, apagando fuegos— pero dedican muy poco tiempo a estar EN LA CABINA. Un piloto que abandona los mandos para ayudar con el servicio de cabina está poniendo en riesgo el vuelo entero. Tu trabajo como empresario es pilotar, no solo trabajar."
      },
      {
        type: "paragraph",
        content: "Esta es, precisamente, la primera gran transformación que ACTIVA busca provocar en ti: que salgas de la cabina del fisioterapeuta y entres en la cabina del empresario. No significa dejar de ser clínico si eso es lo que eliges. Significa añadir una nueva dimensión a tu identidad profesional."
      },
      {
        type: "heading",
        content: "SISTEMA 2 — EL FUSELAJE: Tu propuesta de valor y tu oferta"
      },
      {
        type: "heading",
        content: "El fuselaje: lo que realmente estás vendiendo"
      },
      {
        type: "paragraph",
        content: "El fuselaje es el cuerpo del avión. Es lo más visible, lo que le da identidad, lo que contiene todo lo demás. Sin fuselaje no hay avión."
      },
      {
        type: "paragraph",
        content: "En tu negocio, el fuselaje es tu propuesta de valor: la respuesta a la pregunta \"¿qué transformación produces en la vida de tu paciente y por qué debería elegirte a ti para conseguirla?\""
      },
      {
        type: "paragraph",
        content: "No confundas el fuselaje con tus técnicas clínicas. Las técnicas son herramientas. El fuselaje es el resultado que esas técnicas producen en la vida real de tu paciente."
      },
      {
        type: "paragraph",
        content: "Piénsalo así:"
      },
      {
        type: "list",
        items: [
          "Un paciente no te compra \"punción seca\" o \"terapia manual\". Te compra volver a correr la maratón que tuvo que abandonar el año pasado.",
          "No te compra \"ejercicio terapéutico\". Te compra poder jugar con sus hijos sin ese dolor de espalda que lleva meses limitándole.",
          "No te compra \"reeducación postural\". Te compra rendir mejor en el trabajo y dormir por fin más de 4 horas seguidas."
        ]
      },
      {
        type: "paragraph",
        content: "La diferencia parece sutil pero es enorme. La primera versión describe lo que haces. La segunda describe por qué le importa a tu paciente. Y los pacientes no compran lo que haces; compran por qué les importa."
      },
      {
        type: "paragraph",
        content: "Un fuselaje bien construido tiene tres dimensiones:"
      },
      {
        type: "paragraph",
        content: "Claridad: ¿Puede cualquier persona en 10 segundos entender qué problema resuelves y para quién? Si tu propuesta de valor necesita una explicación larga, no es clara suficientemente."
      },
      {
        type: "paragraph",
        content: "Relevancia: ¿Le importa ese problema a tu segmento específico? No a todo el mundo; a las personas concretas a las que te diriges."
      },
      {
        type: "paragraph",
        content: "Diferenciación: ¿Por qué tú y no otro? ¿Qué te hace la opción superior para ese segmento específico con ese problema específico?"
      },
      {
        type: "callout",
        content: "Ejercicio de fuselaje: Completa esta frase en menos de 30 palabras: \"Ayudamos a [segmento específico] que sufren [problema específico] a conseguir [resultado concreto] a través de [método o enfoque diferencial].\" Si tardas más de 5 minutos, tu fuselaje necesita trabajo.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "SISTEMA 3 — LAS ALAS: Tu producto/servicio y su entrega"
      },
      {
        type: "heading",
        content: "Las alas: lo que sustenta el vuelo"
      },
      {
        type: "paragraph",
        content: "Las alas son lo que genera la sustentación. Sin alas, el avión más potente del mundo se queda en el suelo. Las alas son las que convierten la potencia del motor en altura, en vuelo, en capacidad de mantenerse en el aire."
      },
      {
        type: "paragraph",
        content: "En tu negocio, las alas son el producto y el servicio en sí: cómo está diseñada tu oferta, cómo se entrega, qué experiencia vive el paciente desde que llama por primera vez hasta que termina su tratamiento —y más allá."
      },
      {
        type: "paragraph",
        content: "Las alas bien diseñadas tienen estas características:"
      },
      {
        type: "heading",
        content: "Ala 1 — La experiencia del paciente de principio a fin"
      },
      {
        type: "paragraph",
        content: "El \"servicio\" no empieza cuando el fisioterapeuta entra a la sala de tratamiento. Empieza mucho antes: en el primer contacto, que puede ser una búsqueda en Google, una recomendación de un amigo, o un post en redes sociales. Y no termina cuando el paciente sale por la puerta; termina —o no termina— según cómo gestiones la relación posterior."
      },
      {
        type: "paragraph",
        content: "Cada punto de contacto es una oportunidad de generar una experiencia que diferencie, que sorprenda, que cree la emoción que lleva a la fidelización y a la recomendación."
      },
      {
        type: "list",
        items: [
          "La primera llamada: ¿cómo se atiende? ¿Qué sensación queda? ¿Se resuelve el problema o se genera más fricción?",
          "La primera visita: ¿qué ve el paciente al entrar? ¿Cómo huele la clínica? ¿Cómo se siente recibido?",
          "La primera valoración: ¿se siente escuchado o \"diagnosticado y despachado\"? ¿Entiende su proceso?",
          "El seguimiento durante el tratamiento: ¿hay comunicación proactiva o solo reactiva?",
          "El alta: ¿hay un cierre que refuerce la relación o simplemente se deja de ver al paciente?",
          "El post-alta: ¿hay algún sistema de seguimiento, de revisiones, de comunidad?"
        ]
      },
      {
        type: "heading",
        content: "Ala 2 — La estructura de la oferta"
      },
      {
        type: "paragraph",
        content: "¿Cómo está empaquetado tu servicio? ¿Sesiones sueltas? ¿Bonos? ¿Programas cerrados? ¿Suscripciones? La estructura de tu oferta tiene un impacto directo en el valor que el paciente percibe, en el precio que está dispuesto a pagar y en la previsibilidad financiera de tu negocio."
      },
      {
        type: "paragraph",
        content: "Un programa cerrado de \"recuperación completa\" tiene más valor percibido que sesiones sueltas, porque el paciente entiende que hay un proceso, un objetivo y un compromiso mutuo. Y eso permite cobrar más, fidelizar más y generar mejores resultados clínicos."
      }
    ]
  },
  {
    id: 2,
    title: "¿Qué es realmente un negocio?",
    subtitle: "Del trueque a la era digital · El valor que importa · Por qué nos cuesta tanto",
    readingTime: "30-40 minutos",
    sections: [
      {
        type: "callout",
        content: "Tiempo estimado de lectura: 30-40 minutos. Esta lección es densa en conceptos pero ligera en lectura. Encontrarás preguntas de reflexión a lo largo del texto — no las saltes. Son el corazón del trabajo de este paso.",
        icon: "pin"
      },
      {
        type: "heading",
        content: "Antes de empezar: volvemos al avión un segundo"
      },
      {
        type: "paragraph",
        content: "En la lección anterior construimos juntos la analogía del avión. Vimos que tu negocio es un sistema con siete subsistemas interdependientes, y que el primer paso es entender ese sistema en su conjunto antes de tocar ningún tornillo."
      },
      {
        type: "paragraph",
        content: "Ahora bien: para pilotar bien ese avión —para entender por qué sube, por qué baja, por qué algunos vuelos son rentables y otros no—, primero necesitas entender qué diablos es el avión. No los instrumentos, no la ruta. El avión en sí. Su naturaleza. Para qué existe."
      },
      {
        type: "paragraph",
        content: "Un piloto que no entiende los principios básicos de la aeronáutica —la sustentación, el empuje, la gravedad— puede llegar a su destino cuando el tiempo es bueno y no hay turbulencias. Pero cuando algo falla, no sabe qué está pasando ni por qué. Y eso es exactamente lo que le pasa a la mayoría de los fisioterapeutas cuando montan su clínica: vuelan razonablemente bien en condiciones favorables, pero cuando el tiempo se complica no tienen el marco conceptual para diagnosticar el problema."
      },
      {
        type: "paragraph",
        content: "Esta lección te da ese marco. Vamos a entender qué es un negocio de verdad: de dónde viene, cómo funciona, cuál es la lógica profunda que lo mueve. Y por qué, con todo lo que sabemos de fisioterapia, somos estructuralmente malos empresarios... y qué hacer al respecto."
      },
      {
        type: "quote",
        content: "No puedes solucionar un problema que no entiendes. Y no puedes entender un negocio si no sabes qué es realmente un negocio."
      },
      {
        type: "heading",
        content: "Parte 1 — De dónde vienen los negocios: 5.000 años de historia en 10 minutos"
      },
      {
        type: "paragraph",
        content: "Los negocios no son un invento moderno. No los inventó la revolución industrial, ni el capitalismo, ni Silicon Valley. Los negocios llevan acompañando al ser humano desde la prehistoria, y entender esa evolución te da una perspectiva que la inmensa mayoría de tus competidores no tiene."
      },
      {
        type: "paragraph",
        content: "Y no se trata de historia por la historia. Se trata de que cuando ves de dónde viene algo, entiendes mejor hacia dónde va — y puedes tomar mejores decisiones sobre cómo posicionarte."
      },
      {
        type: "heading",
        content: "El origen: el trueque y el problema de la confianza"
      },
      {
        type: "paragraph",
        content: "Los primeros negocios de la historia eran intercambios directos: yo tengo cereal, tú tienes piel de animal, los dos necesitamos lo que tiene el otro. Intercambiamos. Nadie pierde. Los dos ganamos. Eso es la esencia de un negocio —y lo sigue siendo hoy, aunque lo hayamos complicado enormemente."
      },
      {
        type: "paragraph",
        content: "¿Por qué funcionaba el trueque? Por el contexto. La vida se organizaba en comunidades pequeñas donde todo el mundo se conocía. La información circulaba rápido. Si alguien te engañaba, todo el pueblo lo sabía al día siguiente. La reputación era el contrato. La confianza, la moneda."
      },
      {
        type: "paragraph",
        content: "Pero el trueque tenía un problema enorme que se hizo evidente cuando las comunidades empezaron a crecer: la \"doble coincidencia de necesidades\". Para que el intercambio funcionara, yo tenía que querer exactamente lo que tú tenías, y tú tenías que querer exactamente lo que yo tenía, al mismo tiempo. En una aldea de veinte personas, eso es viable. En una ciudad de mil, empieza a ser un problema logístico."
      },
      {
        type: "callout",
        content: "El paralelismo con tu clínica: El trueque tenía exactamente el mismo problema que muchas clínicas de fisioterapia hoy. Dependes de que el paciente llegue con exactamente la necesidad que tú sabes resolver, en el momento en que tú estás disponible, y con la disposición de pagar lo que tú cobras. Cuando esas tres cosas no coinciden, el intercambio no sucede. El marketing moderno es, en esencia, la solución a ese problema de coincidencia.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "La revolución silenciosa: dinero, escritura y contabilidad"
      },
      {
        type: "paragraph",
        content: "Con el surgimiento de las primeras grandes civilizaciones —Mesopotamia, Egipto, China, alrededor del año 3.000 a.C.— el comercio se volvió más complejo y organizado. Y entonces ocurrieron dos cosas que lo cambiaron todo para siempre:"
      },
      {
        type: "paragraph",
        content: "Apareció la escritura. No para hacer poesía, sino para registrar transacciones. Las primeras tablillas de arcilla mesopotámicas son, básicamente, facturas y registros de inventario. La escritura nació para hacer negocios. La contabilidad tiene 5.000 años."
      },
      {
        type: "paragraph",
        content: "Apareció el dinero-mercancía. Conchas, granos, metales preciosos. Objetos con valor aceptado socialmente que permitían separar el intercambio en el tiempo: yo te doy el grano ahora, tú me das las conchas después. El crédito, el tiempo y la confianza empezaron a poder medirse."
      },
      {
        type: "paragraph",
        content: "Esto fue revolucionario porque eliminó la \"doble coincidencia de necesidades\". Ahora podías vender tu servicio a quien lo necesitara, cobrar en moneda, y luego usar esa moneda para comprar lo que tú necesitabas, a otra persona diferente, en otro momento. El mercado empezó a existir como concepto."
      },
      {
        type: "heading",
        content: "El salto definitivo: las primeras monedas (600 a.C.)"
      },
      {
        type: "paragraph",
        content: "El paso final que completó la arquitectura básica del comercio llegó hacia el 600 a.C., en el reino de Lidia —la actual Turquía occidental—: las primeras monedas acuñadas. Hechas de una aleación de oro y plata llamada electro, selladas con el símbolo del Estado, con un peso estandarizado y garantizado."
      },
      {
        type: "paragraph",
        content: "¿Qué cambió exactamente? Tres cosas críticas:"
      },
      {
        type: "list",
        items: [
          "La confianza dejó de depender de conocer personalmente a la otra parte. El Estado garantizaba el valor. Podías comerciar con desconocidos.",
          "El valor se volvió portable y divisible. Podías llevar riqueza a otro ciudad, a otro país, sin cargar con mercancías.",
          "El comercio a larga distancia se disparó. Rutas comerciales, imperios económicos, especialización por zonas geográficas."
        ]
      },
      {
        type: "paragraph",
        content: "En esencia, las monedas crearon los mercados tal y como los conocemos: espacios donde personas que no se conocen pueden intercambiar valor de manera eficiente y con garantías."
      },
      {
        type: "callout",
        content: "El paralelismo con tu clínica hoy: Cuando construyes una marca reconocida, cuando tienes reseñas en Google, cuando tus pacientes te recomiendan... estás creando el equivalente moderno de esa garantía estatal. El paciente que nunca te ha visto puede confiar en ti porque hay señales externas que avalan tu valor. La reputación es la moneda del siglo XXI.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "La conclusión que importa"
      },
      {
        type: "paragraph",
        content: "¿Por qué importa todo esto? Porque deja claro un principio fundamental que vale tanto para el comerciante mesopotámico de 3.000 a.C. como para tu clínica de fisioterapia hoy:"
      },
      {
        type: "quote",
        content: "Los negocios existen porque hay personas con necesidades que no pueden satisfacer solas, y otras personas con la capacidad de satisfacerlas. El negocio es el puente entre los dos. Siempre lo ha sido. Siempre lo será."
      },
      {
        type: "paragraph",
        content: "Lo que ha cambiado a lo largo de la historia no es la esencia del negocio. Es el contexto competitivo, la sofisticación de las herramientas y la velocidad a la que todo evoluciona. De eso hablaremos más adelante. Pero la raíz es siempre la misma: alguien tiene algo que otro necesita, y hay un intercambio que genera valor para ambas partes."
      },
      {
        type: "paragraph",
        content: "Ahora que sabes de dónde viene un negocio, podemos hablar de qué es exactamente."
      },
      {
        type: "heading",
        content: "Parte 2 — La definición que lo cambia todo: valor percibido ≠ valor técnico"
      },
      {
        type: "paragraph",
        content: "Voy a darte la definición de negocio que usaremos en todo el programa. No es la que encontrarás en un libro de texto universitario. Es la que emerge de 20 años gestionando, equivocándonos y aprendiendo en el sector de la fisioterapia:"
      },
      {
        type: "quote",
        content: "Un negocio es un proceso repetitivo de crear y ofrecer algo de valor percibido, a un precio que el cliente está dispuesto a pagar, que satisfaga sus necesidades y —sobre todo— sus expectativas, de manera que genere beneficios suficientes para que el propietario pueda seguir operando."
      },
      {
        type: "paragraph",
        content: "Hay cinco palabras en esa definición que quiero que subrayes mentalmente, porque cada una de ellas rompe con alguna creencia errónea muy extendida entre los fisioterapeutas empresarios:"
      },
      {
        type: "heading",
        content: "1. \"Proceso repetitivo\""
      },
      {
        type: "paragraph",
        content: "Un negocio no es un evento. Es un sistema que se repite. El panadero que hace un pan extraordinario una vez tiene una habilidad. El panadero que hace 200 panes extraordinarios cada día, durante 365 días al año, con diferentes empleados, sin que la calidad varíe... tiene un negocio."
      },
      {
        type: "paragraph",
        content: "Esto es crítico en fisioterapia porque muchas clínicas funcionan excelentemente cuando el dueño está presente y atiende personalmente. La calidad sube y baja en función de quién trata al paciente. El resultado depende de la persona, no del sistema."
      },
      {
        type: "paragraph",
        content: "Un negocio real es un sistema que produce resultados consistentes independientemente de quién esté en la sala de tratamiento. Ese es uno de los grandes retos que trabajaremos en el Paso 2 y en el Módulo 3."
      },
      {
        type: "warning",
        content: "Señal de alarma: Si tu clínica produce mejores resultados cuando estás tú que cuando está tu equipo, no tienes un negocio. Tienes un consultorio personal con empleados. La distinción es brutal en términos de escalabilidad, venta y valor del negocio."
      },
      {
        type: "heading",
        content: "2. \"Algo de valor percibido\""
      },
      {
        type: "paragraph",
        content: "Aquí está uno de los conceptos más importantes —y más malinterpretados— de todo este programa. Fíjate: no dice \"valor real\". No dice \"valor clínico\". Dice \"valor percibido\"."
      }
    ]
  },
  {
    id: 3,
    title: "La naturaleza competitiva de los negocios",
    subtitle: "Las 5 eras · El diagnóstico que nadie quiere hacer · La era en la que tienes que competir hoy",
    readingTime: "35-45 minutos",
    sections: [
      {
        type: "callout",
        content: "Tiempo estimado de lectura: 35-45 minutos. Esta lección contiene el diagnóstico más incómodo de todo el programa. Si al terminar de leerla no te has sentido identificado al menos una vez, o no te has cuestionado algo que dabas por hecho, vuelve a leerla.",
        icon: "pin"
      },
      {
        type: "heading",
        content: "Apertura: la pregunta que lo cambia todo"
      },
      {
        type: "paragraph",
        content: "En la lección anterior definimos qué es un negocio. Vimos que es un proceso repetitivo de crear y ofrecer valor percibido, a un precio que el cliente está dispuesto a pagar, de manera rentable. Y vimos por qué los sanitarios tenemos una brecha estructural en la gestión empresarial."
      },
      {
        type: "paragraph",
        content: "Ahora surge la pregunta natural: si entiendo lo que es un negocio, ¿cómo consigo que el mío funcione mejor? ¿Qué tengo que hacer exactamente?"
      },
      {
        type: "paragraph",
        content: "Y aquí está el primer gran error de pensamiento que quiero desmontar antes de seguir: la pregunta \"¿qué tengo que hacer?\" asume que hay una respuesta correcta. Un estándar. Un nivel de calidad, un precio, una forma de trabajar que, si la alcanzas, el negocio funciona."
      },
      {
        type: "paragraph",
        content: "Y esa asunción es completamente falsa."
      },
      {
        type: "quote",
        content: "En los negocios no existen los estándares absolutos ni las respuestas correctas universales. Solo existe la comparación constante entre competidores. Tu éxito se mide siempre en relativo, nunca en absoluto."
      },
      {
        type: "paragraph",
        content: "Esto tiene una implicación profunda que vamos a explorar a lo largo de esta lección: la estrategia de tu negocio no consiste en alcanzar un nivel determinado de calidad o de eficiencia. Consiste en ser más relevante, más valioso y más difícil de sustituir que tus alternativas para el segmento específico al que te diriges."
      },
      {
        type: "paragraph",
        content: "Y para entender cómo hacer eso, necesitamos primero entender el terreno de juego. Necesitamos saber en qué era competitiva estamos, cómo hemos llegado hasta aquí y qué reglas rigen el partido que estamos jugando."
      },
      {
        type: "paragraph",
        content: "Para eso, nada mejor que mirar la historia."
      },
      {
        type: "heading",
        content: "Parte 1 — Las 5 eras de los negocios: un mapa para no perderse"
      },
      {
        type: "paragraph",
        content: "Carlos Muñoz, en su libro Radicalidad Disruptiva, describe cómo los negocios han pasado por cinco grandes eras a lo largo de la historia moderna. Cada era define las reglas del juego competitivo de su tiempo: qué es lo que diferencia a los que ganan de los que pierden, qué decisiones son estratégicas y cuáles ya no importan."
      },
      {
        type: "paragraph",
        content: "Lo que hace este modelo especialmente valioso para nosotros no es la teoría en sí, sino la aplicación práctica: cuando entiendas las cinco eras, vas a poder diagnosticar exactamente en cuál está operando tu clínica —y en cuál debería estar para competir bien hoy."
      },
      {
        type: "paragraph",
        content: "Vamos con ellas una a una. Para cada era usaré el mismo ejemplo —el del panadero— porque es un ejemplo que funciona para cualquier sector, y luego te mostraré el paralelo exacto en fisioterapia."
      },
      {
        type: "heading",
        content: "ERA 1 · LA ERA DE LA DISPONIBILIDAD · [SUPERADA]"
      },
      {
        type: "list",
        items: [
          "Regla del juego: El éxito = ser el único proveedor.",
          "Contexto: Escasez de oferta. La demanda supera a la oferta en casi todos los sectores.",
          "Lo que diferencia: Simplemente estar disponible. Si tienes el producto o servicio, tienes clientes.",
          "Lo que no importa: El precio, la calidad, la experiencia. Hay tan poco que lo que hay se consume."
        ]
      },
      {
        type: "paragraph",
        content: "El panadero del pueblo: \"¿Dónde compro pan? Donde lo venden. Solo hay uno.\" El panadero no necesita hacer nada especial. Solo necesita tener pan."
      },
      {
        type: "paragraph",
        content: "En fisioterapia: En zonas con poca oferta, esto todavía aplica. En grandes ciudades, quedó atrás hace décadas. Si el único fisioterapeuta de un pueblo pequeño eres tú, la era 1 es tu realidad. Para todos los demás, no existe."
      },
      {
        type: "heading",
        content: "ERA 2 · LA ERA DEL PRECIO · [TRAMPA MORTAL]"
      },
      {
        type: "list",
        items: [
          "Regla del juego: Cuando aparece la competencia, el primero que baja el precio capta más clientes.",
          "Contexto: La oferta empieza a igualarse a la demanda. Hay varios proveedores para el mismo producto.",
          "Lo que diferencia: El precio más bajo. El cliente elige en función del coste.",
          "Lo que destruye: Los márgenes. Todos bajan precios hasta que nadie gana suficiente para reinvertir."
        ]
      },
      {
        type: "paragraph",
        content: "El panadero: Aparece una segunda panadería. ¿Cómo compites? Bajando el precio del pan. La segunda baja más. La primera vuelve a bajar. Los dos ganan menos. Los dos recortan en materias primas para sobrevivir. La calidad cae."
      },
      {
        type: "paragraph",
        content: "En fisioterapia: Las plataformas de sesiones a 15-20€, los centros low cost, las cadenas de fisioterapia con precios de saldo. Competir en este terreno es una carrera al fondo que solo gana el que tiene más músculo financiero para aguantar pérdidas. Ese nunca es la clínica independiente."
      },
      {
        type: "warning",
        content: "El error más caro: Muchos fisioterapeutas que se sienten \"atrapados por la competencia\" entran en la Era 2 sin darse cuenta. Empiezan a bajar precios, a ofrecer descuentos, a \"hacer ofertas para llenar huecos\". Consiguen más volumen pero menos margen. Y el negocio crece en pacientes pero no en rentabilidad. Trabajas más y ganas lo mismo o menos."
      },
      {
        type: "heading",
        content: "ERA 3 · LA ERA DE LA CALIDAD · [AQUÍ ESTÁ ATASCADA LA FISIOTERAPIA]"
      },
      {
        type: "list",
        items: [
          "Regla del juego: La diferenciación viene por ofrecer un producto/servicio objetivamente mejor.",
          "Contexto: La guerra de precios ha destruido márgenes. Los que sobreviven buscan otra manera de distinguirse.",
          "Lo que diferencia: Calidad superior, técnica más avanzada, materiales mejores, experiencia más sólida.",
          "El problema: La calidad se convierte en estándar. Cuando todos alcanzan un nivel mínimo de calidad aceptable, deja de diferenciar."
        ]
      },
      {
        type: "paragraph",
        content: "El panadero: Usa harina de mayor calidad, mejor técnica de fermentación, ingredientes premium. Los clientes lo notan y le prefieren. Pero... los competidores aprenden la misma técnica, compran la misma harina. La calidad se democratiza y deja de ser diferenciador."
      },
      {
        type: "paragraph",
        content: "En fisioterapia: Ser buen fisioterapeuta, tener evidencia sólida, hacer una buena exploración, dar un buen seguimiento... El paciente ya da todo esto por hecho. No te elige porque seas bueno. Te descarta si no lo eres."
      },
      {
        type: "warning",
        content: "El diagnóstico incómodo: El sector de la fisioterapia lleva años anclado en la Era 3. Seguimos creyendo que si somos mejores técnicamente, si hacemos más formación, si tenemos mejor aparatología, ganaremos. Y nos frustramos cuando los resultados no llegan. No porque la calidad no importe — importa, y mucho — sino porque la calidad ya no diferencia. Es el precio de entrada al mercado, no el billete al éxito."
      },
      {
        type: "heading",
        content: "ERA 4 · LA ERA DE LA DIFERENCIACIÓN · [NECESARIA PERO INSUFICIENTE]"
      },
      {
        type: "list",
        items: [
          "Regla del juego: Adaptar el producto/servicio a segmentos específicos con necesidades específicas.",
          "Contexto: La calidad ya no distingue. Hay que encontrar maneras de ser relevante para grupos concretos.",
          "Lo que diferencia: Especialización, nicho, personalización, marca, experiencia adaptada.",
          "El problema: Todo lo que se puede copiar, se copia. La diferenciación material tiene fecha de caducidad."
        ]
      },
      {
        type: "paragraph",
        content: "El panadero: Hace pan sin sal para hipertensos, integral para diabéticos, sin gluten para celíacos. Cada línea de producto responde a un segmento con necesidad específica. Funciona... hasta que los competidores replican las mismas líneas."
      },
      {
        type: "paragraph",
        content: "En fisioterapia: Especializarse en suelo pélvico, en fisio deportiva, en neurológica, en pediátrica. Invertir en tecnología diferencial — ondas de choque, láser, ecografía. Crear una marca reconocible. Todo esto sigue siendo válido y necesario. El problema: ¿cuánto tarda la competencia en copiar tu especialización? ¿O en comprar el mismo aparato?"
      },
      {
        type: "heading",
        content: "ERA 5 · LA ERA DE LA RADICALIDAD EXPERIENCIAL · [AQUÍ ES DONDE SE JUEGA LA PARTIDA HOY]"
      },
      {
        type: "list",
        items: [
          "Regla del juego: No basta con ser bueno, ni con diferenciarse. Hay que crear experiencias que emocionen, que sorprendan y que sean imposibles de ignorar.",
          "Contexto: La diferenciación material se copia fácilmente. Lo que no se copia es la experiencia emocional que generas.",
          "Lo que diferencia: Calidad radical (apoyada en tecnología), economía de la atención, experiencias memorables."
        ]
      },
      {
        type: "paragraph",
        content: "El panadero: No solo hace el mejor pan de la zona. Ha creado una experiencia: el olor que sale a la calle, el ambiente del local, el panadero que conoce a sus clientes por su nombre, los vídeos del proceso de fermentación que comparte en redes, la historia que hay detrás de cada receta. No vendes pan. Vendes una experiencia que la gente quiere vivir y quiere compartir."
      },
      {
        type: "paragraph",
        content: "En fisioterapia: No solo tratas bien. Creas una experiencia desde el primer contacto hasta mucho después del alta. Usas tecnología para elevar la calidad a un nivel que antes era imposible. Capturas la atención de tu mercado con contenido relevante. Y cada interacción con"
      }
    ]
  },
  {
    id: 4,
    title: "El mapa del negocio, la competencia y las ventajas que duran",
    subtitle: "Business Model Canvas · Competencia real · Barreras · Motores de crecimiento",
    readingTime: "60-75 minutos",
    sections: [
      {
        type: "callout",
        content: "Esta es la lección más densa del Paso 0. Aquí aprenderás a leer un negocio como un sistema completo, a identificar contra quién compites realmente, a distinguir una ventaja competitiva real de una falsa, y a entender qué mecanismos hacen crecer un negocio de forma sostenible. Todo esto forma la base del pensamiento estratégico que usarás durante todo el programa.",
        icon: "bulb"
      },
      {
        type: "separator",
        content: ""
      },
      {
        type: "heading",
        content: "Índice de la lección"
      },
      {
        type: "list",
        items: [
          "Apertura — El negocio visto desde arriba",
          "Parte 1 — El Business Model Canvas: ver el negocio como un sistema",
          "Parte 2 — Los 9 bloques del Canvas (ve a ver los vídeos)",
          "Parte 3 — Los 3 tipos de competencia que tienes que vigilar",
          "Parte 4 — Ventajas competitivas reales vs. falsas",
          "Parte 5 — Barreras defensivas: el arte de hacer difícil que te copien",
          "Parte 6 —El círculo virtuoso: cómo todo se refuerza",
          "Cierre — La mirada estratégica que cambia cómo ves tu negocio"
        ]
      },
      {
        type: "heading",
        content: "Apertura — El negocio visto desde arriba"
      },
      {
        type: "paragraph",
        content: "En la Lección 2 entendiste que los negocios compiten en eras. Que la fisioterapia como sector lleva años estancada en la era de la calidad mientras el mercado ha evolucionado hacia la diferenciación y, más aún, hacia la radicalidad experiencial. Eso te dio una visión del escenario en el que juegas."
      },
      {
        type: "paragraph",
        content: "Ahora necesitas algo diferente: no ver el escenario, sino ver tu propio negocio. Tener la capacidad de observarlo desde arriba, como si lo miraras desde un helicóptero, y entender cómo funciona como sistema. Cuáles son sus piezas, cómo se conectan entre sí, dónde están sus puntos fuertes, dónde están sus vulnerabilidades."
      },
      {
        type: "paragraph",
        content: "Esa capacidad de ver el negocio como un sistema es exactamente lo que construye esta lección. Y es el tipo de pensamiento que diferencia a un dueño que reacciona a los problemas de uno que los anticipa."
      },
      {
        type: "quote",
        content: "Un fisioterapeuta excelente trata pacientes. Un empresario excelente diseña el sistema que permite tratar pacientes mejor que nadie, de forma sostenible y escalable. — Distinción clave del programa ACTIVA"
      },
      {
        type: "paragraph",
        content: "Esta lección tiene tres grandes bloques que se conectan en secuencia lógica: primero el mapa (Canvas), luego el entorno (competencia), y finalmente el posicionamiento en ese entorno (ventajas, barreras y motores). Los tres juntos te dan la mirada estratégica completa que es el objetivo de este Paso 0."
      },
      {
        type: "heading",
        content: "Parte 1 — El Business Model Canvas: por qué es la herramienta más importante que aprenderás"
      },
      {
        type: "paragraph",
        content: "Antes de hablar de sus bloques, necesitas entender por qué existe el Business Model Canvas y qué problema resuelve. Porque si solo lo ves como un formulario a rellenar, lo usarás mal y le sacarás el 10% de su valor."
      },
      {
        type: "heading",
        content: "El problema que resuelve"
      },
      {
        type: "paragraph",
        content: "Cuando estás dentro de tu negocio, operando día a día, tu visión es inevitablemente parcial. Ves lo que tienes delante: la agenda, los pacientes, las facturas, el equipo. Pero te cuesta ver el conjunto. Cómo están conectadas las decisiones de precio con las de personal. Cómo el canal de captación que usas condiciona el tipo de cliente que atraes. Cómo una debilidad en un bloque del negocio está creando un problema aparente en otro."
      },
      {
        type: "paragraph",
        content: "El Business Model Canvas, desarrollado por Alexander Osterwalder, es una herramienta que te permite representar visualmente tu negocio completo en una sola página, con todos sus bloques y las relaciones entre ellos. Es, literalmente, el mapa del negocio."
      },
      {
        type: "paragraph",
        content: "Con ese mapa puedes hacer algo que sin él es casi imposible: comparar, diagnosticar, diseñar y tomar decisiones estratégicas con claridad. En lugar de resolver problemas a ciegas, los resuelves con una fotografía completa del sistema."
      },
      {
        type: "callout",
        content: "Una analogía: imagina que eres el piloto del avión del que hablábamos en la introducción al programa. Sin instrumentos de vuelo, puedes volar si hay buena visibilidad. Pero en cuanto hay niebla, tormenta o de noche, estás ciego. El Canvas es tu panel de instrumentos: te da una lectura completa del estado del negocio independientemente de las condiciones externas.",
        icon: "pin"
      },
      {
        type: "heading",
        content: "Por qué es indispensable para construir la mirada estratégica"
      },
      {
        type: "paragraph",
        content: "Durante todo el programa ACTIVA vas a tomar decisiones importantes sobre tu negocio: cómo posicionarte, cómo captar clientes, cómo fijar precios, cómo construir tu equipo, cómo gestionar las finanzas. Todas esas decisiones tienen sentido dentro de un sistema, no de forma aislada."
      },
      {
        type: "paragraph",
        content: "El Canvas te obliga a ver ese sistema. Cuando cambias el segmento de clientes, el Canvas te muestra inmediatamente qué más cambia en consecuencia: la propuesta de valor, los canales, las relaciones, los ingresos, los recursos necesarios. Ninguna pieza existe en aislamiento."
      },
      {
        type: "paragraph",
        content: "Este es el pensamiento sistémico que caracteriza a los dueños de negocio más efectivos: la capacidad de ver los efectos de segundo y tercer orden de cada decisión, no solo el efecto inmediato y obvio."
      },
      {
        type: "warning",
        content: "El error más común con el Canvas: usarlo para describir lo que ya tienes, no para diseñar lo que quieres construir. El Canvas no es un informe. Es una herramienta de pensamiento. Su valor no está en el resultado final (el papel rellenado), sino en el proceso de pensarlo: las preguntas que te obliga a hacerte, las incoherencias que hace visibles, las oportunidades que revela."
      },
      {
        type: "heading",
        content: "La metáfora de la balanza"
      },
      {
        type: "paragraph",
        content: "Hay una metáfora especialmente útil para entender la lógica central del Canvas: imagínalo como una balanza con la propuesta de valor en el centro como eje."
      },
      {
        type: "paragraph",
        content: "En un lado de la balanza están todos los elementos orientados al cliente: el segmento al que sirves, los canales a través de los que llegas a él, la relación que construyes con él y los ingresos que esa relación genera. Son las piezas que crean valor percibido y lo convierten en dinero."
      },
      {
        type: "paragraph",
        content: "En el otro lado están los elementos orientados al negocio: los recursos que necesitas para operar, las actividades que tienes que ejecutar, los socios que necesitas y los costes que todo eso genera. Son las piezas que hacen posible crear y entregar ese valor."
      },
      {
        type: "paragraph",
        content: "El negocio es rentable y sostenible cuando la balanza está equilibrada: cuando el valor que creas para el cliente genera suficientes ingresos para cubrir los costes de crearlo con un margen que justifique la operación. Cuando la balanza se desequilibra, el negocio tiene un problema estructural, aunque pueda sobrevivir un tiempo gracias al impulso acumulado."
      },
      {
        type: "callout",
        content: "Esto explica por qué muchos negocios de fisioterapia que tienen pacientes satisfechos y buenas reseñas aun así no son rentables: la balanza está desequilibrada. Crean valor real para el cliente pero no han diseñado el lado del negocio de forma eficiente. El Canvas hace visible ese desequilibrio antes de que sea demasiado tarde.",
        icon: "bulb"
      },
      {
        type: "heading",
        content: "Parte 2 — Los 9 bloques del Canvas"
      },
      {
        type: "callout",
        content: "Para esta parte, ve directamente a los vídeos del programa",
        icon: "pin"
      },
      {
        type: "paragraph",
        content: "El Canvas tiene 9 bloques que juntos describen la arquitectura completa de cualquier negocio. En el programa tienes dos lecciones de vídeo dedicadas específicamente a ellos: una que explica la mecánica de cada bloque con detalle y otra que los trabaja sobre un caso real de fisioterapia (la clínica de Óscar Martínez, Global Performance)."
      },
      {
        type: "paragraph",
        content: "Te recomiendo encarecidamente que veas esas lecciones antes de continuar con el texto, o al menos en paralelo. La explicación visual y el ejemplo en vídeo te darán una comprensión mucho más rica que cualquier descripción escrita. Lo que encontrarás a continuación es un mapa de referencia que puedes usar como guía de consulta mientras trabajas en tu propio Canvas."
      },
      {
        type: "separator",
        content: ""
      },
      {
        type: "heading",
        content: "LADO CLIENTE — Los 5 bloques que crean y capturan valor"
      },
      {
        type: "heading",
        content: "👥 SEGMENTO DE CLIENTES"
      },
      {
        type: "paragraph",
        content: "¿A quién sirves exactamente? El segmento no es solo una etiqueta demográfica. Es la definición precisa del grupo de personas cuyo problema tu negocio resuelve mejor que ninguna otra alternativa. Todo el Canvas pivota sobre esta decisión."
      },
      {
        type: "paragraph",
        content: "→ En fisioterapia: Deportistas amateur con historial de lesiones recurrentes. Ejecutivos con cervicalgia crónica. Madres postparto con disfunción de suelo pélvico. Cada segmento lleva a un Canvas diferente."
      },
      {
        type: "heading",
        content: "💎 PROPUESTA DE VALOR"
      },
      {
        type: "paragraph",
        content: "¿Qué problema resuelves y qué ofreces que nadie más ofrece de la misma manera? No es solo el servicio (fisioterapia). Es la combinación única de resultado prometido, método de entrega, experiencia y garantías que hace que tu cliente te elija a ti sobre todas las demás opciones, incluyendo no hacer nada."
      },
      {
        type: "paragraph",
        content: "→ En fisioterapia: \"Recuperación funcional completa en menos de 8"
      }
    ]
  },
  {
    id: 5,
    title: "De la teoría al terreno: cómo tomamos el pulso a tu negocio",
    subtitle: "Cierre del Paso 0 · Introducción al Paso 1: Diagnóstico",
    readingTime: "40-50 minutos",
    sections: [
      {
        type: "callout",
        content: "En esta lección recogemos todo lo que has construido en el Paso 0 y lo conectamos con lo que viene a continuación. El diagnóstico no es un trámite: es el momento en que la mirada estratégica que acabas de desarrollar se aplica, por primera vez, sobre la realidad concreta de tu negocio. Antes de diseñar cualquier estrategia, necesitas saber exactamente desde dónde partes.",
        icon: "bulb"
      },
      {
        type: "separator",
        content: ""
      },
      {
        type: "heading",
        content: "Índice de esta lección"
      },
      {
        type: "list",
        items: [
          "Parte 1 — Lo que has construido en el Paso 0: la mirada estratégica",
          "Parte 2 — El problema de medir mal: métricas vanidosas vs. métricas que importan",
          "Parte 3 — Los 5 KPIs fundamentales de una clínica de fisioterapia",
          "Parte 4 — Por qué el diagnóstico es el primer paso real del cambio",
          "Cierre — Lo que te espera en el Paso 1"
        ]
      },
      {
        type: "heading",
        content: "Parte 1 — Lo que has construido en el Paso 0"
      },
      {
        type: "paragraph",
        content: "Antes de avanzar, vale la pena detenerse un momento y hacer inventario. El Paso 0 no era un calentamiento. Era la construcción de una herramienta que vas a usar durante todo el programa y durante el resto de tu carrera como dueño de negocio: la mirada estratégica."
      },
      {
        type: "paragraph",
        content: "Cuando empezaste este paso, probablemente veías tu clínica como un lugar donde atiendes pacientes. Un espacio físico, una agenda, un equipo, unos ingresos. Ahora deberías verla como un sistema, con piezas interconectadas, que compite en un mercado que evoluciona, que tiene fortalezas y vulnerabilidades específicas, y que crece —o no— en función de unos motores muy concretos."
      },
      {
        type: "paragraph",
        content: "Esto es lo que has aprendido en cada lección:"
      },
      {
        type: "heading",
        content: "L1 ¿Qué es realmente un negocio?"
      },
      {
        type: "paragraph",
        content: "Un negocio no es el servicio que ofreces. Es un proceso repetitivo que genera valor percibido por encima de las expectativas del cliente, a un precio que el cliente está dispuesto a pagar, con los beneficios suficientes para que sea sostenible. Entender esto cambia qué decisiones tomas y por qué."
      },
      {
        type: "heading",
        content: "L2 La naturaleza competitiva de los negocios"
      },
      {
        type: "paragraph",
        content: "Los negocios compiten en eras. La fisioterapia como sector lleva años atascada en la era de la calidad mientras el mercado avanza hacia la diferenciación y la radicalidad experiencial. El futuro competitivo de tu clínica pasa por tres pilares: calidad radical con IA, economía de la atención y experiencia memorable del cliente."
      },
      {
        type: "heading",
        content: "L4 El mapa del negocio, la competencia y las ventajas que duran"
      },
      {
        type: "paragraph",
        content: "El Business Model Canvas te da el mapa completo del negocio como sistema. Tienes tres tipos de competencia que vigilar (directa, indirecta e interna). Las ventajas competitivas reales son difíciles de copiar, no se compran con dinero. Los tres motores de crecimiento son recurrencia, viralidad y captación activa. Todo ello alimenta —o rompe— el círculo virtuoso."
      },
      {
        type: "paragraph",
        content: "Con esas tres lecciones tienes lo que ninguna carrera universitaria de fisioterapia te enseña: un marco para pensar tu negocio como un estratega, no solo como un técnico."
      },
      {
        type: "callout",
        content: "La mirada estratégica es una habilidad, no un conocimiento. Se desarrolla con uso continuado. A lo largo del programa la aplicarás una y otra vez a contextos cada vez más concretos: captación, ventas, equipo, finanzas. Lo que has construido en el Paso 0 es el lenguaje base. Lo que viene ahora son las frases.",
        icon: "pin"
      },
      {
        type: "heading",
        content: "Parte 2 — El problema de medir mal: métricas vanidosas vs. métricas que importan"
      },
      {
        type: "paragraph",
        content: "Hay una pregunta que hacemos habitualmente a los dueños de clínicas de fisioterapia cuando empezamos a trabajar con ellos: \"¿Está creciendo tu negocio?\""
      },
      {
        type: "paragraph",
        content: "La respuesta casi siempre es \"sí\". Y cuando preguntamos en qué se basan para afirmarlo, la respuesta también es casi siempre la misma: \"Facturamos más que el año pasado\" o \"Tenemos más pacientes que antes\"."
      },
      {
        type: "paragraph",
        content: "El problema es que ni la facturación ni el número de pacientes te dicen si tu negocio está realmente creciendo. Son lo que se llama métricas vanidosas: números que se ven bien en una conversación pero que ocultan más de lo que revelan."
      },
      {
        type: "warning",
        content: "Métricas vanidosas: facturación total y número de pacientes totales. Facturar más no significa ganar más: si para facturar 10.000€ más has necesitado contratar a alguien, ampliar el local y aumentar el material, es perfectamente posible que tu margen neto haya bajado. Tener más pacientes no significa tener una agenda sana: si la agenda está saturada y tienes pacientes esperando semanas, el crecimiento en volumen está deteriorando la experiencia y reduciendo la recurrencia."
      },
      {
        type: "paragraph",
        content: "El error estructural es medir el negocio desde arriba: como una fotografía global que parece bonita pero está demasiado lejos para ver lo que realmente pasa. Para entender si un negocio está sano necesitas bajar al nivel de cada unidad: cada paciente, cada servicio, cada sesión."
      },
      {
        type: "quote",
        content: "No puedes mejorar lo que no puedes medir con precisión. Y no puedes medir con precisión si usas los indicadores equivocados. — Principio de diagnóstico estratégico"
      },
      {
        type: "paragraph",
        content: "Fíjate en la relación que tiene esto con lo que aprendiste en las lecciones anteriores. En la Lección 4 hablamos de los tres motores de crecimiento de una clínica: recurrencia, viralidad y captación activa. Dijimos que el cuello de botella determina en cuál concentrarse primero. Pero para saber cuál es el cuello de botella, necesitas datos. Datos concretos, unitarios, del funcionamiento real de cada motor."
      },
      {
        type: "paragraph",
        content: "Sin esos datos, cualquier decisión estratégica que tomes es una suposición disfrazada de plan. Puedes acertar, pero por casualidad. El Paso 1 te da la fotografía real de la que depende todo lo demás."
      },
      {
        type: "heading",
        content: "Parte 3 — Los 5 KPIs fundamentales de tu clínica"
      },
      {
        type: "paragraph",
        content: "Las métricas que realmente importan en una clínica de fisioterapia no son las globales: son las unitarias. Las que miden lo que ocurre en cada sesión, con cada paciente, en cada servicio. Aquí están los cinco KPIs que forman la columna vertebral del diagnóstico que harás en el Paso 1."
      },
      {
        type: "paragraph",
        content: "En este punto no necesitas calcularlos todavía. El objetivo ahora es que entiendas qué mide cada uno, por qué importa y cómo se conecta con lo que has aprendido en el Paso 0. En el Paso 1 los trabajarás en detalle, con tus números reales."
      },
      {
        type: "heading",
        content: "KPI 1 MARGEN POR SERVICIO"
      },
      {
        type: "paragraph",
        content: "Qué mide: El beneficio neto que genera cada uno de tus servicios después de descontar los costes directos de producirlo: coste del tiempo del fisio, materiales, parte proporcional de los gastos fijos asignables. No es lo que cobras. Es lo que te queda."
      },
      {
        type: "paragraph",
        content: "Por qué importa: Puedes estar creciendo en facturación mientras tu margen se deteriora silenciosamente. Crecer con márgenes negativos o insuficientes es, simplemente, quebrar más despacio. Este KPI te dice si cada sesión que das es sostenible o no."
      },
      {
        type: "paragraph",
        content: "Señal de alarma: Márgenes por debajo del 30-35% en los servicios principales. Crecimiento de ingresos que no se traslada a mejora del beneficio neto."
      },
      {
        type: "heading",
        content: "KPI 2 RECURRENCIA MEDIA"
      },
      {
        type: "paragraph",
        content: "Qué mide: El número medio de sesiones que un paciente completa contigo durante un episodio de tratamiento. No el número que le propones: el que realmente termina haciendo. Es el KPI que más información condensada contiene sobre la salud de tu clínica."
      },
      {
        type: "paragraph",
        content: "Por qué importa: La recurrencia es el motor más eficiente de ingresos en fisioterapia porque su coste de adquisición es casi cero: el paciente ya está dentro. Además, una recurrencia baja suele indicar un problema de planificación del tratamiento (no se explica bien el proceso al paciente), de agenda saturada (no hay huecos disponibles) o de experiencia (el paciente no percibe progreso suficiente para continuar)."
      },
      {
        type: "paragraph",
        content: "Señal de alarma: Recurrencia media por debajo de lo que indica la fisiología de las patologías que tratas. Si tu patología más frecuente requiere 8-10 sesiones y tu recurrencia media es 3, hay un problema."
      },
      {
        type: "heading",
        content: "KPI 3 CAPTACIÓN Y TASA DE VIRALIDAD"
      },
      {
        type: "paragraph",
        content: "Qué mide: El número de pacientes nuevos que llegan a tu clínica en un período, segmentados por su fuente de origen: ¿de dónde vienen? ¿Por recomendación, por búsqueda en internet, por campaña de pago, por referido médico, por casualidad geográfica?"
      },
      {
        type: "paragraph",
        content: "Por qué importa: Saber cuántos pacientes captas es solo la mitad del dato. La mitad que importa es desde dónde los captas. Si el 80% viene por boca a boca, tienes un motor de viralidad funcionando, pero depende de la satisfacción. Si el 80% viene de publicidad de pago, necesitas saber cuánto te cuesta cada uno para ver si la ecuación es sostenible. El objetivo estratégico es que la tasa de viralidad supere 1: que cada cliente, de media, genere al menos un referido."
      },
      {
        type: "paragraph",
        content: "Señal de alarma: Menos del 30% de nuevos pacientes que llegan por recomendación. Canal único de captación sin alternativas: altísima dependencia y fragilidad."
      },
      {
        type: "heading",
        content: "KPI 4 COSTE DE ADQUISICIÓN DE CLIENTE (CAC)"
      },
      {
        type: "paragraph",
        content: "Qué mide: Lo que te cuesta, en euros de inversión en marketing y"
      }
    ]
  }
];
