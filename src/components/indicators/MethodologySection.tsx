import { Icon } from '../ui/Icon';

const questions = [
  { id: 'sobre', question: 'Sobre o projeto', answer: 'Portal público da proposta do Dossiê da Mulher Itaquaquecetubense, com foco na violência contra a mulher e na rede de proteção. Os temas e indicadores dependem da validação das bases oficiais.' },
  { id: 'fontes', question: 'Fontes e metodologia', answer: 'Cada gráfico informa sua fonte, unidade de medida e os períodos disponíveis. Os critérios de leitura são apresentados junto ao indicador, quando informados pela equipe responsável.' },
  { id: 'atualizacao', question: 'Atualização dos dados', answer: 'A equipe responsável cadastra e revisa os dados manualmente. Depois da publicação, a consulta pública recebe a nova versão ao abrir ou atualizar a página e verifica alterações a cada minuto enquanto estiver aberta. A data exibida é a data de publicação; os períodos de referência estão no gráfico.' },
  { id: 'privacidade', question: 'Privacidade e interpretação', answer: 'A proposta é publicar dados agregados, sem identificação de pessoas. Ao comparar períodos ou territórios, considere população, cobertura e diferenças de registro. Mais registros não significam, necessariamente, mais ocorrências.' },
];

export function MethodologySection() {
  return (
    <section id="metodologia" className="section methodology-section" aria-labelledby="methodology-title">
      <div className="container methodology-layout">
        <div className="methodology-intro"><p className="eyebrow">TRANSPARÊNCIA</p><h2 id="methodology-title">Sobre os dados</h2><p>Fontes, atualização e critérios de leitura.</p></div>
        <div className="faq">
          {questions.map(item => (
            <details id={item.id} key={item.id} data-reveal>
              <summary>{item.question}<Icon name="chevron" size={18} /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

