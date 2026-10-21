// Conteúdo centralizado. Preencher somente com informações validadas pela equipe.
export const siteConfig = {
  title: 'Dossiê da Mulher Itaquaquecetubense',
  municipality: 'Prefeitura de Itaquaquecetuba',
  department: 'Secretaria da Mulher',
  source: 'Aguardando validação das fontes oficiais',
  referencePeriod: 'A definir com a equipe responsável',
  lastUpdated: '', // Data oficial dos dados em YYYY-MM-DD; não é a data de publicação do site.
};

export const powerBIConfig = {
  // URL HTTPS de incorporação fornecida pela equipe do Power BI.
  // Ao preencher, o relatório substitui automaticamente o estado de preparação.
  embedUrl: '',
  // URLs específicas, opcionais. Sem uma URL temática, usa-se o relatório geral.
  reportsByTopic: {} as Record<string, string>,
  title: 'Violência e rede de proteção — Dossiê da Mulher Itaquaquecetubense',
};

// Temas propostos para o relatório. Não representam dados ou indicadores já disponíveis.
export const topics = [
  { id: 'violencia', number: '01', icon: 'shield', title: 'Violência e proteção', short: 'Violência e proteção', description: 'Violência e rede de proteção.', measures: ['Registros de violência', 'Feminicídios e tentativas', 'Medidas protetivas', 'Atendimentos da rede'], note: 'A leitura deve considerar a subnotificação e as diferenças entre ocorrência, registro e atendimento.' },
  { id: 'saude', number: '02', icon: 'heart', title: 'Saúde e cuidado', short: 'Saúde e cuidado', description: 'Saúde e acesso ao cuidado.', measures: ['Notificações em saúde', 'Acesso aos serviços', 'Ações de prevenção'], note: 'Fontes, cobertura e critérios de cada indicador serão informados no relatório oficial.' },
  { id: 'educacao', number: '03', icon: 'book', title: 'Educação e trabalho', short: 'Educação e trabalho', description: 'Formação e autonomia.', measures: ['Escolaridade', 'Participação no trabalho', 'Qualificação profissional'], note: 'Indicadores de fontes diferentes podem ter períodos e populações de referência distintos.' },
  { id: 'territorio', number: '04', icon: 'pin', title: 'Território e população', short: 'Território e população', description: 'População e regiões.', measures: ['População feminina', 'Distribuição territorial', 'Contexto demográfico'], note: 'Comparações entre territórios devem considerar o tamanho da população e a disponibilidade de dados.' },
  { id: 'participacao', number: '05', icon: 'people', title: 'Participação e igualdade', short: 'Participação e igualdade', description: 'Representação das mulheres.', measures: ['Representação política', 'Participação social', 'Igualdade de oportunidades'], note: 'As definições e os recortes disponíveis dependerão das bases oficiais aprovadas.' },
  { id: 'politicas', number: '06', icon: 'building', title: 'Políticas e atendimento', short: 'Políticas e atendimento', description: 'Serviços e acolhimento.', measures: ['Rede de atendimento', 'Serviços municipais', 'Ações e programas'], note: 'O número de atendimentos pode incluir mais de um atendimento para a mesma pessoa.' },
] as const;

export const findTopic = (id?: string) => topics.find(topic => topic.id === id);
