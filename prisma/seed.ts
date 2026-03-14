import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // limpa tudo (ordem importa por FK)
  await prisma.evaluationScore.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.user.deleteMany();

  // Users - Estudantes
  const students = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Maria Santos Silva',
        email: 'maria.santos@ufu.br',
        password: '123456',
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'João Pedro Oliveira',
        email: 'joao.oliveira@ufu.br',
        password: '123456',
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ana Carolina Costa',
        email: 'ana.costa@ufu.br',
        password: '123456',
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lucas Mendes Ferreira',
        email: 'lucas.ferreira@ufu.br',
        password: '123456',
        role: Role.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Beatriz Almeida',
        email: 'beatriz.almeida@ufu.br',
        password: '123456',
        role: Role.STUDENT,
      },
    }),
  ]);

  const disciplines = await Promise.all([
    prisma.discipline.create({
      data: { name: 'Banco de Dados I', code: 'BCC001' },
    }),
    prisma.discipline.create({
      data: { name: 'Estrutura de Dados', code: 'BCC002' },
    }),
    prisma.discipline.create({
      data: { name: 'Algoritmos e Programação', code: 'BCC003' },
    }),
    prisma.discipline.create({
      data: { name: 'Engenharia de Software I', code: 'BCC004' },
    }),
    prisma.discipline.create({
      data: { name: 'Interação Humano-Computador', code: 'BCC005' },
    }),
    prisma.discipline.create({
      data: { name: 'Redes de Computadores', code: 'BCC006' },
    }),
    prisma.discipline.create({
      data: { name: 'Sistemas Operacionais', code: 'BCC007' },
    }),
    prisma.discipline.create({
      data: { name: 'Compiladores', code: 'BCC008' },
    }),
    prisma.discipline.create({
      data: { name: 'Cálculo Diferencial e Integral I', code: 'MAT001' },
    }),
    prisma.discipline.create({
      data: { name: 'Álgebra Linear', code: 'MAT002' },
    }),
  ]);

  // Teachers - Professores com títulos e disciplinas
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        name: 'Dr. Roberto Carlos Mendes',
        title: 'Prof. Dr.',
        disciplines: {
          connect: [
            { id: disciplines[0].id }, // Banco de Dados I
            { id: disciplines[6].id }, // Sistemas Operacionais
          ],
        },
      },
    }),
    prisma.teacher.create({
      data: {
        name: 'Dra. Fernanda Lima',
        title: 'Profa. Dra.',
        disciplines: {
          connect: [
            { id: disciplines[1].id }, // Estrutura de Dados
            { id: disciplines[2].id }, // Algoritmos e Programação
          ],
        },
      },
    }),
    prisma.teacher.create({
      data: {
        name: 'Marcos Antonio Silva',
        title: 'Prof. Me.',
        disciplines: {
          connect: [
            { id: disciplines[3].id }, // Engenharia de Software I
            { id: disciplines[7].id }, // Compiladores
          ],
        },
      },
    }),
    prisma.teacher.create({
      data: {
        name: 'Ana Paula Gomes',
        title: 'Profa. Ma.',
        disciplines: {
          connect: [
            { id: disciplines[4].id }, // Interação Humano-Computador
          ],
        },
      },
    }),
    prisma.teacher.create({
      data: {
        name: 'Carlos Eduardo Rocha',
        title: 'Prof. Esp.',
        disciplines: {
          connect: [
            { id: disciplines[5].id }, // Redes de Computadores
          ],
        },
      },
    }),
    prisma.teacher.create({
      data: {
        name: 'Dra. Patrícia Oliveira',
        title: 'Profa. Dra.',
        disciplines: {
          connect: [
            { id: disciplines[8].id }, // Cálculo I
            { id: disciplines[9].id }, // Álgebra Linear
          ],
        },
      },
    }),
  ]);

  // Critérios de avaliação
  const criteria = [
    'didatica',
    'assiduidade',
    'claridade',
    'postura',
    'disponibilidade',
  ];

  // Avaliações - Dados realistas e variados
  const evaluations = [
    // Avaliações do Dr. Roberto Carlos (Banco de Dados)
    {
      comment:
        'Professor excelente! Domina muito bem o conteúdo e sempre traz exemplos práticos do mercado. As aulas são dinâmicas e ele está sempre disposto a tirar dúvidas.',
      disciplineId: disciplines[0].id,
      teacherId: teachers[0].id,
      userId: students[0].id,
      scores: {
        didatica: 5,
        assiduidade: 5,
        claridade: 5,
        postura: 5,
        disponibilidade: 5,
      },
    },
    {
      comment:
        'Ótimo professor, mas às vezes corre muito o conteúdo. Poderia dar mais tempo para absorver os conceitos antes de avançar.',
      disciplineId: disciplines[0].id,
      teacherId: teachers[0].id,
      userId: students[1].id,
      scores: {
        didatica: 4,
        assiduidade: 5,
        claridade: 4,
        postura: 5,
        disponibilidade: 4,
      },
    },
    {
      comment:
        'Aulas um pouco teóricas demais. Precisaria de mais exercícios práticos durante as aulas.',
      disciplineId: disciplines[0].id,
      teacherId: teachers[0].id,
      userId: students[2].id,
      scores: {
        didatica: 3,
        assiduidade: 4,
        claridade: 3,
        postura: 4,
        disponibilidade: 4,
      },
    },

    // Avaliações da Dra. Fernanda (Estrutura de Dados)
    {
      comment:
        'Professora incrível! Explica os conceitos complexos de forma muito clara e paciente. Sempre disponível para ajudar os alunos.',
      disciplineId: disciplines[1].id,
      teacherId: teachers[1].id,
      userId: students[0].id,
      scores: {
        didatica: 5,
        assiduidade: 5,
        claridade: 5,
        postura: 5,
        disponibilidade: 5,
      },
    },
    {
      comment:
        'Método de ensino excelente, mas as listas de exercício são muito longas e difíceis.',
      disciplineId: disciplines[1].id,
      teacherId: teachers[1].id,
      userId: students[3].id,
      scores: {
        didatica: 4,
        assiduidade: 5,
        claridade: 4,
        postura: 5,
        disponibilidade: 4,
      },
    },

    // Avaliações do Prof. Marcos (Engenharia de Software)
    {
      comment:
        'Professor com muita experiência prática. Os projetos desenvolvidos em aula são muito relevantes para o mercado.',
      disciplineId: disciplines[3].id,
      teacherId: teachers[2].id,
      userId: students[1].id,
      scores: {
        didatica: 4,
        assiduidade: 4,
        claridade: 4,
        postura: 4,
        disponibilidade: 3,
      },
    },
    {
      comment:
        'Às vezes falta organização nas aulas, mas o conteúdo é bom e relevante.',
      disciplineId: disciplines[3].id,
      teacherId: teachers[2].id,
      userId: students[4].id,
      scores: {
        didatica: 3,
        assiduidade: 3,
        claridade: 3,
        postura: 4,
        disponibilidade: 3,
      },
    },

    // Avaliações da Profa. Ana Paula (IHC)
    {
      comment:
        'Professora muito criativa e dinâmica! As aulas são sempre interessantes com muitas atividades práticas.',
      disciplineId: disciplines[4].id,
      teacherId: teachers[3].id,
      userId: students[2].id,
      scores: {
        didatica: 5,
        assiduidade: 5,
        claridade: 5,
        postura: 5,
        disponibilidade: 5,
      },
    },
    {
      comment:
        'Adorei a disciplina! A professora faz com que os conceitos fiquem fáceis de entender.',
      disciplineId: disciplines[4].id,
      teacherId: teachers[3].id,
      userId: students[3].id,
      scores: {
        didatica: 4,
        assiduidade: 4,
        claridade: 4,
        postura: 5,
        disponibilidade: 4,
      },
    },

    // Avaliações do Prof. Carlos (Redes)
    {
      comment:
        'Professor muito experiente, com muitos casos reais para compartilhar. As aulas práticas de laboratório são ótimas.',
      disciplineId: disciplines[5].id,
      teacherId: teachers[4].id,
      userId: students[0].id,
      scores: {
        didatica: 4,
        assiduidade: 5,
        claridade: 4,
        postura: 4,
        disponibilidade: 4,
      },
    },
    {
      comment:
        'Conteúdo complexo, mas o professor ajuda bastante. Às vezes as explicações poderiam ser mais detalhadas.',
      disciplineId: disciplines[5].id,
      teacherId: teachers[4].id,
      userId: students[4].id,
      scores: {
        didatica: 3,
        assiduidade: 4,
        claridade: 3,
        postura: 4,
        disponibilidade: 3,
      },
    },

    // Avaliações da Dra. Patrícia (Cálculo)
    {
      comment:
        'Professora muito paciente e didática. Explica os conceitos matemáticos de forma que todos entendem.',
      disciplineId: disciplines[8].id,
      teacherId: teachers[5].id,
      userId: students[1].id,
      scores: {
        didatica: 5,
        assiduidade: 5,
        claridade: 5,
        postura: 5,
        disponibilidade: 5,
      },
    },
    {
      comment:
        'Ótima professora, mas a carga de exercícios é muito pesada. Dificulta conciliar com outras disciplinas.',
      disciplineId: disciplines[8].id,
      teacherId: teachers[5].id,
      userId: students[2].id,
      scores: {
        didatica: 4,
        assiduidade: 4,
        claridade: 4,
        postura: 4,
        disponibilidade: 3,
      },
    },

    // Avaliações adicionais para ter mais dados
    {
      comment:
        'Professor dedicado, mas poderia ser mais flexível com os prazos das entregas.',
      disciplineId: disciplines[2].id,
      teacherId: teachers[1].id,
      userId: students[4].id,
      scores: {
        didatica: 3,
        assiduidade: 4,
        claridade: 3,
        postura: 4,
        disponibilidade: 3,
      },
    },
    {
      comment:
        'Aulas excelentes! Professor sempre atualizado com as novas tecnologias.',
      disciplineId: disciplines[6].id,
      teacherId: teachers[0].id,
      userId: students[3].id,
      scores: {
        didatica: 4,
        assiduidade: 4,
        claridade: 4,
        postura: 4,
        disponibilidade: 4,
      },
    },
  ];

  // Criar avaliações com scores
  for (const evalData of evaluations) {
    await prisma.evaluation.create({
      data: {
        comment: evalData.comment,
        disciplineId: evalData.disciplineId,
        teacherId: evalData.teacherId,
        userId: evalData.userId,
        scores: {
          create: criteria.map((criterion) => ({
            criterionId: criterion,
            note: evalData.scores[criterion],
          })),
        },
      },
    });
  }

  console.log('🌱 Seed executado com sucesso!');
  console.log(`📊 Criados:`);
  console.log(
    `   👥 ${students.length + 1} usuários (${
      students.length
    } estudantes + 1 admin)`,
  );
  console.log(`   📚 ${disciplines.length} disciplinas`);
  console.log(`   👨‍🏫 ${teachers.length} professores`);
  console.log(`   ⭐ ${evaluations.length} avaliações`);
  console.log(`   📈 ${evaluations.length * 5} notas de avaliação`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
